// Single source of truth for supported languages.
// Add a language here and it becomes available across onboarding, lessons, exams, and matching.
export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Mandarin Chinese" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}
