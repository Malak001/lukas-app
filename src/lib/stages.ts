// Central config for the 4-stage progression shown on the dashboard.
// Flip `available` to true as each stage's pages get built in later phases.
export const STAGES = [
  {
    number: 1,
    title: "Introductions & Daily Conversation",
    description: "10 guided lessons to get you talking about yourself and your day.",
    href: "/stage1",
    available: true,
  },
  {
    number: 2,
    title: "Exam",
    description: "20 questions covering everything from Stage 1. Pass mark: 70%.",
    href: "/stage2",
    available: true,
  },
  {
    number: 3,
    title: "Video Translation",
    description: "Watch real videos and translate what's said. Pass 3 of 5.",
    href: "/stage3",
    available: true,
  },
  {
    number: 4,
    title: "Live Conversation",
    description: "Talk live with a native speaker learning your language.",
    href: "/stage4",
    available: true,
  },
] as const;

// TEMP: every stage is open to every user regardless of actual progress.
// Flip to false to restore normal gating (each stage locked until the
// previous one is passed). Used by stageStatus() below and by the
// server-side redirect guards in stage2/page.tsx, stage3/page.tsx,
// stage3/[id]/page.tsx, and stage4/page.tsx — keep all of those in sync
// with this flag.
export const GATING_DISABLED = true;

export type StageStatus = "locked" | "unlocked" | "completed";

export function stageStatus(currentStage: number, stageNumber: number): StageStatus {
  if (currentStage > stageNumber) return "completed";
  if (currentStage === stageNumber) return "unlocked";
  if (GATING_DISABLED) return "unlocked";
  return "locked";
}
