import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const RequestSchema = z.object({ recipientId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = RequestSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { recipientId } = body.data;
  if (recipientId === user.id) {
    return NextResponse.json({ error: "Can't add yourself as a friend" }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("friendships").insert({
    requester_id: user.id,
    recipient_id: recipientId,
  });

  if (!insertError) {
    return NextResponse.json({ status: "pending_sent" });
  }

  // 23505 = unique_violation: a friendship row for this pair already exists
  // (in either direction) thanks to the least()/greatest() unique index.
  if (insertError.code !== "23505") {
    console.error("friend request insert error:", insertError.message);
    return NextResponse.json({ error: "Could not send request" }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("friendships")
    .select("id, requester_id, status")
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`
    )
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Could not send request" }, { status: 500 });
  if (existing.status === "accepted") return NextResponse.json({ status: "accepted" });

  if (existing.status === "pending" && existing.requester_id === recipientId) {
    // Mutual tap: they already requested me, I'm now requesting them back —
    // treat it as acceptance instead of leaving a duplicate pending request.
    const { error: updateError } = await supabase
      .from("friendships")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (updateError) {
      console.error("mutual-tap accept error:", updateError.message);
      return NextResponse.json({ error: "Could not accept request" }, { status: 500 });
    }
    return NextResponse.json({ status: "accepted" });
  }

  return NextResponse.json({
    status: existing.status === "pending" ? "pending_sent" : existing.status,
  });
}
