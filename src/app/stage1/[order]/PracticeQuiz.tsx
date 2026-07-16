"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Phrase } from "@/lib/lessons";
import type { LanguageCode } from "@/lib/languages";
import { QUIZ_STRINGS } from "@/lib/quizStrings";
import { completeLesson } from "./actions";

type Question = {
  promptText: string;
  options: string[];
  correctIndex: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(phrases: Phrase[], nativeLanguage: LanguageCode): Question[] {
  const count = Math.min(5, phrases.length);
  const chosen = shuffle(phrases).slice(0, count);

  return chosen.map((correct) => {
    const distractorPool = phrases.filter((p) => p !== correct);
    const distractors = shuffle(distractorPool).slice(0, 3);
    const options = shuffle([correct, ...distractors]).map((p) => p.target_text);
    const correctIndex = options.indexOf(correct.target_text);
    return {
      promptText: correct.translations[nativeLanguage] ?? correct.translations.en,
      options,
      correctIndex,
    };
  });
}

export default function PracticeQuiz({
  lessonId,
  phrases,
  nativeLanguage,
  alreadyCompleted,
}: {
  lessonId: string;
  phrases: Phrase[];
  nativeLanguage: LanguageCode;
  alreadyCompleted: boolean;
}) {
  const strings = QUIZ_STRINGS[nativeLanguage] ?? QUIZ_STRINGS.en;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState(!alreadyCompleted);
  const [attempt, setAttempt] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  // Generated only on the client (not during the initial render) since the
  // random shuffle would otherwise differ between the server-rendered HTML
  // and the client's hydration pass and trigger a hydration mismatch.
  const [questions, setQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    setQuestions(generateQuestions(phrases, nativeLanguage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrases, nativeLanguage, attempt]);

  if (!visible) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
        <p className="font-medium text-green-800">✓ {strings.completed}</p>
        <button
          onClick={() => {
            setVisible(true);
            setSubmitted(false);
            setSuccess(false);
            setAnswers({});
            setChecked({});
            setCurrentIndex(0);
          }}
          className="mt-2 text-sm text-primary-600 hover:underline"
        >
          {strings.practice}
        </button>
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900">{strings.practice}</h2>
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-stone-100" />
      </div>
    );
  }

  const allCorrect = questions.every((q, i) => answers[i] === q.correctIndex);

  const finish = () => {
    setSubmitted(true);
    if (allCorrect) {
      setSuccess(true);
      startTransition(async () => {
        await completeLesson(lessonId);
        router.refresh();
      });
    }
  };

  const handleRetry = () => {
    setAttempt((a) => a + 1);
    setAnswers({});
    setChecked({});
    setSubmitted(false);
    setSuccess(false);
    setCurrentIndex(0);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <p className={`text-sm font-medium ${success ? "text-green-700" : "text-red-600"}`}>
          {success ? strings.allCorrect : strings.someWrong}
        </p>
        <div className="mt-4">
          {success ? (
            <p className="text-sm text-stone-500">{isPending ? "Saving…" : ""}</p>
          ) : (
            <button
              onClick={handleRetry}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              {strings.retry}
            </button>
          )}
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isChecked = !!checked[currentIndex];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-stone-900">{strings.practice}</h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-stone-700">
          {strings.whichMeans} “{q.promptText}”
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, oi) => {
            const isSelected = answers[currentIndex] === oi;
            const isCorrectOption = oi === q.correctIndex;
            let style = "border-stone-300 hover:border-primary-400";
            if (isChecked) {
              if (isCorrectOption) style = "border-green-500 bg-green-50";
              else if (isSelected) style = "border-red-400 bg-red-50";
            } else if (isSelected) {
              style = "border-primary-500 bg-primary-50";
            }
            return (
              <button
                key={oi}
                disabled={isChecked}
                onClick={() => {
                  setAnswers((a) => ({ ...a, [currentIndex]: oi }));
                  setChecked((c) => ({ ...c, [currentIndex]: true }));
                }}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {isChecked && (
          <p
            className={`mt-3 text-sm font-medium ${
              answers[currentIndex] === q.correctIndex ? "text-green-700" : "text-red-600"
            }`}
          >
            {answers[currentIndex] === q.correctIndex
              ? `✓ ${strings.correctFeedback}`
              : `✗ ${strings.incorrectFeedback} ${q.options[q.correctIndex]}`}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => {
            if (isLast) finish();
            else setCurrentIndex((i) => i + 1);
          }}
          disabled={!isChecked}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isLast ? strings.finish : strings.next}
        </button>
      </div>
    </div>
  );
}
