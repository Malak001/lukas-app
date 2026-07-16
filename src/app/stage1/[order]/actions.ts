"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function completeLesson(lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("language")
    .eq("id", lessonId)
    .single();
  if (!lesson) throw new Error("Lesson not found");

  await supabase
    .from("lesson_progress")
    .upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id" });

  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("language", lesson.language)
    .eq("stage", 1);

  const { data: completedRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .in("lesson_id", (allLessons ?? []).map((l) => l.id));

  const allComplete = (completedRows?.length ?? 0) >= (allLessons?.length ?? 0);

  // Stage 1 no longer completes here — finishing all lessons unlocks the
  // "introduce yourself" essay at /stage1/intro, and that's what advances
  // current_stage to 2 once submitted.

  revalidatePath("/stage1");
  revalidatePath("/dashboard");

  return { allComplete };
}
