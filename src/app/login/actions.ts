"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/app/signup/actions";

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Please fill in all fields." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message === "Email not confirmed") {
        return {
          error: "Please verify your email first — check your inbox for the confirmation link.",
        };
      }
      return { error: "Incorrect email or password." };
    }
  } catch (err) {
    console.error("login: unexpected error", err);
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." };
  }

  redirect("/");
}
