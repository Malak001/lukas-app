import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStage4Token, livekitServerUrl } from "@/lib/livekit";
import { getFriendshipStatus } from "@/lib/friends";

const TokenSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = TokenSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // RLS on call_sessions only allows reading rows where the caller is
  // user_a or user_b, so a row coming back at all is proof of membership.
  const { data: session } = await supabase
    .from("call_sessions")
    .select(
      "id, user_a, user_b, room_name, call_format, session_type, user_a_target, user_b_target, started_at, ended_at"
    )
    .eq("id", body.data.sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.ended_at) return NextResponse.json({ error: "Call has already ended" }, { status: 410 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const token = await createStage4Token({
    identity: user.id,
    name: profile?.name ?? "Learner",
    roomName: session.room_name,
    callFormat: session.call_format as "audio" | "video",
  });

  const isUserA = session.user_a === user.id;
  const partnerId = isUserA ? session.user_b : session.user_a;

  // profiles RLS only allows reading your own row, so use the admin client
  // for this one cross-user lookup (partner's display name for the call UI).
  const admin = createAdminClient();
  const { data: partnerProfile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", partnerId)
    .single();

  const friendshipStatus = await getFriendshipStatus(user.id, partnerId);

  return NextResponse.json({
    token,
    serverUrl: livekitServerUrl(),
    roomName: session.room_name,
    callFormat: session.call_format,
    sessionType: session.session_type as "matched" | "direct",
    startedAt: session.started_at,
    // The language to converse in right now switches halfway through the
    // session: phase 1 is user_a's target language, phase 2 is user_b's.
    // Both null for direct (untimed) friend calls.
    phase1Language: session.user_a_target,
    phase2Language: session.user_b_target,
    myTargetLanguage: isUserA ? session.user_a_target : session.user_b_target,
    partner: { id: partnerId, name: partnerProfile?.name ?? "Your partner" },
    friendshipStatus,
  });
}
