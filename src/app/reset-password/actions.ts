"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/app/signup/actions";

export async function resetPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: "That reset link has expired. Please request a new one." };
    }
  } catch (err) {
    console.error("resetPassword: unexpected error", err);
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." };
  }

  redirect("/");
}
