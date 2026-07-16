"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gradeTranslations } from "@/lib/grading";
import type { LanguageCode } from "@/lib/languages";

// Grades a single segment immediately, so the learner sees right/wrong
// feedback as soon as they finish each one instead of waiting until the end.
export async function checkStage3Segment(
  videoId: string,
  segmentIndex: number,
  targetText: string,
  userTranslation: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: video } = await supabase
    .from("stage3_videos")
    .select("language")
    .eq("id", videoId)
    .single();
  if (!video) throw new Error("Video not found");

  const { data: profile } = await supabase
    .from("profiles")
    .select("native_language")
    .eq("id", user.id)
    .single();

  const nativeLanguage = profile!.native_language as LanguageCode;
  const targetLanguage = video.language as LanguageCode;

  const result = await gradeTranslations({
    targetLanguage,
    nativeLanguage,
    segments: [{ index: segmentIndex, targetText, userTranslation }],
  });

  const graded = result.segments[0];
  return { score: graded.score, feedback: graded.feedback };
}

// Segments have already been graded one at a time via checkStage3Segment, so
// this just aggregates and saves — no additional Claude call. Overall score
// is the plain average of the segment scores.
export async function submitStage3Attempt(
  videoId: string,
  segments: {
    index: number;
    targetText: string;
    userTranslation: string;
    score: number;
    feedback: string;
  }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: video } = await supabase
    .from("stage3_videos")
    .select("language")
    .eq("id", videoId)
    .single();
  if (!video) throw new Error("Video not found");

  const targetLanguage = video.language as LanguageCode;

  const overallScore = Math.round(
    segments.reduce((sum, s) => sum + s.score, 0) / segments.length
  );
  const passed = overallScore >= 70;

  await supabase.from("stage3_attempts").insert({
    user_id: user.id,
    video_id: videoId,
    user_translation: segments.map(({ index, targetText, userTranslation }) => ({
      index,
      targetText,
      userTranslation,
    })),
    ai_score: overallScore,
    passed,
    feedback: segments.map(({ index, score, feedback }) => ({
      segment_index: index,
      score,
      feedback,
    })),
  });

  if (passed) {
    const { data: allVideos } = await supabase
      .from("stage3_videos")
      .select("id")
      .eq("language", targetLanguage);

    const { data: passedAttempts } = await supabase
      .from("stage3_attempts")
      .select("video_id")
      .eq("user_id", user.id)
      .eq("passed", true)
      .in("video_id", (allVideos ?? []).map((v) => v.id));

    const distinctPassed = new Set((passedAttempts ?? []).map((a) => a.video_id));

    if (distinctPassed.size >= 3) {
      const { data: existingStage } = await supabase
        .from("user_stage")
        .select("current_stage")
        .eq("user_id", user.id)
        .eq("language", targetLanguage)
        .maybeSingle();

      const nextStage = Math.max(existingStage?.current_stage ?? 1, 4);

      await supabase
        .from("user_stage")
        .upsert(
          { user_id: user.id, language: targetLanguage, current_stage: nextStage },
          { onConflict: "user_id,language" }
        );
    }
  }

  revalidatePath("/stage3");
  revalidatePath("/dashboard");

  return { score: overallScore, passed };
}
