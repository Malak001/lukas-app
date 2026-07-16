"use client";

import "@livekit/components-styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  VideoConference,
  AudioConference,
  Chat,
  useRemoteParticipants,
} from "@livekit/components-react";
import { languageName } from "@/lib/languages";
import type { LanguageCode } from "@/lib/languages";

const SESSION_SECONDS = 600;
const PHASE_SECONDS = 300;

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "harassment", label: "Harassment or abuse" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "spam_or_bot", label: "Spam or bot" },
  { value: "technical_issue", label: "Technical issue" },
  { value: "other", label: "Other" },
];

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "accepted";

type TokenData = {
  token: string;
  serverUrl: string;
  callFormat: "audio" | "video";
  sessionType: "matched" | "direct";
  startedAt: string;
  phase1Language: LanguageCode | null;
  phase2Language: LanguageCode | null;
  myTargetLanguage: LanguageCode | null;
  partner: { id: string; name: string };
  friendshipStatus: FriendshipStatus;
};

export default function CallRoom({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callEnded, setCallEnded] = useState(false);
  const endedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stage4/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not join the call.");
          return;
        }
        setData(json);
      } catch {
        setError("Could not reach the server.");
      }
    })();
  }, [sessionId]);

  const endCall = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    await fetch("/api/stage4/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  }, [sessionId]);

  const handleLeave = useCallback(async () => {
    await endCall();
    setCallEnded(true);
  }, [endCall]);

  const backHref = data?.sessionType === "direct" ? "/friends" : "/stage4";

  if (error) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.push("/stage4")}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Back to Stage 4
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (callEnded) {
    return (
      <PostCallScreen
        partner={data.partner}
        friendshipStatus={data.friendshipStatus}
        onDone={() => router.push(backHref)}
      />
    );
  }

  return (
    <LiveKitRoom
      serverUrl={data.serverUrl}
      token={data.token}
      audio
      video={data.callFormat === "video"}
      data-lk-theme="default"
      className="flex min-h-screen flex-col"
      onDisconnected={() => {
        void handleLeave();
      }}
    >
      <CallHeader
        sessionType={data.sessionType}
        startedAt={data.startedAt}
        phase1Language={data.phase1Language}
        phase2Language={data.phase2Language}
        myTargetLanguage={data.myTargetLanguage}
        partner={data.partner}
        friendshipStatus={data.friendshipStatus}
        sessionId={sessionId}
        onTimeUp={handleLeave}
        onLeave={handleLeave}
      />
      <div className="flex flex-1 overflow-hidden">
        {data.callFormat === "video" ? (
          <div className="flex-1">
            <VideoConference />
          </div>
        ) : (
          <>
            <div className="flex-1">
              <AudioConference />
            </div>
            <div className="w-80 shrink-0 border-l border-stone-800">
              <Chat />
            </div>
          </>
        )}
      </div>
      <PartnerLeftWatcher onPartnerLeft={handleLeave} />
    </LiveKitRoom>
  );
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

