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
    youtube_video_id: "zYvfeacJZcU",
    title: "Learn Japanese for Kids - Numbers, Colors & More",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 48, end: 55, target_text: "ドア" },
        { start: 64, end: 71, target_text: "ランプ" },
        { start: 80, end: 87, target_text: "ひきだし" },
      ],
    },
  },
  {
    youtube_video_id: "JGsrFaePwFg",
    title: "Learn Japanese for Kids with Bocchi & Pocchi | Numbers 1-10",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 10, end: 17, target_text: "1 ichi" },
        { start: 55, end: 62, target_text: "8 hachi" },
      ],
    },
  },
  {
    youtube_video_id: "rtK33nvzHcc",
    title: "30 Color Names in Japanese",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 10, end: 17, target_text: "きいろ" },
        { start: 16, end: 23, target_text: "ピンク" },
        { start: 24, end: 31, target_text: "くれない" },
      ],
    },
  },
  {
    youtube_video_id: "mVrkNTDm6zg",
    title: "30 Japanese words about Animals in Hiragana, Katakana and Kanji",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 5, end: 12, target_text: "猫 ねこ" },
        { start: 13, end: 20, target_text: "usagi" },
        { start: 30, end: 37, target_text: "山羊 やぎ" },
      ],
    },
  },
  {
    youtube_video_id: "LeLMDcUhmwM",
    title: "40 Basic Japanese words for food and dishes",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 5, end: 12, target_text: "おでん" },
        { start: 11, end: 18, target_text: "からあげ" },
        { start: 19, end: 26, target_text: "クリームシチュー" },
      ],
    },
  },
];

async function main() {
  const rows = VIDEOS.map((v) => ({
    language: "ja",
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
  console.log(`OK: seeded ${rows.length} Japanese Stage 3 videos`);
}

main();
