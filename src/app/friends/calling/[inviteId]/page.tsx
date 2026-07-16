import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CallingScreen from "./CallingScreen";

export default async function CallingPage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const { inviteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: invite } = await supabase
    .from("direct_call_invites")
    .select("id, caller_id, callee_id, status, call_session_id")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite || invite.caller_id !== user.id) redirect("/friends");
  if (invite.status === "accepted" && invite.call_session_id) {
    redirect(`/stage4/call/${invite.call_session_id}`);
  }

  // profiles RLS only allows reading your own row — use the admin client
  // for this one cross-user name lookup.
  const admin = createAdminClient();
  const { data: calleeProfile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", invite.callee_id)
    .single();

  return (
    <CallingScreen
      inviteId={invite.id}
      calleeName={calleeProfile?.name ?? "your friend"}
      initialStatus={invite.status}
    />
  );
}
