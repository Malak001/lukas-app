import "server-only";
import { AccessToken, TrackSource } from "livekit-server-sdk";

// Mints a short-lived LiveKit room-join token for a Stage 4 call participant.
// canPublishSources is enforced server-side so an "audio" queue participant
// can't publish a camera track even if the client UI were tampered with.
export async function createStage4Token(params: {
  identity: string;
  name: string;
  roomName: string;
  callFormat: "audio" | "video";
}): Promise<string> {
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    throw new Error("LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not configured");
  }

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: params.identity,
    name: params.name,
    ttl: "20m",
  });

  at.addGrant({
    roomJoin: true,
    room: params.roomName,
    canSubscribe: true,
    canPublishData: true,
    canPublishSources:
      params.callFormat === "video"
        ? [TrackSource.CAMERA, TrackSource.MICROPHONE]
        : [TrackSource.MICROPHONE],
  });

  return at.toJwt();
}

export function livekitServerUrl(): string {
  const url = process.env.LIVEKIT_URL;
  if (!url) throw new Error("LIVEKIT_URL is not configured");
  return url;
}
