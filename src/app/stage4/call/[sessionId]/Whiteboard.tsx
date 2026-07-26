"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

// Data messages are scoped to this topic so they never collide with LiveKit's
// own built-in Chat component, which publishes on a different topic.
const WHITEBOARD_TOPIC = "whiteboard";
const COLORS = ["#111827", "#dc2626", "#2563eb", "#16a34a", "#ca8a04"];
const ERASER_COLOR = "#ffffff";

type Segment = { x0: number; y0: number; x1: number; y1: number; color: string; width: number };
type WBMessage =
  | { type: "draw"; seg: Segment }
  | { type: "clear" }
  | { type: "request-sync" }
  | { type: "sync"; segments: Segment[] };

export default function Whiteboard({ onClose }: { onClose: () => void }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Segments (not just the visible canvas) are kept in a ref so reopening the
  // panel locally — or a late-joining peer catching up via sync — can
  // fully redraw the board instead of starting from a blank canvas.
  const segmentsRef = useRef<Segment[]>([]);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [erasing, setErasing] = useState(false);

  const drawSegment = useCallback((seg: Segment) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = seg.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(seg.x0 * canvas.width, seg.y0 * canvas.height);
    ctx.lineTo(seg.x1 * canvas.width, seg.y1 * canvas.height);
    ctx.stroke();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const seg of segmentsRef.current) drawSegment(seg);
  }, [drawSegment]);

  const send = useCallback(
    (msg: WBMessage) => {
      const payload = new TextEncoder().encode(JSON.stringify(msg));
      void localParticipant.publishData(payload, { reliable: true, topic: WHITEBOARD_TOPIC });
    },
    [localParticipant]
  );

  // Keep the canvas's pixel size in sync with its displayed size, and redraw
  // existing strokes (a plain resize otherwise clears the canvas bitmap).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function handleResize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [redraw]);

  useEffect(() => {
    function handleData(payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) {
      if (topic !== WHITEBOARD_TOPIC) return;
      const msg = JSON.parse(new TextDecoder().decode(payload)) as WBMessage;
      if (msg.type === "draw") {
        segmentsRef.current.push(msg.seg);
        drawSegment(msg.seg);
      } else if (msg.type === "clear") {
        segmentsRef.current = [];
        redraw();
      } else if (msg.type === "request-sync") {
        if (segmentsRef.current.length > 0) {
          send({ type: "sync", segments: segmentsRef.current });
        }
      } else if (msg.type === "sync") {
        if (segmentsRef.current.length === 0 && msg.segments.length > 0) {
          segmentsRef.current = msg.segments;
          redraw();
        }
      }
    }

    room.on(RoomEvent.DataReceived, handleData);
    // Ask whoever's already drawn something to catch us up.
    send({ type: "request-sync" });

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, drawSegment, redraw, send]);

  function getRelativePoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true;
    lastPointRef.current = getRelativePoint(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !lastPointRef.current) return;
    const point = getRelativePoint(e);
    const seg: Segment = {
      x0: lastPointRef.current.x,
      y0: lastPointRef.current.y,
      x1: point.x,
      y1: point.y,
      color: erasing ? ERASER_COLOR : color,
      width: erasing ? 20 : 3,
    };
    segmentsRef.current.push(seg);
    drawSegment(seg);
    send({ type: "draw", seg });
    lastPointRef.current = point;
  }

  function handlePointerUp() {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function handleClear() {
    segmentsRef.current = [];
    redraw();
    send({ type: "clear" });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2">
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setErasing(false);
              }}
              className={`h-6 w-6 rounded-full border-2 ${
                color === c && !erasing ? "border-stone-900" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
          <button
            onClick={() => setErasing((v) => !v)}
            className={`rounded-lg border px-3 py-1 text-sm font-medium ${
              erasing ? "border-stone-900 bg-stone-100 text-stone-900" : "border-stone-300 text-stone-700"
            }`}
          >
            Eraser
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg border border-stone-300 px-3 py-1 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Clear
          </button>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
        >
          Close whiteboard
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="flex-1 touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
