import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createAnthropicClient } from "./anthropic";
import { languageName, type LanguageCode } from "./languages";

const SelfIntroGradingSchema = z.object({
  overallFeedback: z.string(),
  mistakes: z.array(
    z.object({
      original: z.string(),
      correction: z.string(),
      explanation: z.string(),
    })
  ),
});

export type SelfIntroGradingResult = z.infer<typeof SelfIntroGradingSchema>;

export async function gradeSelfIntro(params: {
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
  essayText: string;
}): Promise<SelfIntroGradingResult> {
  const client = createAnthropicClient();

  const response = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    output_config: {
      format: zodOutputFormat(SelfIntroGradingSchema),
      effort: "medium",
    },
    system: `You are reviewing a language learner's self-introduction paragraph, written in ${languageName(
      params.targetLanguage
    )}. Find grammar, spelling, word-choice, and conjugation mistakes. For each mistake, quote the exact original word or phrase from their text, give the corrected version (both in ${languageName(
      params.targetLanguage
    )}), and briefly explain why in ${languageName(
      params.nativeLanguage
    )}. Only flag real mistakes — do not nitpick style or stylistic phrasing that is still correct. If the paragraph has no mistakes, return an empty mistakes array. Then write one short, encouraging overallFeedback sentence in ${languageName(
      params.nativeLanguage
    )}.`,
    messages: [
      {
        role: "user",
        content: `Review this self-introduction paragraph:\n\n${params.essayText}`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Self-intro grading response did not include parsed output");
  }

  return response.parsed_output;
}
