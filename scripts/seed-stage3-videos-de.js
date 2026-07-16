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
    youtube_video_id: "gfu0SwwqDt8",
    title: "Learn German for Kids - Numbers, Colors & More",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 34, end: 40, target_text: "das Fenster" },
        { start: 1018, end: 1025, target_text: "die Kleidung" },
        { start: 1470, end: 1478, target_text: "das Auto" },
      ],
    },
  },
  {
    youtube_video_id: "hQbDvS8Pdd0",
    title: "Learn German for Kids – Body Parts, Family & Feelings",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 692, end: 699, target_text: "die Beine" },
        { start: 900, end: 908, target_text: "die Tante" },
        { start: 1709, end: 1718, target_text: "Er hat Durst." },
      ],
    },
  },
  {
    youtube_video_id: "3bKV0HbQo_0",
    title: "Learn German for Kids - Food, Activities & Animals",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 103, end: 110, target_text: "die Wolke" },
        { start: 190, end: 197, target_text: "Er springt." },
      ],
    },
  },
  {
    youtube_video_id: "c5niDBLMKAo",
    title: "German for Children | Important German Words and Phrases (Lesson 1)",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 130, end: 138, target_text: "Guten Morgen" },
        { start: 138, end: 146, target_text: "Guten Tag" },
        { start: 146, end: 154, target_text: "Guten Abend" },
        { start: 154, end: 162, target_text: "Gute Nacht" },
      ],
    },
  },
  {
    youtube_video_id: "Frb-w7qyb88",
    title: "Bruder Jakob (Frère Jacques) - German Nursery Rhymes | Liederkiste",
    difficulty: "intermediate",
    reference_transcript: {
      segments: [
        { start: 60, end: 75, target_text: "Schläfst du noch, schläfst du noch?" },
        { start: 240, end: 250, target_text: "Ding ding dong. Ding ding dong." },
        { start: 250, end: 260, target_text: "Hörst du nicht die Glocken?" },
      ],
    },
  },
];

async function main() {
  const rows = VIDEOS.map((v) => ({
    language: "de",
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
  console.log(`OK: seeded ${rows.length} German Stage 3 videos`);
}

main();
