"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Person = { friendshipId: string; id: string; name: string };

export default function FriendsList({
  currentUserId,
  friends,
  incomingRequests,
  outgoingRequests,
}: {
  currentUserId: string;
  friends: Person[];
  incomingRequests: Person[];
  outgoingRequests: Person[];
}) {
  const router = useRouter();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [incoming, setIncoming] = useState(incomingRequests);
  const [outgoing, setOutgoing] = useState(outgoingRequests);
  const [callingId, setCallingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("presence:online-users", {
      config: { presence: { key: currentUserId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      setOnlineIds(new Set(Object.keys(channel.presenceState())));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  async function respond(friendshipId: string, action: "accept" | "decline") {
    const res = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    if (res.ok) {
      setIncoming((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
      router.refresh();
    }
  }

  async function cancelOutgoing(friendshipId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (!error) setOutgoing((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
  }

  async function call(friendId: string, callFormat: "audio" | "video") {
    setCallingId(friendId);
    try {
      const res = await fetch("/api/friends/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calleeId: friendId, callFormat }),
      });
      const json = await res.json();
      if (res.ok && json.inviteId) {
        router.push(`/friends/calling/${json.inviteId}`);
      } else {
        setCallingId(null);
      }
    } catch {
      setCallingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      {incoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
            Friend requests
          </h2>
          <div className="mt-2 space-y-2">
            {incoming.map((r) => (
              <div
                key={r.friendshipId}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
              >
                <span className="font-medium text-stone-900">{r.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(r.friendshipId, "decline")}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => respond(r.friendshipId, "accept")}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
            Requests sent
          </h2>
          <div className="mt-2 space-y-2">
            {outgoing.map((r) => (
              <div
                key={r.friendshipId}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
              >
                <span className="font-medium text-stone-900">{r.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">Pending</span>
                  <button
                    onClick={() => cancelOutgoing(r.friendshipId)}
                    className="text-sm font-medium text-stone-500 hover:text-red-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Friends</h2>
        {friends.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            No friends yet — add someone during or after a Stage 4 call.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {friends.map((f) => {
              const online = onlineIds.has(f.id);
              return (
                <div
                  key={f.friendshipId}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${online ? "bg-green-500" : "bg-stone-300"}`}
                      title={online ? "Online" : "Offline"}
                    />
                    <span className="font-medium text-stone-900">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/friends/${f.id}`}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Message
                    </Link>
                    <button
                      onClick={() => call(f.id, "audio")}
                      disabled={callingId === f.id}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                    >
                      Voice
                    </button>
                    <button
                      onClick={() => call(f.id, "video")}
                      disabled={callingId === f.id}
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      Video
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
