"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitExamAttempt(
  examId: string,
  score: number,
  passed: boolean,
  answers: Record<string, string>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: exam } = await supabase.from("exams").select("language").eq("id", examId).single();
    if (!exam) throw new Error("Exam not found");

    await supabase.from("exam_attempts").insert({
      user_id: user.id,
      exam_id: examId,
      score,
      passed,
      answers,
    });

    // Passing the exam no longer advances current_stage directly — it unlocks
    // the "introduce yourself" essay at /stage2/intro, and that's what advances
    // current_stage to 3 once submitted.

    revalidatePath("/dashboard");
    revalidatePath("/stage2");
  } catch (err) {
    console.error("submitExamAttempt: error", err instanceof Error ? err.message : err);
    throw err;
  }
}
