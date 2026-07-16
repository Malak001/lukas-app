import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const RespondSchema = z.object({
  inviteId: z.string().uuid(),
  action: z.enum(["accept", "decline", "cancel"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = RespondSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { inviteId, action } = body.data;

  const { data: invite } = await supabase
    .from("direct_call_invites")
    .select("id, caller_id, callee_id, call_format, room_name, status")
    .eq("id", inviteId)
    .single();

  if (!invite) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  if (action === "cancel") {
    if (invite.caller_id !== user.id) {
      return NextResponse.json({ error: "Not your call" }, { status: 403 });
    }
    await supabase
      .from("direct_call_invites")
      .update({ status: "cancelled", responded_at: new Date().toISOString() })
      .eq("id", inviteId)
      .eq("status", "ringing");
    return NextResponse.json({ ok: true });
  }

  if (invite.callee_id !== user.id) {
    return NextResponse.json({ error: "Not your call" }, { status: 403 });
  }
  if (invite.status !== "ringing") {
    return NextResponse.json({ error: "Call is no longer active" }, { status: 410 });
  }

  if (action === "decline") {
    await supabase
      .from("direct_call_invites")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", inviteId)
      .eq("status", "ringing");
    return NextResponse.json({ ok: true });
  }

  // Accept: call_sessions has no per-user insert policy (same as Stage 4
  // matched sessions) since it must be writable across both participants
  // symmetrically, so this goes through the admin client.
  const admin = createAdminClient();
  const { data: session, error: sessionError } = await admin
    .from("call_sessions")
    .insert({
      user_a: invite.caller_id,
      user_b: invite.callee_id,
      room_name: invite.room_name,
      call_format: invite.call_format,
      session_type: "direct",
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("direct call session create error:", sessionError?.message);
    return NextResponse.json({ error: "Could not start the call" }, { status: 500 });
  }

  await admin
    .from("direct_call_invites")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
      call_session_id: session.id,
    })
    .eq("id", inviteId);

  return NextResponse.json({ ok: true, sessionId: session.id });
}
