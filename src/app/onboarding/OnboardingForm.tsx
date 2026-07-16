"use client";

import { useActionState } from "react";
import { LANGUAGES } from "@/lib/languages";
import { saveLanguages, type OnboardingState } from "./actions";

const initialState: OnboardingState = { error: null };

export default function OnboardingForm() {
  const [state, formAction, pending] = useActionState(saveLanguages, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="native_language" className="block text-sm font-medium text-stone-700">
          What language do you speak?
        </label>
        <select
          id="native_language"
          name="native_language"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="" disabled>
            Select a language
          </option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="target_language" className="block text-sm font-medium text-stone-700">
          What language do you want to learn?
        </label>
        <select
          id="target_language"
          name="target_language"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="" disabled>
            Select a language
          </option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition hover:bg-primary-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Start learning"}
      </button>
    </form>
  );
}
