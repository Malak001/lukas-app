"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGES } from "@/lib/languages";

export type AccountActionState = { error: string | null; success?: boolean };

const VALID_CODES = new Set<string>(LANGUAGES.map((l) => l.code));

export async function updateTargetLanguage(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const target = String(formData.get("target_language") || "");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Your session expired. Please log in again." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("native_language")
      .eq("id", user.id)
      .single();

    if (!VALID_CODES.has(target)) {
      return { error: "Please choose a valid language." };
    }
    if (target === profile?.native_language) {
      return { error: "Your target language must be different from your native language." };
    }

    // No need to touch lesson_progress/user_stage here: both are keyed by
    // language, so a language the user hasn't studied yet simply has no rows
    // and naturally starts at Stage 1.
    const { error } = await supabase
      .from("profiles")
      .update({ target_language: target })
      .eq("id", user.id);

    if (error) return { error: "Something went wrong. Please try again." };

    revalidatePath("/dashboard");
    revalidatePath("/account");
    return { error: null, success: true };
  } catch (err) {
    console.error("updateTargetLanguage: error", err instanceof Error ? err.message : err);
    return { error: "Something went wrong. Please try again." };
  }
}
