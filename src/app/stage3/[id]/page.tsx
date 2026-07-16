import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { LanguageCode } from "@/lib/languages";
import type { Stage3ReferenceTranscript } from "@/lib/stage3";
import { GATING_DISABLED } from "@/lib/stages";
import Nav from "@/components/Nav";
import TranslationForm from "./TranslationForm";

export default async function Stage3VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: stageRow } = await supabase
    .from("user_stage")
    .select("current_stage")
    .eq("user_id", user!.id)
    .eq("language", targetLanguage)
    .maybeSingle();

  if (!GATING_DISABLED && (stageRow?.current_stage ?? 1) < 3) redirect("/dashboard");

  const { data: video } = await supabase
    .from("stage3_videos")
    .select("id, title, youtube_video_id, reference_transcript")
    .eq("id", id)
    .eq("language", targetLanguage)
    .single();

  if (!video) notFound();

  const transcript = video.reference_transcript as Stage3ReferenceTranscript;

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/stage3" className="text-sm text-stone-500 hover:text-primary-600">
          ← All videos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{video.title}</h1>

        <TranslationForm
          videoId={video.id}
          youtubeVideoId={video.youtube_video_id}
          segments={transcript.segments}
          nativeLanguage={nativeLanguage}
        />
      </main>
    </div>
  );
}
