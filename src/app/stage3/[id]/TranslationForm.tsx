"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Stage3Segment } from "@/lib/stage3";
import { formatTimestamp } from "@/lib/stage3";
import type { LanguageCode } from "@/lib/languages";
import { STAGE3_STRINGS } from "@/lib/stage3Strings";
import { checkStage3Segment, submitStage3Attempt } from "./actions";

type Graded = { score: number; feedback: string };

export default function TranslationForm({
  videoId,
  youtubeVideoId,
  segments,
  nativeLanguage,
}: {
  videoId: string;
  youtubeVideoId: string;
  segments: Stage3Segment[];
  nativeLanguage: LanguageCode;
}) {
  const strings = STAGE3_STRINGS[nativeLanguage] ?? STAGE3_STRINGS.en;
  const [isPending, startTransition] = useTransition();
  const [playerStart, setPlayerStart] = useState(segments[0]?.start ?? 0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [graded, setGraded] = useState<Record<number, Graded>>({});
  const [checking, setChecking] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const allGraded = segments.every((_, i) => graded[i]);

  async function handleCheck(i: number) {
    setError(null);
    setChecking((c) => ({ ...c, [i]: true }));
    try {
      const res = await checkStage3Segment(videoId, i, segments[i].target_text, answers[i] ?? "");
      setGraded((g) => ({ ...g, [i]: res }));
    } catch {
      setError("Grading failed. Please try again.");
    } finally {
      setChecking((c) => ({ ...c, [i]: false }));
    }
  }

  const handleFinish = () => {
    setError(null);
    startTransition(async () => {
      try {
        const payload = segments.map((seg, i) => ({
          index: i,
          targetText: seg.target_text,
          userTranslation: answers[i] ?? "",
          score: graded[i].score,
          feedback: graded[i].feedback,
        }));
        const res = await submitStage3Attempt(videoId, payload);
        setResult(res);
      } catch {
        setError("Could not save your result. Please try again.");
      }
    });
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setGraded({});
    setChecking({});
  };

  return (
    <div className="mt-6">
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-stone-200">
        <iframe
          key={playerStart}
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${youtubeVideoId}?start=${playerStart}`}
          title="Stage 3 video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <p className="mt-4 text-sm text-stone-600">{strings.introText}</p>

      <div className="mt-4 space-y-4">
        {segments.map((seg, i) => {
          const isGraded = !!graded[i];
          const isChecking = !!checking[i];
          const hasAnswer = (answers[i] ?? "").trim() !== "";
          return (
            <div key={i} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {strings.segmentLabel} {i + 1}
                </span>
                <button
                  onClick={() => setPlayerStart(seg.start)}
                  className="text-xs font-medium text-primary-600 hover:underline"
                >
                  {formatTimestamp(seg.start)}
                </button>
              </div>
              <p className="mt-1 text-lg text-stone-900">{seg.target_text}</p>
              <textarea
                value={answers[i] ?? ""}
                disabled={isGraded || isChecking}
                onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                placeholder={strings.translatePlaceholder}
                rows={2}
                className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-stone-50"
              />

              {isGraded ? (
                <p
                  className={`mt-2 text-sm ${
                    graded[i].score >= 70 ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {graded[i].score >= 70 ? "✓" : "✗"} {graded[i].score}/100 — {graded[i].feedback}
                </p>
              ) : (
                <button
                  onClick={() => handleCheck(i)}
                  disabled={!hasAnswer || isChecking}
                  className="mt-2 rounded-lg border border-primary-300 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-40"
                >
                  {isChecking ? strings.grading : strings.submitBtn}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!result ? (
        <button
          onClick={handleFinish}
          disabled={!allGraded || isPending}
          className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-3 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending ? strings.grading : strings.finishBtn}
        </button>
      ) : (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 text-center">
          <h2 className={`text-2xl font-bold ${result.passed ? "text-green-700" : "text-red-600"}`}>
            {result.passed ? `🎉 ${strings.passedTitle}` : strings.failedTitle}
          </h2>
          <p className="mt-2 text-lg text-stone-700">
            {strings.yourScore} {result.score}%
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/stage3"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              {strings.backToVideos}
            </Link>
            {!result.passed && (
              <button
                onClick={handleRetry}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                {strings.tryAgainBtn}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