function CallHeader({
  sessionType,
  startedAt,
  phase1Language,
  phase2Language,
  myTargetLanguage,
  partner,
  friendshipStatus,
  sessionId,
  onTimeUp,
  onLeave,
}: {
  sessionType: "matched" | "direct";
  startedAt: string;
  phase1Language: LanguageCode | null;
  phase2Language: LanguageCode | null;
  myTargetLanguage: LanguageCode | null;
  partner: { id: string; name: string };
  friendshipStatus: FriendshipStatus;
  sessionId: string;
  onTimeUp: () => void;
  onLeave: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const timeUpFired = useRef(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = (now - new Date(startedAt).getTime()) / 1000;

  // Direct friend calls are free-form: no phase split, no auto-end timer.
  const structured = sessionType === "matched" && phase1Language && phase2Language && myTargetLanguage;
  const remaining = structured ? SESSION_SECONDS - elapsed : null;
  const phase = structured && elapsed < PHASE_SECONDS ? 1 : 2;
  const phaseLanguage = structured ? (phase === 1 ? phase1Language : phase2Language) : null;
  const phaseRemaining = structured
    ? phase === 1
      ? PHASE_SECONDS - elapsed
      : SESSION_SECONDS - elapsed
    : null;
  const isMyTurn = structured && phaseLanguage === myTargetLanguage;

  useEffect(() => {
    if (structured && remaining !== null && remaining <= 0 && !timeUpFired.current) {
      timeUpFired.current = true;
      onTimeUp();
    }
  }, [structured, remaining, onTimeUp]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 bg-stone-900 px-4 py-3 text-stone-100">
      <div>
        {structured && phaseLanguage ? (
          <>
            <p className="text-sm font-semibold">
              Phase {phase} of 2 — {languageName(phaseLanguage)}
            </p>
            <p className="text-xs text-stone-400">
              {isMyTurn
                ? `Your turn to practice — ${formatClock(phaseRemaining!)} left`
                : `Help your partner practice — ${formatClock(phaseRemaining!)} left`}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">Call with {partner.name}</p>
            <p className="text-xs text-stone-400">{formatClock(elapsed)} elapsed</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {structured && (
          <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-medium text-stone-300">
            {formatClock(remaining!)} total
          </span>
        )}
        <AddFriendButton partnerId={partner.id} initialStatus={friendshipStatus} />
        <button
          onClick={() => setReportOpen(true)}
          className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-800"
        >
          Report
        </button>
        <button
          onClick={onLeave}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Leave call
        </button>
      </div>
      {reportOpen && (
        <ReportModal sessionId={sessionId} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}

function AddFriendButton({
  partnerId,
  initialStatus,
}: {
  partnerId: string;
  initialStatus: FriendshipStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === "accepted") {
    return (
      <span className="rounded-lg border border-green-700 px-3 py-1.5 text-xs font-medium text-green-400">
        Friends ✓
      </span>
    );
  }
  if (status === "pending_sent") {
    return (
      <span className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-400">
        Request sent
      </span>
    );
  }

  async function send() {
    setLoading(true);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: partnerId }),
      });
      const json = await res.json();
      if (res.ok) setStatus(json.status);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={send}
      disabled={loading}
      className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-800 disabled:opacity-50"
    >
      {loading ? "…" : status === "pending_received" ? "Accept friend request" : "Add friend"}
    </button>
  );
}

function PostCallScreen({
  partner,
  friendshipStatus,
  onDone,
}: {
  partner: { id: string; name: string };
  friendshipStatus: FriendshipStatus;
  onDone: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 text-center">
        <h2 className="text-lg font-semibold text-stone-900">Call ended</h2>
        <p className="mt-1 text-sm text-stone-600">You talked with {partner.name}.</p>
        <div className="mt-5 flex justify-center">
          <AddFriendButtonLight partnerId={partner.id} initialStatus={friendshipStatus} />
        </div>
        <button
          onClick={onDone}
          className="mt-5 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// Same behavior as AddFriendButton, styled for the light post-call card
// instead of the dark in-call header.
function AddFriendButtonLight({
  partnerId,
  initialStatus,
}: {
  partnerId: string;
  initialStatus: FriendshipStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === "accepted") {
    return (
      <span className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
        Friends ✓
      </span>
    );
  }
  if (status === "pending_sent") {
    return (
      <span className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-500">
        Request sent
      </span>
    );
  }

  async function send() {
    setLoading(true);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: partnerId }),
      });
      const json = await res.json();
      if (res.ok) setStatus(json.status);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={send}
      disabled={loading}
      className="rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
    >
      {loading ? "…" : status === "pending_received" ? "Accept friend request" : "Add as friend"}
    </button>
  );
}

function ReportModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function submit() {
    setStatus("submitting");
    try {
      const res = await fetch("/api/stage4/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, reason }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 text-stone-900">
        {status === "done" ? (
          <>
            <p className="font-medium">Report submitted.</p>
            <p className="mt-1 text-sm text-stone-600">
              Thanks — we&apos;ll review it. You can keep talking or leave the call.
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <h3 className="font-semibold">Report this call</h3>
            <label className="mt-3 block text-sm font-medium text-stone-700">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {status === "error" && (
              <p className="mt-2 text-sm text-red-600">Could not submit. Try again.</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={status === "submitting"}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Ends the call gracefully for the remaining participant if their partner
// disconnects mid-session, instead of leaving them talking to an empty room.
function PartnerLeftWatcher({ onPartnerLeft }: { onPartnerLeft: () => void }) {
  const remoteParticipants = useRemoteParticipants();
  const hasSeenPartner = useRef(false);
  const fired = useRef(false);

  useEffect(() => {
    if (remoteParticipants.length > 0) {
      hasSeenPartner.current = true;
    } else if (hasSeenPartner.current && !fired.current) {
      fired.current = true;
      onPartnerLeft();
    }
  }, [remoteParticipants.length, onPartnerLeft]);

  return null;
}
