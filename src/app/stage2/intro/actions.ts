"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gradeSelfIntro } from "@/lib/selfIntroGrading";
import { countWords } from "@/lib/wordCount";
import type { LanguageCode } from "@/lib/languages";

const MAX_WORDS = 100;

export async function submitStage2Intro(essayText: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("native_language, target_language")
    .eq("id", user.id)
    .single();

  const nativeLanguage = profile!.native_language as LanguageCode;
  const targetLanguage = profile!.target_language as LanguageCode;

  const wordCount = countWords(essayText, targetLanguage);
  if (wordCount === 0 || wordCount > MAX_WORDS) {
    throw new Error(`Essay must be between 1 and ${MAX_WORDS} words`);
  }

  const { overallFeedback, mistakes } = await gradeSelfIntro({
    targetLanguage,
    nativeLanguage,
    essayText,
  });

  await supabase.from("self_intro_attempts").insert({
    user_id: user.id,
    stage: 2,
    language: targetLanguage,
    essay_text: essayText,
    word_count: wordCount,
    overall_feedback: overallFeedback,
    mistakes,
  });

  const { data: existingStage } = await supabase
    .from("user_stage")
    .select("current_stage")
    .eq("user_id", user.id)
    .eq("language", targetLanguage)
    .maybeSingle();

  const nextStage = Math.max(existingStage?.current_stage ?? 1, 3);

  await supabase
    .from("user_stage")
    .upsert(
      { user_id: user.id, language: targetLanguage, current_stage: nextStage },
      { onConflict: "user_id,language" }
    );

  revalidatePath("/stage2");
  revalidatePath("/dashboard");

  return { overallFeedback, mistakes };
}
