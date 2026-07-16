import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const QUEUE_TIMEOUT_MS = 5 * 60 * 1000;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();

  const { data: session } = await admin
    .from("call_sessions")
    .select("id, room_name")
    .is("ended_at", null)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (session) {
    return NextResponse.json({
      matched: true,
      sessionId: session.id,
      roomName: session.room_name,
    });
  }

  const { data: queueEntry } = await admin
    .from("call_queue")
    .select("joined_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!queueEntry) {
    return NextResponse.json({ matched: false, queued: false });
  }

  const waitedMs = Date.now() - new Date(queueEntry.joined_at).getTime();
  if (waitedMs >= QUEUE_TIMEOUT_MS) {
    await admin.from("call_queue").delete().eq("user_id", user.id);
    return NextResponse.json({ matched: false, queued: false, timedOut: true });
  }

  return NextResponse.json({ matched: false, queued: true, waitedMs });
}
