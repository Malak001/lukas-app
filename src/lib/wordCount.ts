import type { LanguageCode } from "./languages";

// Chinese and Japanese don't separate words with spaces, so "word count" for
// those languages counts characters instead — matches how a learner actually
// perceives paragraph length in those scripts.
export function countWords(text: string, language: LanguageCode): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  if (language === "zh" || language === "ja") {
    return trimmed.replace(/\s/g, "").length;
  }
  return trimmed.split(/\s+/).length;
}
