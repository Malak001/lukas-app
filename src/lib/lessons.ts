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
