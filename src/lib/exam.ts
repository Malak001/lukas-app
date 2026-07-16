import type { LessonContent, Phrase, DialogueLine } from "./lessons";
import type { LanguageCode } from "./languages";

// Arabic/Chinese/Japanese use non-Latin scripts. Typing them without a
// native-script keyboard/IME is hard, so we accept the romanized
// pronunciation as an equally valid typed answer for these languages.
const ROMANIZED_LANGS = new Set<LanguageCode>(["ar", "zh", "ja"]);

export type ExamQuestion =
  | {
      type: "mc";
      id: string;
      sourceLessonOrder: number;
      sourceLessonTitle: string;
      promptText: string;
      options: string[];
      correctIndex: number;
    }
  | {
      type: "fill_blank";
      id: string;
      sourceLessonOrder: number;
      sourceLessonTitle: string;
      contextText: string;
      contextPronunciation: string;
      contextTranslation: string;
      hintTranslation: string;
      acceptableAnswers: string[];
    }
  | {
      type: "translate";
      id: string;
      sourceLessonOrder: number;
      sourceLessonTitle: string;
      promptNative: string;
      acceptableAnswers: string[];
    };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[.,!?¿¡"'`،؟。！？]/g, "")
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// Typos and minor variants (a dropped accent, a missing hamza, an extra
// letter) shouldn't fail someone who clearly knows the phrase — accept
// anything close enough rather than requiring an exact match.
const FUZZY_MATCH_THRESHOLD = 0.8;

export function isAnswerCorrect(userInput: string, acceptableAnswers: string[]): boolean {
  const normalized = normalizeAnswer(userInput);
  if (!normalized) return false;
  return acceptableAnswers.some(
    (a) => similarity(normalized, normalizeAnswer(a)) >= FUZZY_MATCH_THRESHOLD
  );
}

function acceptableAnswersFor(
  targetText: string,
  pronunciation: string,
  targetLanguage: LanguageCode
): string[] {
  const answers = [targetText];
  if (ROMANIZED_LANGS.has(targetLanguage)) answers.push(pronunciation);
  return answers;
}

type PhraseWithSource = Phrase & { sourceLessonOrder: number; sourceLessonTitle: string };

export function generateExam(
  lessons: { lesson_order: number; content: LessonContent }[],
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode
): ExamQuestion[] {
  const allPhrases: PhraseWithSource[] = [];
  const dialoguePools: { lines: DialogueLine[]; sourceLessonOrder: number; sourceLessonTitle: string }[] = [];

  for (const lesson of lessons) {
    const title = lesson.content.title[nativeLanguage] ?? lesson.content.title.en;
    lesson.content.phrases.forEach((p) =>
      allPhrases.push({ ...p, sourceLessonOrder: lesson.lesson_order, sourceLessonTitle: title })
    );
    if (lesson.content.dialogue.length >= 2) {
      dialoguePools.push({
        lines: lesson.content.dialogue,
        sourceLessonOrder: lesson.lesson_order,
        sourceLessonTitle: title,
      });
    }
  }

  // 1. Multiple choice (7): pick a phrase, ask which option matches its native-language meaning.
  const mcPhrases = shuffle(allPhrases).slice(0, 7);
  const mcQuestions: ExamQuestion[] = mcPhrases.map((correct, i) => {
    const distractorPool = allPhrases.filter((p) => p.target_text !== correct.target_text);
    const distractors = shuffle(distractorPool).slice(0, 3);
    const options = shuffle([correct, ...distractors]).map((p) => p.target_text);
    const correctIndex = options.indexOf(correct.target_text);
    return {
      type: "mc",
      id: `mc-${i}`,
      sourceLessonOrder: correct.sourceLessonOrder,
      sourceLessonTitle: correct.sourceLessonTitle,
      promptText: correct.translations[nativeLanguage] ?? correct.translations.en,
      options,
      correctIndex,
    };
  });

  // 2. Fill in the blank (7): show one dialogue line as context, blank the next line,
  // give its native-language meaning as a hint. Avoids word-tokenization, which
  // breaks for languages without spaces between words (Chinese, Japanese).
  const fillCandidates: {
    context: DialogueLine;
    blank: DialogueLine;
    sourceLessonOrder: number;
    sourceLessonTitle: string;
  }[] = [];
  for (const pool of dialoguePools) {
    for (let i = 0; i < pool.lines.length - 1; i++) {
      fillCandidates.push({
        context: pool.lines[i],
        blank: pool.lines[i + 1],
        sourceLessonOrder: pool.sourceLessonOrder,
        sourceLessonTitle: pool.sourceLessonTitle,
      });
    }
  }
  const fillChosen = shuffle(fillCandidates).slice(0, 7);
  const fillQuestions: ExamQuestion[] = fillChosen.map((c, i) => ({
    type: "fill_blank",
    id: `fill-${i}`,
    sourceLessonOrder: c.sourceLessonOrder,
    sourceLessonTitle: c.sourceLessonTitle,
    contextText: c.context.target_text,
    contextPronunciation: c.context.pronunciation,
    contextTranslation: c.context.translations[nativeLanguage] ?? c.context.translations.en,
    hintTranslation: c.blank.translations[nativeLanguage] ?? c.blank.translations.en,
    acceptableAnswers: acceptableAnswersFor(c.blank.target_text, c.blank.pronunciation, targetLanguage),
  }));

  // 3. Short translation (6): native-language phrase in, target-language phrase typed out.
  const usedPhraseTexts = new Set(mcPhrases.map((p) => p.target_text));
  const translatePool = allPhrases.filter((p) => !usedPhraseTexts.has(p.target_text));
  const translateChosen = shuffle(translatePool).slice(0, 6);
  const translateQuestions: ExamQuestion[] = translateChosen.map((p, i) => ({
    type: "translate",
    id: `tr-${i}`,
    sourceLessonOrder: p.sourceLessonOrder,
    sourceLessonTitle: p.sourceLessonTitle,
    promptNative: p.translations[nativeLanguage] ?? p.translations.en,
    acceptableAnswers: acceptableAnswersFor(p.target_text, p.pronunciation, targetLanguage),
  }));

  return shuffle([...mcQuestions, ...fillQuestions, ...translateQuestions]);
}
