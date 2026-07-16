export type Stage3Segment = {
  start: number;
  end: number;
  target_text: string;
};

export type Stage3ReferenceTranscript = {
  segments: Stage3Segment[];
};

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
