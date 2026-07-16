"use client";

import { useActionState } from "react";
import { LANGUAGES } from "@/lib/languages";
import { updateTargetLanguage, type AccountActionState } from "./actions";

const initialState: AccountActionState = { error: null };

export default function TargetLanguageForm({
  currentTarget,
}: {
  currentTarget: string;
}) {
  const [state, formAction, pending] = useActionState(updateTargetLanguage, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <select
        name="target_language"
        defaultValue={currentTarget}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>

      <p className="text-xs text-stone-500">
        Changing this starts your stage progress over for the new language.
        Progress in your current language is saved and comes back if you switch back to it.
      </p>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved. Your dashboard now reflects the new language.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
