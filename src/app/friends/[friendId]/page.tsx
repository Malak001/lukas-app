import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Nav from "@/components/Nav";
import DMChat from "./DMChat";

export default async function DMPage({
  params,
}: {
  params: Promise<{ friendId: string }>;
}) {
  const { friendId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: friendship } = await supabase
    .from("friendships")
    .select("status")
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${friendId}),and(requester_id.eq.${friendId},recipient_id.eq.${user.id})`
    )
    .eq("status", "accepted")
    .maybeSingle();

  if (!friendship) redirect("/friends");

  // profiles RLS only allows reading your own row — admin client for this
  // one cross-user name lookup.
  const admin = createAdminClient();
  const { data: friendProfile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", friendId)
    .single();

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, translated_body, translated_language, created_at")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Nav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <Link href="/friends" className="text-sm text-stone-500 hover:text-primary-600">
          ← Friends
        </Link>
        <h1 className="mt-2 text-xl font-bold text-stone-900">{friendProfile?.name ?? "Friend"}</h1>
        <DMChat
          currentUserId={user.id}
          friendId={friendId}
          friendName={friendProfile?.name ?? "Friend"}
          initialMessages={messages ?? []}
        />
      </main>
    </div>
  );
}
