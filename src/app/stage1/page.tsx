import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { languageName } from "@/lib/languages";
import type { LessonContent } from "@/lib/lessons";
import Nav from "@/components/Nav";

export default async function Stage1Page() {
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
  const nativeLanguage = profile!.native_language!;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, lesson_order, content")
    .eq("language", targetLanguage)
    .eq("stage", 1)
    .order("lesson_order", { ascending: true });

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user!.id)
    .in("lesson_id", (lessons ?? []).map((l) => l.id));

  const completedIds = new Set((progress ?? []).map((p) => p.lesson_id));

  const lessonList = lessons ?? [];
  const completedFlags = lessonList.map((l) => completedIds.has(l.id));
  const unlockedFlags = completedFlags.map((_, i) => i === 0 || completedFlags[i - 1]);
  const allLessonsComplete = lessonList.length > 0 && completedFlags.every(Boolean);

  const { data: introAttempt } = allLessonsComplete
    ? await supabase
        .from("self_intro_attempts")
        .select("id")
        .eq("user_id", user!.id)
        .eq("stage", 1)
        .eq("language", targetLanguage)
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-primary-600">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">
          Stage 1: Introductions & Daily Conversation
        </h1>
        <p className="mt-1 text-stone-600">
          Learning {languageName(targetLanguage)} · shown in {languageName(nativeLanguage)}
        </p>

        <div className="mt-6 space-y-3">
          {lessonList.map((lesson, i) => {
            const content = lesson.content as LessonContent;
            const completed = completedFlags[i];
            const unlocked = unlockedFlags[i];

            const title =
              content.title[nativeLanguage as keyof typeof content.title] ?? content.title.en;

            const card = (
              <div
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  unlocked ? "bg-white border-stone-200" : "bg-stone-100 border-stone-200 opacity-60"
                } ${unlocked ? "hover:shadow-sm" : ""}`}
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                    Lesson {lesson.lesson_order}
                  </span>
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                    completed
                      ? "bg-green-50 text-green-700 border-green-200"
                      : unlocked
                        ? "bg-primary-50 text-primary-700 border-primary-200"
                        : "bg-stone-100 text-stone-400 border-stone-200"
                  }`}
                >
                  {completed ? "Completed" : unlocked ? "Start" : "Locked"}
                </span>
              </div>
            );

            return unlocked ? (
              <Link key={lesson.id} href={`/stage1/${lesson.lesson_order}`}>
                {card}
              </Link>
            ) : (
              <div key={lesson.id}>{card}</div>
            );
          })}
        </div>

        {allLessonsComplete && (
          <Link
            href="/stage1/intro"
            className="mt-3 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 p-4 hover:shadow-sm"
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-primary-400">
                Final step
              </span>
              <h3 className="font-semibold text-primary-900">Introduce yourself</h3>
            </div>
            <span className="rounded-full border border-primary-200 bg-white px-2 py-0.5 text-xs font-medium text-primary-700">
              {introAttempt ? "Completed" : "Start"}
            </span>
          </Link>
        )}
      </main>
    </div>
  );
}
