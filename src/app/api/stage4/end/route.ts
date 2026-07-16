import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EndSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = EndSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const admin = createAdminClient();

  // Guard the update with an OR on user_a/user_b so a user can only end a
  // call they're actually part of, even though this goes through the
  // service-role client (which bypasses RLS).
  await admin
    .from("call_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", body.data.sessionId)
    .is("ended_at", null)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  return NextResponse.json({ ok: true });
}
