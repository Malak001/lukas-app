import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CallRoom from "./CallRoom";

export default async function CallPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS on call_sessions only returns this row if the caller is user_a or
  // user_b, so a missing row means either it doesn't exist or isn't theirs.
  const { data: session } = await supabase
    .from("call_sessions")
    .select("id, ended_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.ended_at) redirect("/stage4");

  return <CallRoom sessionId={sessionId} />;
}
