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
    youtube_video_id: "Pjyc5GCNzwk",
    title: "Learn Chinese for Kids - Numbers, Colors & More - Rock 'N Learn",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 25, end: 32, target_text: "椅子" },
        { start: 40, end: 47, target_text: "窗" },
        { start: 55, end: 62, target_text: "桌子" },
      ],
    },
  },
  {
    youtube_video_id: "jAYVEtE9n5M",
    title: "Learn Chinese for Kids - Food, Activities & Animals - Rock 'N Learn",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 14, end: 21, target_text: "门" },
        { start: 35, end: 42, target_text: "花" },
      ],
    },
  },
  {
    youtube_video_id: "96H944og6mQ",
    title: "Learn Numbers in Mandarin Chinese 1-10 for Kids | 数字",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 15, end: 22, target_text: "一二三四五" },
        { start: 30, end: 37, target_text: "一" },
        { start: 48, end: 55, target_text: "四" },
      ],
    },
  },
  {
    youtube_video_id: "8xOGqPCd_K4",
    title: "The Best Video to Learn About Colors in Mandarin Chinese | 颜色",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 10, end: 17, target_text: "蓝色" },
        { start: 20, end: 27, target_text: "粉红色" },
        { start: 74, end: 81, target_text: "黑色" },
      ],
    },
  },
  {
    youtube_video_id: "mnG4zrdb7NM",
    title: "Learn Different Animals in Mandarin Chinese | 动物",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 13, end: 20, target_text: "大象" },
        { start: 21, end: 28, target_text: "马" },
        { start: 29, end: 36, target_text: "猪" },
      ],
    },
  },
];

async function main() {
  const rows = VIDEOS.map((v) => ({
    language: "zh",
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
  console.log(`OK: seeded ${rows.length} Mandarin Chinese Stage 3 videos`);
}

main();
