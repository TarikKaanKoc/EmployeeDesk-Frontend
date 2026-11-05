import { CircleAlert, CircleCheck, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "error" | "success" | "info";

const TONES = {
  error: {
    icon: CircleAlert,
    surface: "border-destructive/35 bg-destructive/8",
    badge: "bg-destructive/12 text-destructive",
    title: "text-destructive",
  },
  success: {
    icon: CircleCheck,
    surface: "border-success/35 bg-success/8",
    badge: "bg-success/12 text-success",
    title: "text-success",
  },
  info: {
    icon: Info,
    surface: "border-border bg-muted/50",
    badge: "bg-muted text-muted-foreground",
    title: "text-foreground",
  },
} as const;

interface Props {
  tone?: Tone;
  /** The sentence that says what happened. Kept short enough to read at once. */
  title: string;
  /** What to do about it. Optional, because not every failure has an answer. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The banner an auth form reports through.
 *
 * The default `Alert` is a hairline border and red text on the page's own
 * background, which on a sign-in card reads as a stray line of copy rather
 * than a refusal. This gives the message a surface of its own, an icon in a
 * container so the first line starts at the same place whatever the wording,
 * and room for a second line - because "invalid email or password" tells a
 * reader what went wrong and nothing about what to do next.
 *
 * `aria-live="assertive"` because this replaces the outcome of a submission
 * the reader is waiting on; a polite region would queue behind whatever else
 * the page is saying and arrive after they have started retyping.
 */
export function FormBanner({
  tone = "error",
  title,
  children,
  className,
}: Props) {
  const meta = TONES[tone];
  const Icon = meta.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex gap-3 rounded-lg border p-3.5",
        meta.surface,
        className,
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          meta.badge,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn("text-sm font-medium", meta.title)}>{title}</p>
        {children ? (
          <div className="text-muted-foreground text-xs leading-relaxed">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
