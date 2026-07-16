import Link from "next/link";

const STAGE_SUMMARY = [
  { n: 1, title: "Learn", description: "10 guided lessons on introductions and daily conversation." },
  { n: 2, title: "Prove it", description: "Pass a 20-question exam covering everything you learned." },
  { n: 3, title: "Translate", description: "Watch real videos and translate what's said, graded by AI." },
  { n: 4, title: "Talk", description: "Have a live conversation with someone learning your language." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6">
        <span className="text-xl font-bold text-primary-600">Luka&apos;s</span>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-primary-600">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Sign up free
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Learn a language, then actually use it
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
          Four stages take you from your first phrases to a real conversation
          with someone who&apos;s learning your language too.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
        >
          Get started — it&apos;s free
        </Link>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-2">
          {STAGE_SUMMARY.map((s) => (
            <div key={s.n} className="rounded-2xl border border-stone-200 bg-white p-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Stage {s.n}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{s.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
