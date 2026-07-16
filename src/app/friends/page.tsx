import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Nav from "@/components/Nav";
import FriendsList from "./FriendsList";

type ProfileLite = { id: string; name: string };

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, requester_id, recipient_id, status, created_at")
    .or(`requester_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
    .neq("status", "declined");

  const accepted = (friendships ?? []).filter((f) => f.status === "accepted");
  const incoming = (friendships ?? []).filter(
    (f) => f.status === "pending" && f.recipient_id === user!.id
  );
  const outgoing = (friendships ?? []).filter(
    (f) => f.status === "pending" && f.requester_id === user!.id
  );

  const otherIds = new Set<string>();
  for (const f of accepted) otherIds.add(f.requester_id === user!.id ? f.recipient_id : f.requester_id);
  for (const f of incoming) otherIds.add(f.requester_id);
  for (const f of outgoing) otherIds.add(f.recipient_id);

  // profiles RLS only allows reading your own row — this page needs to show
  // names for other users you have an (accepted or pending) relationship
  // with, so it uses the admin client for that one batch lookup.
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name")
    .in("id", otherIds.size > 0 ? Array.from(otherIds) : ["00000000-0000-0000-0000-000000000000"]);

  const profileById = new Map<string, ProfileLite>((profiles ?? []).map((p) => [p.id, p]));

  const friends = accepted.map((f) => {
    const friendId = f.requester_id === user!.id ? f.recipient_id : f.requester_id;
    return { friendshipId: f.id, id: friendId, name: profileById.get(friendId)?.name ?? "Unknown" };
  });
  const incomingRequests = incoming.map((f) => ({
    friendshipId: f.id,
    id: f.requester_id,
    name: profileById.get(f.requester_id)?.name ?? "Unknown",
  }));
  const outgoingRequests = outgoing.map((f) => ({
    friendshipId: f.id,
    id: f.recipient_id,
    name: profileById.get(f.recipient_id)?.name ?? "Unknown",
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-primary-600">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Friends</h1>
        <p className="mt-1 text-stone-600">
          People you&apos;ve added from Stage 4 calls. Message or call them directly, anytime.
        </p>

        <FriendsList
          currentUserId={user!.id}
          friends={friends}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
        />
      </main>
    </div>
  );
}
