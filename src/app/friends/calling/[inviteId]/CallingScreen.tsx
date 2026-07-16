"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const RING_TIMEOUT_MS = 30_000;

export default function CallingScreen({
  inviteId,
  calleeName,
  initialStatus,
}: {
  inviteId: string;
  calleeName: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const startedAtRef = useRef(Date.now());

  const cancel = useCallback(
    async (localStatus: "cancelled" | "no_answer" = "cancelled") => {
      await fetch("/api/friends/call/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action: "cancel" }),
      });
      setStatus(localStatus);
    },
    [inviteId]
  );

  useEffect(() => {
    if (status !== "ringing") return;

    const supabase = createClient();
    const channel = supabase
      .channel(`invite-${inviteId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_call_invites",
          filter: `id=eq.${inviteId}`,
        },
        (payload) => {
          const row = payload.new as { status: string; call_session_id: string | null };
          if (row.status === "accepted" && row.call_session_id) {
            router.push(`/stage4/call/${row.call_session_id}`);
          } else if (row.status !== "ringing") {
            setStatus(row.status);
          }
        }
      )
      .subscribe();

    const timeout = setTimeout(() => {
      void cancel("no_answer");
    }, RING_TIMEOUT_MS);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeout);
    };
  }, [status, inviteId, router, cancel]);

  if (status === "declined") return <EndState message={`${calleeName} declined the call.`} />;
  if (status === "no_answer") return <EndState message={`${calleeName} didn't answer.`} />;
  if (status === "cancelled") return <EndState message="Call cancelled." />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        <p className="mt-4 font-medium text-stone-900">Calling {calleeName}…</p>
        <button
          onClick={() => cancel("cancelled")}
          className="mt-4 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EndState({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 text-center">
        <p className="text-stone-900">{message}</p>
        <button
          onClick={() => router.push("/friends")}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Back to Friends
        </button>
      </div>
    </div>
  );
}
