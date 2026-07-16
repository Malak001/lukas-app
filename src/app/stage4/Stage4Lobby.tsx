"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CallFormat = "audio" | "video";

type LobbyState =
  | { kind: "suspended" }
  | { kind: "picking" }
  | { kind: "joining" }
  | { kind: "queued"; format: CallFormat }
  | { kind: "timedOut" }
  | { kind: "error"; message: string };

const POLL_INTERVAL_MS = 2000;

export default function Stage4Lobby({ suspended }: { suspended: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<LobbyState>(suspended ? { kind: "suspended" } : { kind: "picking" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    const res = await fetch("/api/stage4/queue/status");
    if (!res.ok) return;
    const data = await res.json();

    if (data.matched) {
      stopPolling();
      router.push(`/stage4/call/${data.sessionId}`);
      return;
    }
    if (data.timedOut) {
      stopPolling();
      setState({ kind: "timedOut" });
      return;
    }
    if (!data.queued) {
      stopPolling();
      setState((prev) => (prev.kind === "queued" ? { kind: "picking" } : prev));
    }
  }, [router, stopPolling]);

  // On mount, resume an in-progress queue/match from a previous visit to this page.
  useEffect(() => {
    if (suspended) return;
    checkStatus();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);
  }, [checkStatus, stopPolling]);

  async function joinQueue(format: CallFormat) {
    setState({ kind: "joining" });
    try {
      const res = await fetch("/api/stage4/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callFormat: format }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ kind: "error", message: data.error ?? "Something went wrong." });
        return;
      }
      if (data.matched) {
        router.push(`/stage4/call/${data.sessionId}`);
        return;
      }
      setState({ kind: "queued", format });
      startPolling();
    } catch {
      setState({ kind: "error", message: "Could not reach the server. Try again." });
    }
  }

  async function cancelQueue() {
    stopPolling();
    await fetch("/api/stage4/queue", { method: "DELETE" });
    setState({ kind: "picking" });
  }

  if (state.kind === "suspended") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Your access to Stage 4 has been suspended pending review. Contact support if you think
        this is a mistake.
      </div>
    );
  }

  if (state.kind === "queued" || state.kind === "joining") {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        <p className="mt-4 font-medium text-stone-900">
          {state.kind === "joining" ? "Joining the queue..." : "Looking for a partner..."}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          This can take a minute — we&apos;re matching you with someone who speaks your target
          language natively and is learning yours.
        </p>
        {state.kind === "queued" && (
          <button
            onClick={cancelQueue}
            className="mt-4 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  if (state.kind === "timedOut") {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
        <p className="font-medium text-stone-900">No partners online right now</p>
        <p className="mt-1 text-sm text-stone-500">
          Nobody matching your languages was available. Try again in a bit.
        </p>
        <button
          onClick={() => setState({ kind: "picking" })}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {state.message}
        <button
          onClick={() => setState({ kind: "picking" })}
          className="mt-3 block rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        onClick={() => joinQueue("audio")}
        className="rounded-xl border border-stone-200 bg-white p-6 text-left transition hover:border-primary-300 hover:shadow-sm"
      >
        <h3 className="text-lg font-semibold text-stone-900">Voice call</h3>
        <p className="mt-1 text-sm text-stone-600">
          Audio only. Lower bandwidth, less pressure — good if you&apos;re not ready for video yet.
        </p>
      </button>
      <button
        onClick={() => joinQueue("video")}
        className="rounded-xl border border-stone-200 bg-white p-6 text-left transition hover:border-primary-300 hover:shadow-sm"
      >
        <h3 className="text-lg font-semibold text-stone-900">Video call</h3>
        <p className="mt-1 text-sm text-stone-600">
          Camera + audio. Feels like a real conversation with someone face to face.
        </p>
      </button>
    </div>
  );
}
