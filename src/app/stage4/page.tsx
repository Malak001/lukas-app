import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { languageName } from "@/lib/languages";
import type { LanguageCode } from "@/lib/languages";
import { GATING_DISABLED } from "@/lib/stages";
import Nav from "@/components/Nav";
import Stage4Lobby from "./Stage4Lobby";

export default async function Stage4Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("native_language, target_language, stage4_suspended")
    .eq("id", user!.id)
    .single();

  const targetLanguage = profile!.target_language! as LanguageCode;
  const nativeLanguage = profile!.native_language! as LanguageCode;

  const { data: stageRow } = await supabase
    .from("user_stage")
    .select("current_stage")
    .eq("user_id", user!.id)
    .eq("language", targetLanguage)
    .maybeSingle();

  if (!GATING_DISABLED && (stageRow?.current_stage ?? 1) < 4) redirect("/dashboard");

  const { count: callsCompleted } = await supabase
    .from("call_sessions")
    .select("id", { count: "exact", head: true })
    .not("ended_at", "is", null)
    .eq("session_type", "matched")
    .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`);

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-primary-600">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Stage 4: Live Conversation</h1>
        <p className="mt-1 text-stone-600">
          Practice {languageName(targetLanguage)} with a native speaker who&apos;s learning{" "}
          {languageName(nativeLanguage)} — you each get half the call in your own target language.
        </p>

        {callsCompleted != null && callsCompleted > 0 && (
          <p className="mt-2 text-sm text-stone-500">
            {callsCompleted} call{callsCompleted === 1 ? "" : "s"} completed so far.
          </p>
        )}

        <div className="mt-6">
          <Stage4Lobby suspended={profile!.stage4_suspended ?? false} />
        </div>
      </main>
    </div>
  );
}
