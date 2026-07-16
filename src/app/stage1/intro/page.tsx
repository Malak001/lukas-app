import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { LanguageCode } from "@/lib/languages";
import Nav from "@/components/Nav";
import SelfIntroForm from "@/components/SelfIntroForm";
import { submitStage1Intro } from "./actions";

export default async function Stage1IntroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("native_language, target_language")
    .eq("id", user!.id)
    .single();

  const targetLanguage = profile!.target_language as LanguageCode;
  const nativeLanguage = profile!.native_language as LanguageCode;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("language", targetLanguage)
    .eq("stage", 1);

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user!.id)
    .in("lesson_id", (lessons ?? []).map((l) => l.id));

  const allLessonsComplete = (progress?.length ?? 0) >= (lessons?.length ?? 0);
  if (!allLessonsComplete) redirect("/stage1");

  const { data: existingAttempt } = await supabase
    .from("self_intro_attempts")
    .select("essay_text, overall_feedback, mistakes")
    .eq("user_id", user!.id)
    .eq("stage", 1)
    .eq("language", targetLanguage)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/stage1" className="text-sm text-stone-500 hover:text-primary-600">
          ← Stage 1
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Final step</h1>

        <SelfIntroForm
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          continueHref="/dashboard"
          onSubmit={submitStage1Intro}
          existingAttempt={
            existingAttempt
              ? {
                  essayText: existingAttempt.essay_text,
                  overallFeedback: existingAttempt.overall_feedback,
                  mistakes: existingAttempt.mistakes,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
