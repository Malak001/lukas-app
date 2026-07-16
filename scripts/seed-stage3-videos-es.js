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
    youtube_video_id: "CqN1ENPfaeQ",
    title: "Learn how to Greet people in Spanish",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 8, end: 14, target_text: "Hola" },
        { start: 30, end: 38, target_text: "Buenas tardes" },
        { start: 40, end: 50, target_text: "Buenas noches" },
        { start: 58, end: 66, target_text: "Gracias" },
        { start: 66, end: 76, target_text: "¿Cómo está?" },
        { start: 100, end: 110, target_text: "Bien, gracias. ¿Y tú?" },
        { start: 114, end: 122, target_text: "Adiós" },
      ],
    },
  },
  {
    youtube_video_id: "EShH0MujuRs",
    title: "Learn Spanish - Basic Spanish conversation for beginners",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 0, end: 6, target_text: "Hola" },
        { start: 14, end: 22, target_text: "Me llamo Ana" },
        { start: 22, end: 30, target_text: "Estoy bien, gracias." },
        { start: 30, end: 38, target_text: "¿De dónde eres?" },
        { start: 38, end: 46, target_text: "Hablo un poco de español" },
        { start: 46, end: 54, target_text: "¿Y tú familia?" },
        { start: 54, end: 62, target_text: "¿Qué vas a hacer hoy?" },
        { start: 62, end: 70, target_text: "Bueno, me tengo que ir" },
      ],
    },
  },
  {
    youtube_video_id: "n5N_j1KEkHg",
    title: "Daily routine in Spanish | Beginner Spanish Lessons for Children",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 0, end: 6, target_text: "Me despierto." },
        { start: 20, end: 28, target_text: "Llego a la escuela." },
      ],
    },
  },
  {
    youtube_video_id: "5_4uhqA0fZM",
    title: "Emotions in Spanish: Easy Story for Beginners",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        {
          start: 0,
          end: 10,
          target_text: "Hay una mujer que se llama Pamela. Pamela es muy inteligente y simpática.",
        },
        {
          start: 10,
          end: 20,
          target_text:
            "El hombre se llama Nick Jonas. ¡Ay dios mío! ¡Nick Jonas está en el supermercado! ¡Ella está muy emocionada!",
        },
        {
          start: 20,
          end: 30,
          target_text: "Nick está muy tranquilo, pero Pamela está muy nerviosa.",
        },
        {
          start: 30,
          end: 40,
          target_text: "Ella dice: --¡Hola Nick!-- Nick responde: --Hola. ¿Cómo te llamas?--",
        },
      ],
    },
  },
  {
    youtube_video_id: "qMe8ngqR86k",
    title: "Learn Spanish Class Vocabulary with BASHO & FRIENDS",
    difficulty: "beginner",
    reference_transcript: {
      segments: [
        { start: 35, end: 40, target_text: "Abre el libro" },
        { start: 40, end: 45, target_text: "Cierra el libro" },
        { start: 45, end: 50, target_text: "Escribe" },
      ],
    },
  },
];

async function main() {
  const rows = VIDEOS.map((v) => ({
    language: "es",
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
  console.log(`OK: seeded ${rows.length} Spanish Stage 3 videos`);
}

main();
