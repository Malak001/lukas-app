import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { languageName, type LanguageCode } from "@/lib/languages";
import type { LessonContent } from "@/lib/lessons";
import { GATING_DISABLED } from "@/lib/stages";
import Nav from "@/components/Nav";
import ExamRunner from "./ExamRunner";

export default async function Stage2Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("native_language, target_language")
    .eq("id", user!.id)
    .single();

  const targetLanguage = profile!.target_language!;
  const nativeLanguage = profile!.native_language! as LanguageCode;

  const { data: stageRow } = await supabase
    .from("user_stage")
    .select("current_stage")
    .eq("user_id", user!.id)
    .eq("language", targetLanguage)
    .maybeSingle();

  const currentStage = stageRow?.current_stage ?? 1;
  if (!GATING_DISABLED && currentStage < 2) redirect("/dashboard");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("lesson_order, content")
    .eq("language", targetLanguage)
    .eq("stage", 1)
    .order("lesson_order", { ascending: true });

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("language", targetLanguage)
    .single();

  const lessonsForExam = (lessons ?? []).map((l) => ({
    lesson_order: l.lesson_order,
    content: l.content as LessonContent,
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-primary-600">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Stage 2: Exam</h1>
        <p className="mt-1 text-stone-600">{languageName(targetLanguage)}</p>

        <ExamRunner
          examId={exam!.id}
          lessonsForExam={lessonsForExam}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage as LanguageCode}
        />
      </main>
    </div>
  );
}
