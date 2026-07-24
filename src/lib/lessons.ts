import type { LanguageCode } from "./languages";

export type Translations = Record<LanguageCode, string>;

export type Phrase = {
  target_text: string;
  pronunciation: string;
  translations: Translations;
};

export type DialogueLine = {
  speaker: string;
  target_text: string;
  pronunciation: string;
  translations: Translations;
};

export type LessonContent = {
  lesson_order: number;
  title: Translations;
  phrases: Phrase[];
  dialogue: DialogueLine[];
};

// The "introduce yourself" phrase's target_text and every translation key
// embed a {name} token instead of a fixed placeholder name, so it can be
// swapped in for the actual logged-in learner's own name at render time.
const NAME_TOKEN = "{name}";

export function substituteLearnerName(phrases: Phrase[], name: string): Phrase[] {
  return phrases.map((phrase) => ({
    ...phrase,
    target_text: phrase.target_text.split(NAME_TOKEN).join(name),
    translations: Object.fromEntries(
      Object.entries(phrase.translations).map(([lang, text]) => [
        lang,
        text.split(NAME_TOKEN).join(name),
      ])
    ) as Translations,
  }));
}
