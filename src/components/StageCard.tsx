import Link from "next/link";
import type { StageStatus } from "@/lib/stages";

const STATUS_STYLES: Record<StageStatus, string> = {
  locked: "bg-stone-100 text-stone-400 border-stone-200",
  unlocked: "bg-primary-50 text-primary-700 border-primary-200",
  completed: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_LABEL: Record<StageStatus, string> = {
  locked: "Locked",
  unlocked: "In progress",
  completed: "Completed",
};

export default function StageCard({
  number,
  title,
  description,
  href,
  status,
  available,
}: {
  number: number;
  title: string;
  description: string;
  href: string;
  status: StageStatus;
  available: boolean;
}) {
  const clickable = available && status !== "locked";

  const card = (
    <div
      className={`rounded-2xl border p-5 transition ${
        clickable ? "hover:shadow-md cursor-pointer" : ""
      } ${status === "locked" ? "opacity-60" : "bg-white border-stone-200"}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Stage {number}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
        >
          {status === "unlocked" && !available ? "Coming soon" : STATUS_LABEL[status]}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
    </div>
  );

  if (!clickable) return card;

  return <Link href={href}>{card}</Link>;
}
