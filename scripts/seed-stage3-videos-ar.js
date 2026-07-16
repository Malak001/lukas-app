require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Every segment below was manually verified against the real video (on-screen
// text or real closed captions) by browsing each video directly — none of
// this text is generated/guessed. Timestamps are approximate (+/- a few
// seconds) since they were read off the player's progress bar while stepping
// through, not extracted from precise caption timing data.
const VIDEOS = [
  {
    youtube_video_id: "1w-d3vFqIz0",
    title: "Learn Numbers With Colors | الألوان والأرقام باللغة العربية | Learn Arabic With Om Nom",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 20, end: 27, target_text: "أحمر" },
        { start: 35, end: 42, target_text: "البرتقالي" },
        { start: 50, end: 57, target_text: "أرجواني" },
      ],
    },
  },
  {
    youtube_video_id: "teBjsJ0NH4g",
    title: "Arabic Learning for Kids: Greetings and Emotions",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 20, end: 27, target_text: "اَلسَّلَامُ عَلَيْكُمْ" },
        { start: 65, end: 72, target_text: "الحمد لله" },
      ],
    },
  },
  {
    youtube_video_id: "0xYTcZvVCuI",
    title: "Animals for Kids in Arabic - اسماء الحيوانات للأطفال باللغة العربية",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 55, end: 62, target_text: "حصان" },
        { start: 70, end: 77, target_text: "ارنب" },
        { start: 85, end: 92, target_text: "دجاجة" },
      ],
    },
  },
  {
    youtube_video_id: "wN0ROx-PDeg",
    title: "Arabic Numbers | Learn Numbers in Arabic for kids 1-20",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 10, end: 17, target_text: "واحد" },
        { start: 25, end: 32, target_text: "خمسة" },
        { start: 40, end: 47, target_text: "ثمانية" },
      ],
    },
  },
  {
    youtube_video_id: "9YftisfXP70",
    title: "Fruits names in Arabic for Kids | Learn Arabic with Zakaria and Zeeko",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 10, end: 17, target_text: "تفاح هذا هو التفاح" },
        { start: 20, end: 27, target_text: "كرز هذا هو" },
        { start: 30, end: 37, target_text: "برتقال هذه هي" },
      ],
    },
  },
];

async function main() {
  const rows = VIDEOS.map((v) => ({
    language: "ar",
    youtube_video_id: v.youtube_video_id,
    title: v.title,
    difficulty: v.difficulty,
    reference_transcript: v.reference_transcript,
  }));

  const { error } = await supabase.from("stage3_videos").insert(rows);

  if (error) {
    console.error("ERROR seeding stage3_videos:", error.message);
    process.exit(1);
  }
  console.log(`OK: seeded ${rows.length} Arabic Stage 3 videos`);
}

main();
