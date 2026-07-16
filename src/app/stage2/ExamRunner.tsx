"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { generateExam, isAnswerCorrect, type ExamQuestion } from "@/lib/exam";
import type { LessonContent } from "@/lib/lessons";
import type { LanguageCode } from "@/lib/languages";
import { EXAM_STRINGS } from "@/lib/examStrings";
import { submitExamAttempt } from "./actions";

const PASS_MARK = 70;

function isCorrect(q: ExamQuestion, userAnswer: string): boolean {
  if (q.type === "mc") return Number(userAnswer) === q.correctIndex;
  return isAnswerCorrect(userAnswer, q.acceptableAnswers);
}

function correctAnswerText(q: ExamQuestion): string {
  if (q.type === "mc") return q.options[q.correctIndex];
  return q.acceptableAnswers[0];
}

export default function ExamRunner({
  examId,
  lessonsForExam,
  nativeLanguage,
  targetLanguage,
}: {
  examId: string;
  lessonsForExam: { lesson_order: number; content: LessonContent }[];
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}) {
  const strings = EXAM_STRINGS[nativeLanguage] ?? EXAM_STRINGS.en;
  const [isPending, startTransition] = useTransition();
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const questions = useMemo(
    () => generateExam(lessonsForExam, nativeLanguage, targetLanguage),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lessonsForExam, nativeLanguage, targetLanguage, attempt]
  );

  const allAnswered = questions.every((q) => (answers[q.id] ?? "").trim() !== "");

  const results = useMemo(() => {
    if (!submitted) return null;
    const wrongLessonTitles = new Set<string>();
    let correctCount = 0;
    for (const q of questions) {
      const userAnswer = answers[q.id] ?? "";
      if (isCorrect(q, userAnswer)) correctCount++;
      else wrongLessonTitles.add(q.sourceLessonTitle);
    }
    const score = Math.round((correctCount / questions.length) * 100);
    return { correctCount, score, passed: score >= PASS_MARK, wrongLessonTitles: [...wrongLessonTitles] };
  }, [submitted, questions, answers]);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted && results) {
    if (results.passed) {
      startTransition(async () => {
        await submitExamAttempt(examId, results.score, true, answers);
      });
    }

    return (
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 text-center">
        <h2 className={`text-2xl font-bold ${results.passed ? "text-green-700" : "text-red-600"}`}>
          {results.passed ? `🎉 ${strings.passedTitle}` : strings.failedTitle}
        </h2>
        <p className="mt-2 text-lg text-stone-700">
          {strings.yourScore} {results.score}% ({results.correctCount}/{questions.length})
        </p>

        {!results.passed && results.wrongLessonTitles.length > 0 && (
          <div className="mt-4 rounded-lg bg-stone-50 p-4 text-left">
            <p className="font-medium text-stone-700">{strings.reviewTopics}</p>
            <ul className="mt-2 list-inside list-disc text-sm text-stone-600">
              {results.wrongLessonTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          {results.passed ? (
            <Link
              href="/stage2/intro"
              className="inline-block rounded-lg bg-primary-600 px-5 py-2 font-medium text-white hover:bg-primary-700"
            >
              {strings.continueBtn}
            </Link>
          ) : (
            <button
              onClick={() => {
                setAttempt((a) => a + 1);
                setAnswers({});
                setSubmitted(false);
                setCurrentIndex(0);
                setChecked({});
              }}
              className="rounded-lg bg-primary-600 px-5 py-2 font-medium text-white hover:bg-primary-700"
            >
              {strings.retakeExam}
            </button>
          )}
        </div>
        {isPending && <p className="mt-2 text-xs text-stone-400">Saving…</p>}
      </div>
    );
  }

  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const currentAnswered = (answers[q.id] ?? "").trim() !== "";
  const isChecked = !!checked[q.id];
  const currentCorrect = isChecked && isCorrect(q, answers[q.id] ?? "");

  return (
    <div className="mt-6">
      <p className="rounded-lg bg-primary-50 p-3 text-sm text-primary-700">{strings.examIntro}</p>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            {currentIndex + 1}/{questions.length}
          </p>

          {q.type === "mc" && (
            <>
              <p className="mt-1 font-medium text-stone-800">“{q.promptText}”</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[q.id] === String(oi);
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
                        setAnswers((a) => ({ ...a, [q.id]: String(oi) }));
                        setChecked((c) => ({ ...c, [q.id]: true }));
                      }}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {q.type === "fill_blank" && (
            <>
              <p className="mt-1 text-xs font-medium text-stone-500">{strings.fillBlankLabel}</p>
              <p className="mt-1 text-stone-800">{q.contextText}</p>
              <p className="text-xs italic text-stone-500">{q.contextTranslation}</p>
              <p className="mt-2 text-sm text-stone-600">____ ({q.hintTranslation})</p>
              <input
                type="text"
                value={answers[q.id] ?? ""}
                disabled={isChecked}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder={strings.typeAnswerPlaceholder}
                className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-stone-50"
              />
              {!isChecked && (
                <button
                  onClick={() => setChecked((c) => ({ ...c, [q.id]: true }))}
                  disabled={!currentAnswered}
                  className="mt-2 rounded-lg border border-primary-300 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-40"
                >
                  {strings.checkAnswer}
                </button>
              )}
            </>
          )}

          {q.type === "translate" && (
            <>
              <p className="mt-1 text-xs font-medium text-stone-500">{strings.translateLabel}</p>
              <p className="mt-1 font-medium text-stone-800">“{q.promptNative}”</p>
              <input
                type="text"
                value={answers[q.id] ?? ""}
                disabled={isChecked}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder={strings.typeAnswerPlaceholder}
                className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-stone-50"
              />
              {!isChecked && (
                <button
                  onClick={() => setChecked((c) => ({ ...c, [q.id]: true }))}
                  disabled={!currentAnswered}
                  className="mt-2 rounded-lg border border-primary-300 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-40"
                >
                  {strings.checkAnswer}
                </button>
              )}
            </>
          )}

          {isChecked && (
            <p className={`mt-3 text-sm font-medium ${currentCorrect ? "text-green-700" : "text-red-600"}`}>
              {currentCorrect
                ? `✓ ${strings.correctFeedback}`
                : `✗ ${strings.incorrectFeedback} ${correctAnswerText(q)}`}
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40"
          >
            {strings.back}
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={!isChecked || !allAnswered}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {strings.submitExam}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={!isChecked}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {strings.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
