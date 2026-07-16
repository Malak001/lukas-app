import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const RespondSchema = z.object({
  friendshipId: z.string().uuid(),
  action: z.enum(["accept", "decline"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = RespondSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const status = body.data.action === "accept" ? "accepted" : "declined";

  // RLS only lets the recipient update, which also proves the request was
  // actually sent to this caller.
  const { error, count } = await supabase
    .from("friendships")
    .update({ status, responded_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", body.data.friendshipId)
    .eq("recipient_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("friend respond error:", error.message);
    return NextResponse.json({ error: "Could not update request" }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status });
}
