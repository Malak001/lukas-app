"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null };

export async function signup(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    return { error: "Please fill in all fields." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      console.error("signup: supabase auth error", {
        name: error.name,
        status: error.status,
        code: error.code,
        message: error.message,
      });
      return { error: error.message || "Something went wrong. Please try again." };
    }
  } catch (err) {
    console.error("signup: unexpected error", err instanceof Error ? err.message : err);
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." };
  }

  redirect("/verify-email");
}
