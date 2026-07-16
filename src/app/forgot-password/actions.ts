"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/app/signup/actions";

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState & { sent?: boolean }> {
  const email = String(formData.get("email") || "").trim();
  if (!email) {
    return { error: "Please enter your email." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Always report success, whether or not the email exists, to avoid leaking
  // which addresses have accounts.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  return { error: null, sent: true };
}
