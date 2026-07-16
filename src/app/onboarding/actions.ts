"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGES } from "@/lib/languages";

export type OnboardingState = { error: string | null };

const VALID_CODES = new Set<string>(LANGUAGES.map((l) => l.code));

export async function saveLanguages(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const native = String(formData.get("native_language") || "");
  const target = String(formData.get("target_language") || "");

  if (!VALID_CODES.has(native) || !VALID_CODES.has(target)) {
    return { error: "Please choose a valid language." };
  }
  if (native === target) {
    return { error: "Your target language must be different from your native language." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const name =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "there";

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    name,
    native_language: native,
    target_language: target,
  });

  if (error) {
    return { error: "Something went wrong saving your languages. Please try again." };
  }

  redirect("/dashboard");
}
