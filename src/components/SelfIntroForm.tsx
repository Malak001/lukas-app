"use client";

import { useState } from "react";
import Link from "next/link";
import type { LanguageCode } from "@/lib/languages";
import { SELF_INTRO_STRINGS } from "@/lib/selfIntroStrings";
import { countWords } from "@/lib/wordCount";

const MAX_WORDS = 100;

type Mistake = { original: string; correction: string; explanation: string };
type SubmitResult = { overallFeedback: string; mistakes: Mistake[] };

export default function SelfIntroForm({
  nativeLanguage,
  targetLanguage,
  continueHref,
  onSubmit,
  existingAttempt,
}: {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  continueHref: string;
  onSubmit: (essayText: string) => Promise<SubmitResult>;
  existingAttempt?: { essayText: string; overallFeedback: string; mistakes: Mistake[] } | null;
}) {
  const strings = SELF_INTRO_STRINGS[nativeLanguage] ?? SELF_INTRO_STRINGS.en;
  const [showForm, setShowForm] = useState(!existingAttempt);
  const [essayText, setEssayText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPastAttempt, setIsPastAttempt] = useState(!!existingAttempt);
  const [result, setResult] = useState<SubmitResult | null>(
    existingAttempt
      ? { overallFeedback: existingAttempt.overallFeedback, mistakes: existingAttempt.mistakes }
      : null
  );

  const wordCount = countWords(essayText, targetLanguage);
  const tooLong = wordCount > MAX_WORDS;
  const canSubmit = essayText.trim().length > 0 && !tooLong && !submitting;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await onSubmit(essayText);
      setResult(res);
      setIsPastAttempt(false);
      setShowForm(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!showForm && result) {
    return (
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        {isPastAttempt && (
          <p className="text-sm font-medium text-stone-500">{strings.alreadyDoneMsg}</p>
        )}

        <p className="mt-2 text-stone-700">{result.overallFeedback}</p>

        {result.mistakes.length === 0 ? (
          <p className="mt-4 font-medium text-green-700">✓ {strings.noMistakesHeading}</p>
        ) : (
          <div className="mt-4">
            <p className="font-medium text-stone-800">{strings.mistakesHeading}</p>
            <ul className="mt-2 space-y-3">
              {result.mistakes.map((m, i) => (
                <li key={i} className="rounded-lg bg-stone-50 p-3 text-sm">
                  <p>
                    <span className="text-stone-500">{strings.originalLabel}: </span>
                    <span className="text-red-600 line-through">{m.original}</span>
                  </p>
                  <p className="mt-1">
                    <span className="text-stone-500">{strings.correctionLabel}: </span>
                    <span className="font-medium text-green-700">{m.correction}</span>
                  </p>
                  <p className="mt-1 text-stone-600">{m.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Link
            href={continueHref}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            {strings.continueBtn}
          </Link>
          <button
            onClick={() => {
              setEssayText("");
              setShowForm(true);
            }}
            className="text-sm text-primary-600 hover:underline"
          >
            {strings.writeAgainBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="font-semibold text-stone-900">{strings.heading}</h2>
      <p className="mt-1 text-sm text-stone-600">{strings.instructions}</p>

      <textarea
        value={essayText}
        onChange={(e) => setEssayText(e.target.value)}
        placeholder={strings.placeholder}
        rows={6}
        disabled={submitting}
        className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-stone-50"
      />

      <p className={`mt-1 text-xs ${tooLong ? "text-red-600" : "text-stone-400"}`}>
        {wordCount}/{MAX_WORDS} {strings.wordsLabel}
        {tooLong && ` — ${strings.tooLong}`}
      </p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {submitting ? strings.grading : strings.submitBtn}
      </button>
    </div>
  );
}
