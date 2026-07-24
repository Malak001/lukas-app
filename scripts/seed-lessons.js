require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const LANGS = ["en", "es", "fr", "de", "ar", "zh", "pt", "ja"];
const REQUIRED_TRANSLATION_KEYS = LANGS;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function validateLessons(code, lessons) {
  const issues = [];
  if (!Array.isArray(lessons) || lessons.length < 10) {
    issues.push(`expected an array of at least 10 lessons, got ${Array.isArray(lessons) ? lessons.length : typeof lessons}`);
    return issues;
  }
  lessons.forEach((lesson, i) => {
    const n = i + 1;
    if (lesson.lesson_order !== n) issues.push(`lesson ${n}: lesson_order is ${lesson.lesson_order}`);
    if (!lesson.title || REQUIRED_TRANSLATION_KEYS.some((k) => !lesson.title[k])) {
      issues.push(`lesson ${n}: title missing a language key`);
    }
    if (!Array.isArray(lesson.phrases) || lesson.phrases.length < 5) {
      issues.push(`lesson ${n}: only ${(lesson.phrases || []).length} phrases`);
    }
    if (!Array.isArray(lesson.dialogue) || lesson.dialogue.length < 4) {
      issues.push(`lesson ${n}: only ${(lesson.dialogue || []).length} dialogue lines`);
    }
    (lesson.phrases || []).forEach((p, j) => {
      if (!p.target_text || !p.pronunciation) issues.push(`lesson ${n} phrase ${j}: missing target_text/pronunciation`);
      if (!p.translations || REQUIRED_TRANSLATION_KEYS.some((k) => !p.translations[k])) {
        issues.push(`lesson ${n} phrase ${j}: incomplete translations`);
      }
    });
    (lesson.dialogue || []).forEach((d, j) => {
      if (!d.target_text || !d.translations || REQUIRED_TRANSLATION_KEYS.some((k) => !d.translations[k])) {
        issues.push(`lesson ${n} dialogue line ${j}: incomplete`);
      }
    });
  });
  return issues;
}

async function main() {
  let anyError = false;

  for (const code of LANGS) {
    const filePath = path.join(__dirname, "..", "src", "data", "lessons", `${code}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`SKIP ${code}: no file at ${filePath}`);
      anyError = true;
      continue;
    }

    const lessons = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const issues = validateLessons(code, lessons);
    if (issues.length) {
      console.error(`INVALID ${code}: ${issues.length} issue(s), skipping insert`);
      issues.slice(0, 10).forEach((i) => console.error(`  - ${i}`));
      anyError = true;
      continue;
    }

    const rows = lessons.map((lesson) => ({
      language: code,
      stage: 1,
      lesson_order: lesson.lesson_order,
      title: lesson.title.en,
      content: lesson,
    }));

    const { error } = await supabase
      .from("lessons")
      .upsert(rows, { onConflict: "language,lesson_order" });

    if (error) {
      console.error(`ERROR seeding ${code}: ${error.message}`);
      anyError = true;
    } else {
      console.log(`OK ${code}: seeded ${rows.length} lessons`);
    }
  }

  if (anyError) process.exit(1);
}

main();
