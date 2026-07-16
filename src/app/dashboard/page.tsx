import { createClient } from "@/lib/supabase/server";
import { languageName } from "@/lib/languages";
import { STAGES, stageStatus } from "@/lib/stages";
import Nav from "@/components/Nav";
import StageCard from "@/components/StageCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, native_language, target_language")
    .eq("id", user!.id)
    .single();

  const { data: userStage } = await supabase
    .from("user_stage")
    .select("current_stage")
    .eq("user_id", user!.id)
    .eq("language", profile!.target_language!)
    .maybeSingle();

  const currentStage = userStage?.current_stage ?? 1;

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-900">
          Hi {profile?.name}, keep going on {languageName(profile!.target_language!)}
        </h1>
        <p className="mt-1 text-stone-600">
          Native language: {languageName(profile!.native_language!)}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {STAGES.map((stage) => (
            <StageCard
              key={stage.number}
              number={stage.number}
              title={stage.title}
              description={stage.description}
              href={stage.href}
              available={stage.available}
              status={stageStatus(currentStage, stage.number)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
