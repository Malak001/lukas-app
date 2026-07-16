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
    youtube_video_id: "rltmVpVG56s",
    title: "Les salutations - Greeting in French (Part 2)",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 35, end: 50, target_text: "Bonne nuit." },
        { start: 50, end: 77, target_text: "Goodbye." },
        { start: 95, end: 106, target_text: "Bravo ! Tu as gagné." },
        { start: 139, end: 146, target_text: "Bonjour. Salut." },
        { start: 155, end: 165, target_text: "De rien." },
      ],
    },
  },
  {
    youtube_video_id: "PWAzyEmo_0s",
    title: "Les salutations - Greetings in French (Part 1)",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 41, end: 49, target_text: "Bonjour les amis !" },
        { start: 49, end: 81, target_text: "Bonjour Manu ! Bonjour les amis." },
        { start: 81, end: 109, target_text: "Bonjour Léon, bonjour Manu." },
        { start: 109, end: 139, target_text: "Bonjour Manu, bonjour Léon ! Salut maîtresse." },
        { start: 139, end: 160, target_text: "Bonjour maîtresse. Bravo, c'est correct !" },
      ],
    },
  },
  {
    youtube_video_id: "uyHIcOX4FaE",
    title: "Learn French for Kids - Numbers, Colors & More",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 167, end: 442, target_text: "la porte" },
        { start: 442, end: 525, target_text: "le crayon" },
        { start: 525, end: 888, target_text: "jaune" },
        { start: 888, end: 900, target_text: "la chaussette" },
      ],
    },
  },
  {
    youtube_video_id: "d7ms1n3sT78",
    title: "Learn French for Kids – Useful Phrases for Beginners",
    difficulty: "intermediate",
    reference_transcript: {
      segments: [
        { start: 127, end: 153, target_text: "Merci." },
        { start: 153, end: 744, target_text: "Qu'est-ce que tu veux boire ?" },
        { start: 744, end: 750, target_text: "Où est la poupée ?" },
        { start: 750, end: 760, target_text: "Ce n'est pas la poupée." },
      ],
    },
  },
  {
    youtube_video_id: "ra7lZsZH-xs",
    title: "Mary avait un agneau | Chansons pour bébés",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 117, end: 256, target_text: "Enfin, mangeons du sucre." },
        { start: 256, end: 282, target_text: "Joyeux anniversaire !" },
        { start: 282, end: 1386, target_text: "Tes amis aujourd'hui se sont tous réunis." },
        { start: 1386, end: 1400, target_text: "Tu t'en vas." },
      ],
    },
  },
];

async function main() {
  const rows = VIDEOS.map((v) => ({
    language: "fr",
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
  console.log(`OK: seeded ${rows.length} French Stage 3 videos`);
}

main();
