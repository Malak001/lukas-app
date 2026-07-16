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
    youtube_video_id: "FCnetD61G6A",
    title: "As cores em português - Teaching colors in Portuguese",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 13, end: 20, target_text: "Azul cor azul" },
        { start: 24, end: 31, target_text: "lápis Amarelo" },
        { start: 34, end: 41, target_text: "cor roxa" },
      ],
    },
  },
  {
    youtube_video_id: "yFkpx-ICTPw",
    title: "Os Animais para crianças - vocabulário",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 30, end: 38, target_text: "vamos continuar procurando animais aqui, uma zebra zebra" },
        { start: 48, end: 56, target_text: "aqui logo logo eu gosto muito dos lobos, lobo" },
        { start: 90, end: 98, target_text: "leão elefante e girafa, o crocodilo gorila zebra tigre" },
      ],
    },
  },
  {
    youtube_video_id: "HvxP9-JbTe4",
    title: "Corpo Humano - Human Body - European Portuguese/Português Europeu",
    difficulty: "intermediate",
    reference_transcript: {
      segments: [
        { start: 15, end: 23, target_text: "e o corpo humano, a cabeça, o cabelo, a sobrancelha, a orelha, o lábio superior" },
        { start: 25, end: 33, target_text: "a boca, o lábio inferior, o pescoço, a testa, as pestanas, o olho, os olhos" },
      ],
    },
  },
  {
    youtube_video_id: "wtlYyk2PAng",
    title: "Contar de 1 a 10 - Counting 1 to 10",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 15, end: 20, target_text: "três" },
        { start: 29, end: 34, target_text: "sete" },
      ],
    },
  },
  {
    youtube_video_id: "dfD4zLFTbSM",
    title: "Super EASY PORTUGUESE for KIDS! (Start Learning BRAZILIAN PORTUGUESE Today)",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 5, end: 12, target_text: "O Cabelo" },
        { start: 13, end: 20, target_text: "As Sobrancelhas" },
        { start: 21, end: 28, target_text: "Os Dentes" },
      ],
    },
  },
];

async function main() {
  const rows = VIDEOS.map((v) => ({
    language: "pt",
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
  console.log(`OK: seeded ${rows.length} Portuguese Stage 3 videos`);
}

main();
