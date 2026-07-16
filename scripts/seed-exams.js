require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const LANGS = ["en", "es", "fr", "de", "ar", "zh", "pt", "ja"];

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// The exam's 20 questions are generated at runtime from that language's Stage 1
// lesson content (see src/lib/exam.ts), not stored here. This row exists so
// exam_attempts has a valid exam_id to reference, and to record the pass mark.
async function main() {
  const rows = LANGS.map((language) => ({
    language,
    questions: { total_questions: 20, pass_mark: 70, generated_from: "stage1_lessons" },
  }));

  const { error } = await supabase.from("exams").upsert(rows, { onConflict: "language" });

  if (error) {
    console.error("ERROR seeding exams:", error.message);
    process.exit(1);
  }
  console.log(`OK: seeded ${rows.length} exam rows`);
}

main();
