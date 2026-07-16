import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { translateText } from "@/lib/translate";
import type { LanguageCode } from "@/lib/languages";

const TranslateSchema = z.object({ messageId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = TranslateSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // RLS on direct_messages only allows reading rows the caller is part of,
  // so a row coming back at all proves membership.
  const { data: message } = await supabase
    .from("direct_messages")
    .select("id, body, recipient_id, translated_body, translated_language")
    .eq("id", body.data.messageId)
    .single();

  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  // Translation only makes sense one direction: into the recipient's native
  // language. Sender already knows what they wrote, so only the recipient
  // can trigger it — this also means we never need to read the other
  // participant's profile (no admin client needed here).
  if (message.recipient_id !== user.id) {
    return NextResponse.json(
      { error: "Only the recipient can translate this message" },
      { status: 403 }
    );
  }

  if (message.translated_body) {
    return NextResponse.json({
      translatedBody: message.translated_body,
      translatedLanguage: message.translated_language,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("native_language")
    .eq("id", user.id)
    .single();

  const targetLanguage = profile!.native_language as LanguageCode;

  let translatedBody: string;
  try {
    translatedBody = await translateText(message.body, targetLanguage);
  } catch (err) {
    console.error("translateText error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Translation is unavailable right now" }, { status: 502 });
  }

  await supabase
    .from("direct_messages")
    .update({ translated_body: translatedBody, translated_language: targetLanguage })
    .eq("id", message.id);

  return NextResponse.json({ translatedBody, translatedLanguage: targetLanguage });
}
