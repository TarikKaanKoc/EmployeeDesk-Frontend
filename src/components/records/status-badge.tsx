import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * The record screens' one status chip: a neutral pill with a coloured dot.
 * The colour says the state and the word says it again, so the chip reads
 * the same to a colour-blind reader and in a greyscale print.
 */
export type StatusTone = "waiting" | "done" | "failed" | "returned" | "muted";

const DOT: Record<StatusTone, string> = {
  waiting: "bg-warning",
  done: "bg-success",
  failed: "bg-destructive",
  returned: "bg-primary",
  muted: "bg-muted-foreground/40",
};

export const LEAVE_TONE = {
  pending: "waiting",
  approved: "done",
  rejected: "failed",
  cancelled: "muted",
} as const satisfies Record<string, StatusTone>;

export const PURCHASE_TONE = {
  under_review: "waiting",
  approved: "done",
  returned: "returned",
  rejected: "failed",
} as const satisfies Record<string, StatusTone>;

export function StatusBadge({ tone, label, className }: { tone: StatusTone; label: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("bg-card gap-1.5 font-normal whitespace-nowrap", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])} aria-hidden="true" />
      {label}
    </Badge>
  );
}
