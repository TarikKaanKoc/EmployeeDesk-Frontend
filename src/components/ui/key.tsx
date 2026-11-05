import { cn } from "@/lib/utils";

/**
 * One keyboard key, drawn as a key.
 *
 * Shared because a shortcut hint has to look the same everywhere it appears -
 * the approval bench, the review screen, the supplier panel - or a reader
 * stops recognising them as keys. Always LTR: a key is a key in either
 * language, and an Arabic paragraph must not reorder "Ctrl" and "K".
 */
export function Key({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      dir="ltr"
      className={cn(
        "bg-muted text-foreground inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-[11px]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
