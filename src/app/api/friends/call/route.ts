import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CallSchema = z.object({
  calleeId: z.string().uuid(),
  callFormat: z.enum(["audio", "video"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = CallSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { calleeId, callFormat } = body.data;

  const { data: friendship } = await supabase
    .from("friendships")
    .select("status")
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${calleeId}),and(requester_id.eq.${calleeId},recipient_id.eq.${user.id})`
    )
    .eq("status", "accepted")
    .maybeSingle();

  if (!friendship) {
    return NextResponse.json({ error: "You can only call friends" }, { status: 403 });
  }

  // Reuse an existing still-ringing invite to the same friend instead of
  // spamming a new one if the caller double-clicks Call.
  const { data: existingInvite } = await supabase
    .from("direct_call_invites")
    .select("id")
    .eq("caller_id", user.id)
    .eq("callee_id", calleeId)
    .eq("status", "ringing")
    .maybeSingle();

  if (existingInvite) return NextResponse.json({ inviteId: existingInvite.id });

  const roomName = `direct-${randomUUID().replace(/-/g, "")}`;
  const { data: invite, error } = await supabase
    .from("direct_call_invites")
    .insert({ caller_id: user.id, callee_id: calleeId, call_format: callFormat, room_name: roomName })
    .select("id")
    .single();

  if (error || !invite) {
    console.error("create invite error:", error?.message);
    return NextResponse.json({ error: "Could not start the call" }, { status: 500 });
  }

  return NextResponse.json({ inviteId: invite.id });
}
