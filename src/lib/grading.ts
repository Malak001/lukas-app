import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createAnthropicClient } from "./anthropic";
import { languageName, type LanguageCode } from "./languages";

const GradingSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  segments: z.array(
    z.object({
      segment_index: z.number().int(),
      score: z.number().int().min(0).max(100),
      feedback: z.string(),
    })
  ),
});

export type GradingResult = z.infer<typeof GradingSchema>;

export async function gradeTranslations(params: {
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
  segments: { index: number; targetText: string; userTranslation: string }[];
}): Promise<GradingResult> {
  const client = createAnthropicClient();

  const segmentsBlock = params.segments
    .map(
      (s) =>
        `Segment ${s.index}:\nOriginal (${languageName(params.targetLanguage)}): ${s.targetText}\nLearner's translation (${languageName(params.nativeLanguage)}): ${
          s.userTranslation.trim() || "(left blank)"
        }`
    )
    .join("\n\n");

  const response = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    output_config: {
      format: zodOutputFormat(GradingSchema),
      effort: "medium",
    },
    system: `You are grading a language learner's translation practice. For each segment, judge whether the learner's translation captures the same MEANING as the original — semantic accuracy matters, not exact wording or perfect grammar. Score each segment 0-100. Give one-sentence, encouraging, specific feedback per segment, written in ${languageName(
      params.nativeLanguage
    )}. Then give an overall_score (0-100) reflecting overall comprehension across all segments — it does not need to be a plain average, use your judgment.`,
    messages: [
      {
        role: "user",
        content: `Grade this ${languageName(params.targetLanguage)} → ${languageName(
          params.nativeLanguage
        )} translation practice:\n\n${segmentsBlock}`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Grading response did not include parsed output");
  }

  return response.parsed_output;
}
