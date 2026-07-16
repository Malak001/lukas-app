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
    youtube_video_id: "Eo3hw4Ey7qg",
    title: "Greetings and Expressions in English",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 35, end: 50, target_text: "Good evening." },
        { start: 50, end: 65, target_text: "Goodbye." },
        { start: 77, end: 90, target_text: "Thank you." },
        { start: 90, end: 106, target_text: "You're awesome." },
        { start: 106, end: 118, target_text: "Nice to meet you." },
        { start: 118, end: 129, target_text: "I'm pretty well." },
        { start: 129, end: 147, target_text: "Great job." },
      ],
    },
  },
  {
    youtube_video_id: "wHZYOfCD-Wc",
    title: "Places in School",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 9, end: 15, target_text: "Today, let's learn about places in school." },
        { start: 15, end: 21, target_text: "This is the administration office." },
        { start: 21, end: 28, target_text: "classroom" },
        { start: 28, end: 35, target_text: "This is the school canteen." },
        { start: 35, end: 47, target_text: "This is the school library." },
        { start: 47, end: 55, target_text: "This is the school clinic." },
        { start: 55, end: 62, target_text: "This is the art room." },
      ],
    },
  },
  {
    youtube_video_id: "EmHYcOh6uIw",
    title: "Household Chores Vocabulary",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 8, end: 11, target_text: "Today, let's learn about household chores." },
        { start: 11, end: 19, target_text: "Wash the dishes." },
        { start: 19, end: 78, target_text: "Sweep the floor." },
        { start: 78, end: 86, target_text: "Cook the meals." },
        { start: 86, end: 112, target_text: "Make the bed." },
        { start: 112, end: 144, target_text: "Set the table." },
        { start: 144, end: 160, target_text: "Do the shopping." },
      ],
    },
  },
  {
    youtube_video_id: "bDiYjz-oEAg",
    title: "Preposition for Kids",
    difficulty: "intermediate",
    reference_transcript: {
      segments: [
        { start: 8, end: 60, target_text: "Today, let's learn about preposition." },
        { start: 65, end: 90, target_text: "The car is in front of the house." },
        { start: 95, end: 155, target_text: "The dog is in the middle of the carpet." },
        { start: 161, end: 167, target_text: "The dog and the cat is around the house." },
        { start: 167, end: 173, target_text: "The dog is behind the sofa." },
        { start: 173, end: 180, target_text: "The dog is in the box." },
      ],
    },
  },
  {
    youtube_video_id: "sWC_SnLC4Iw",
    title: "Parts of the House for Kids",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        {
          start: 72,
          end: 80,
          target_text: "This is my living room. In my living room, there is a sofa.",
        },
        { start: 80, end: 93, target_text: "There is a television." },
        { start: 93, end: 183, target_text: "There is a carpet." },
        { start: 183, end: 204, target_text: "There is a plate." },
        { start: 204, end: 287, target_text: "This is my bathroom." },
        { start: 287, end: 300, target_text: "This is my dining room." },
      ],
    },
  },
];

async function main() {
  const rows = VIDEOS.map((v) => ({
    language: "en",
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
  console.log(`OK: seeded ${rows.length} English Stage 3 videos`);
}

main();
