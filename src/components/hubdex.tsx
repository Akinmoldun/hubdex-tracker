import { cn } from "@/lib/utils";
import type { Stage, Priority } from "@/convex/schema";

export function HubdexWordmark({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 select-none",
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        width="26"
        height="26"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="32" height="32" fill={inverted ? "#ffffff" : "#0f62fe"} />
        <g
          fill="none"
          stroke={inverted ? "#0f62fe" : "#ffffff"}
          strokeWidth="2"
        >
          <path d="M7 9h6v6H7zM19 9h6v6h-6zM7 19h6v6H7z" />
          <path
            d="M19 19h6v6h-6z"
            fill={inverted ? "#0f62fe" : "#ffffff"}
            stroke="none"
          />
        </g>
      </svg>
      <span
        className={cn(
          "text-[1.35rem] font-bold tracking-[-0.02em] leading-none",
          inverted ? "text-white" : "text-foreground",
        )}
      >
        hubdex
      </span>
    </span>
  );
}

export const STAGE_LABELS: Record<Stage, string> = {
  Wishlist: "Wishlist",
  Applied: "Applied",
  Interview: "Interview",
  Offer: "Offer",
  Rejected: "Rejected",
};

export const STAGE_VARS: Record<Stage, { bg: string; fg: string }> = {
  Wishlist: { bg: "var(--tag-wishlist-bg)", fg: "var(--tag-wishlist-fg)" },
  Applied: { bg: "var(--tag-applied-bg)", fg: "var(--tag-applied-fg)" },
  Interview: { bg: "var(--tag-interview-bg)", fg: "var(--tag-interview-fg)" },
  Offer: { bg: "var(--tag-offer-bg)", fg: "var(--tag-offer-fg)" },
  Rejected: { bg: "var(--tag-rejected-bg)", fg: "var(--tag-rejected-fg)" },
};

export function StageTag({
  stage,
  className,
}: {
  stage: Stage;
  className?: string;
}) {
  const v = STAGE_VARS[stage];
  return (
    <span
      className={cn("ibm-tag", className)}
      style={{ backgroundColor: v.bg, color: v.fg }}
    >
      {stage}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: Priority }) {
  const color =
    priority === "High"
      ? "var(--pri-high)"
      : priority === "Medium"
        ? "var(--pri-medium)"
        : "var(--pri-low)";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        aria-hidden="true"
        className="inline-block size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {priority}
    </span>
  );
}
