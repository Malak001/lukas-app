import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Bypasses Row Level Security. Never import this from a Client Component,
// and never send SUPABASE_SERVICE_ROLE_KEY to the browser.
// Used for: Stage 3 grading writes, Stage 4 matchmaking, and the admin page.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
