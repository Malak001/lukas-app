import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { languageName } from "@/lib/languages";
import { STAGE3_STRINGS } from "@/lib/stage3Strings";
import type { LanguageCode } from "@/lib/languages";
import { GATING_DISABLED } from "@/lib/stages";
import Nav from "@/components/Nav";

export default async function Stage3Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("native_language, target_language")
    .eq("id", user!.id)
    .single();

  const targetLanguage = profile!.target_language!;
  const nativeLanguage = profile!.native_language! as LanguageCode;
  const strings = STAGE3_STRINGS[nativeLanguage] ?? STAGE3_STRINGS.en;

  const { data: stageRow } = await supabase
    .from("user_stage")
    .select("current_stage")
    .eq("user_id", user!.id)
    .eq("language", targetLanguage)
    .maybeSingle();

  const currentStage = stageRow?.current_stage ?? 1;
  if (!GATING_DISABLED && currentStage < 3) redirect("/dashboard");

  const { data: videos } = await supabase
    .from("stage3_videos")
    .select("id, title, youtube_video_id, difficulty")
    .eq("language", targetLanguage)
    .order("title", { ascending: true });

  const { data: attempts } = await supabase
    .from("stage3_attempts")
    .select("video_id, passed")
    .eq("user_id", user!.id)
    .in("video_id", (videos ?? []).map((v) => v.id));

  const passedVideoIds = new Set(
    (attempts ?? []).filter((a) => a.passed).map((a) => a.video_id)
  );
  const attemptedVideoIds = new Set((attempts ?? []).map((a) => a.video_id));
  const passedCount = passedVideoIds.size;

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-primary-600">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Stage 3: Video Translation</h1>
        <p className="mt-1 text-stone-600">{languageName(targetLanguage)}</p>

        <div className="mt-4 rounded-lg bg-primary-50 p-3 text-sm text-primary-700">
          {passedCount}/5 {strings.progressLabel} — {strings.neededLabel}
        </div>

        <div className="mt-6 space-y-3">
          {(videos ?? []).map((video) => {
            const passed = passedVideoIds.has(video.id);
            const attempted = attemptedVideoIds.has(video.id);
            return (
              <Link key={video.id} href={`/stage3/${video.id}`}>
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                      alt=""
                      className="h-14 w-24 rounded-md object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-stone-900">{video.title}</h3>
                      <span className="text-xs uppercase tracking-wide text-stone-400">
                        {video.difficulty}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      passed
                        ? "bg-green-50 text-green-700 border-green-200"
                        : attempted
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-primary-50 text-primary-700 border-primary-200"
                    }`}
                  >
                    {passed ? "Passed" : attempted ? "Try again" : "Start"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
