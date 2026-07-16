import "server-only";
import { createAdminClient } from "./supabase/admin";

export type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "accepted";

export async function getFriendshipStatus(
  userId: string,
  otherUserId: string
): Promise<FriendshipStatus> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("friendships")
    .select("requester_id, recipient_id, status")
    .or(
      `and(requester_id.eq.${userId},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${userId})`
    )
    .maybeSingle();

  if (!data || data.status === "declined") return "none";
  if (data.status === "accepted") return "accepted";
  return data.requester_id === userId ? "pending_sent" : "pending_received";
}
