"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <Link href="/" className="mb-6 text-2xl font-bold text-primary-600">
        Luka&apos;s
      </Link>
      <h1 className="text-xl font-semibold text-stone-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone-600">
        An unexpected error occurred. You can try again, or head back to the dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
