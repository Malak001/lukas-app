"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type IncomingInvite = {
  id: string;
  caller_id: string;
  call_format: "audio" | "video";
};

// Mounted once in the root layout so an incoming direct call rings no
// matter what page the callee is currently on.
export default function IncomingCallListener() {
  const router = useRouter();
  const [invite, setInvite] = useState<IncomingInvite | null>(null);
  const [callerName, setCallerName] = useState("Someone");
  const [responding, setResponding] = useState(false);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    // Guards against React (StrictMode/Fast Refresh) running this effect's
    // setup a second time before the first async lookup finishes: without
    // this, a channel could get created after cleanup already ran, and the
    // next mount would then try to re-subscribe the same channel topic and
    // throw "cannot add postgres_changes callbacks ... after subscribe()".
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`incoming-calls-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_call_invites",
            filter: `callee_id=eq.${user.id}`,
          },
          async (payload) => {
            const row = payload.new as IncomingInvite & { status: string };
            if (row.status !== "ringing") return;
            setInvite({ id: row.id, caller_id: row.caller_id, call_format: row.call_format });
            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", row.caller_id)
              .maybeSingle();
            setCallerName(profile?.name ?? "Someone");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "direct_call_invites",
            filter: `callee_id=eq.${user.id}`,
          },
          (payload) => {
            const row = payload.new as { id: string; status: string };
            // The caller cancelled before we answered — dismiss the banner.
            if (row.status !== "ringing") {
              setInvite((current) => (current?.id === row.id ? null : current));
            }
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (!invite) return null;

  async function respond(action: "accept" | "decline") {
    setResponding(true);
    try {
      const res = await fetch("/api/friends/call/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: invite!.id, action }),
      });
      const json = await res.json();
      setInvite(null);
      if (action === "accept" && res.ok && json.sessionId) {
        router.push(`/stage4/call/${json.sessionId}`);
      }
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-sm items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
        <div className="flex-1">
          <p className="font-semibold text-stone-900">{callerName} is calling</p>
          <p className="text-xs text-stone-500">
            {invite.call_format === "video" ? "Video call" : "Voice call"}
          </p>
        </div>
        <button
          onClick={() => respond("decline")}
          disabled={responding}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          Decline
        </button>
        <button
          onClick={() => respond("accept")}
          disabled={responding}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
