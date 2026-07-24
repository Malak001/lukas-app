import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { languageName, type LanguageCode } from "@/lib/languages";
import { substituteLearnerName, type LessonContent } from "@/lib/lessons";
import Nav from "@/components/Nav";
import PracticeQuiz from "./PracticeQuiz";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ order: string }>;
}) {
  const { order } = await params;
  const lessonOrder = Number(order);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, native_language, target_language")
    .eq("id", user!.id)
    .single();

  const targetLanguage = profile!.target_language!;
  const nativeLanguage = profile!.native_language! as LanguageCode;

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, lesson_order, content")
    .eq("language", targetLanguage)
    .eq("stage", 1)
    .eq("lesson_order", lessonOrder)
    .single();

  if (!lesson) notFound();

  const content = lesson.content as LessonContent;
  content.phrases = substituteLearnerName(content.phrases, profile!.name);

  const { data: existingProgress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user!.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  const alreadyCompleted = !!existingProgress;

  const title = content.title[nativeLanguage] ?? content.title.en;

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/stage1" className="text-sm text-stone-500 hover:text-primary-600">
          ← All lessons
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900">
            Lesson {lesson.lesson_order}: {title}
          </h1>
          {alreadyCompleted && (
            <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              Completed
            </span>
          )}
        </div>
        <p className="mt-1 text-stone-600">Learning {languageName(targetLanguage)}</p>

        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900">Phrases</h2>
          <div className="mt-3 space-y-4">
            {content.phrases.map((phrase, i) => (
              <div key={i} className="border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                <p className="text-lg font-medium text-stone-900">{phrase.target_text}</p>
                <p className="text-sm text-stone-500 italic">{phrase.pronunciation}</p>
                <p className="text-sm text-stone-600">
                  {phrase.translations[nativeLanguage] ?? phrase.translations.en}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900">Example dialogue</h2>
          <div className="mt-3 space-y-3">
            {content.dialogue.map((line, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-stone-500">{line.speaker}</p>
                <p className="text-stone-900">{line.target_text}</p>
                <p className="text-sm text-stone-500 italic">{line.pronunciation}</p>
                <p className="text-sm text-stone-600">
                  {line.translations[nativeLanguage] ?? line.translations.en}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <PracticeQuiz
            lessonId={lesson.id}
            phrases={content.phrases}
            nativeLanguage={nativeLanguage}
            alreadyCompleted={alreadyCompleted}
          />
        </section>
      </main>
    </div>
  );
}
