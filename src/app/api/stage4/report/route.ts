import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const REPORT_REASONS = [
  "harassment",
  "inappropriate_content",
  "spam_or_bot",
  "technical_issue",
  "other",
] as const;

const ReportSchema = z.object({
  sessionId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = ReportSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // RLS on call_sessions only allows reading rows the caller is part of, so
  // this also proves membership before we let them file a report against it.
  const { data: session } = await supabase
    .from("call_sessions")
    .select("user_a, user_b")
    .eq("id", body.data.sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const reportedUserId = session.user_a === user.id ? session.user_b : session.user_a;

  // reports' insert policy checks auth.uid() = reporter_id, so the regular
  // authenticated client can write this directly — no cross-user access
  // needed here.
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    call_session_id: body.data.sessionId,
    reason: body.data.reason,
  });

  if (error) {
    console.error("report insert error:", error.message);
    return NextResponse.json({ error: "Could not submit report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
