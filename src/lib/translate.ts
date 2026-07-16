import "server-only";
import { createAnthropicClient } from "./anthropic";
import { languageName, type LanguageCode } from "./languages";

// LibreTranslate (self-hosted via docker, see libretranslate/docker-compose.yml)
// uses "zh-Hans" for Chinese; every other code matches our LanguageCode as-is.
function toLibreTranslateCode(code: LanguageCode): string {
  return code === "zh" ? "zh-Hans" : code;
}

async function translateViaLibreTranslate(
  text: string,
  targetLanguage: LanguageCode,
  baseUrl: string
): Promise<string> {
  const response = await fetch(`${baseUrl}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "auto",
      target: toLibreTranslateCode(targetLanguage),
      format: "text",
    }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate request failed: ${response.status}`);
  }

  const data = (await response.json()) as { translatedText?: string };
  if (!data.translatedText) throw new Error("LibreTranslate returned no translation");

  return data.translatedText;
}

async function translateViaClaude(text: string, targetLanguage: LanguageCode): Promise<string> {
  const client = createAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: `Translate the user's message into ${languageName(
      targetLanguage
    )}. Reply with ONLY the translation — no notes, no quotes, no explanation. Preserve tone and any emoji.`,
    messages: [{ role: "user", content: text }],
  });

  const block = response.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : text;
}

// LIBRETRANSLATE_URL is only reachable when the app runs alongside a local
// (or otherwise network-reachable) LibreTranslate container — e.g. local dev.
// When it's unset (e.g. deployed to Vercel, which can't reach a laptop's
// Docker container), fall back to Claude so translation still works.
export async function translateText(text: string, targetLanguage: LanguageCode): Promise<string> {
  const libreTranslateUrl = process.env.LIBRETRANSLATE_URL;
  if (libreTranslateUrl) {
    return translateViaLibreTranslate(text, targetLanguage, libreTranslateUrl);
  }
  return translateViaClaude(text, targetLanguage);
}
