import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const JoinSchema = z.object({
  callFormat: z.enum(["audio", "video"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = JoinSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("native_language, target_language, stage4_suspended")
    .eq("id", user.id)
    .single();

  if (!profile?.native_language || !profile.target_language) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }
  if (profile.stage4_suspended) {
    return NextResponse.json(
      { error: "Your access to Stage 4 has been suspended pending review." },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // Idempotent: if the caller already has an active session (e.g. they
  // refreshed the queue page after already being matched), hand it back
  // instead of joining the queue again.
  const { data: existingSession } = await admin
    .from("call_sessions")
    .select("id, room_name")
    .is("ended_at", null)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSession) {
    return NextResponse.json({
      matched: true,
      sessionId: existingSession.id,
      roomName: existingSession.room_name,
    });
  }

  const { data, error } = await admin.rpc("stage4_join_queue", {
    p_user_id: user.id,
    p_native_language: profile.native_language,
    p_target_language: profile.target_language,
    p_call_format: body.data.callFormat,
  });

  if (error) {
    console.error("stage4_join_queue error:", error.message);
    return NextResponse.json({ error: "Could not join the queue" }, { status: 500 });
  }

  const result = data?.[0];
  if (result?.matched) {
    return NextResponse.json({
      matched: true,
      sessionId: result.session_id,
      roomName: result.room_name,
    });
  }

  return NextResponse.json({ matched: false, queued: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  await admin.from("call_queue").delete().eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
