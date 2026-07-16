import { createClient } from "@/lib/supabase/server";
import { languageName } from "@/lib/languages";
import Nav from "@/components/Nav";
import TargetLanguageForm from "./TargetLanguageForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, native_language, target_language")
    .eq("id", user!.id)
    .single();

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-900">Account settings</h1>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Name</dt>
              <dd className="text-stone-900">{profile?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Email</dt>
              <dd className="text-stone-900">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Native language</dt>
              <dd className="text-stone-900">
                {profile?.native_language ? languageName(profile.native_language) : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900">Language you&apos;re learning</h2>
          <div className="mt-3">
            <TargetLanguageForm currentTarget={profile?.target_language ?? ""} />
          </div>
        </div>
      </main>
    </div>
  );
}
