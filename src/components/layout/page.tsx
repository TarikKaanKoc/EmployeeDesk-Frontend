import { cn } from "@/lib/utils";

/**
 * The shell every console page sits in.
 *
 * Exists so width and rhythm are decided once. Before it, each page picked its
 * own max-width and its own vertical spacing, which is invisible on any single
 * screen and obvious the moment a reader moves between two.
 */
export function PageShell({
  children,
  width = "wide",
  className,
}: {
  children: React.ReactNode;
  /** `narrow` is for pages that are a single column of prose or form. */
  width?: "wide" | "narrow";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto space-y-6",
        width === "wide" ? "max-w-[1600px]" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  /** What the page is for. One or two lines, in the reader's language. */
  description?: React.ReactNode;
  /** Page-level buttons, right-aligned on wide screens. */
  actions?: React.ReactNode;
}

/**
 * One title treatment for the whole console.
 *
 * Two slots, ordered by how often they are read: what this is, then what it
 * is for. Pages that only need the title pass only the title - the point is
 * that a page never invents its own type scale for them.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          /* On a phone the strapline keeps to two lines: still there,
             no longer the first screenful before the page itself. */
          <p className="text-muted-foreground mt-1 line-clamp-2 max-w-3xl text-sm sm:line-clamp-none">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * A heading inside a page, for screens built from several sections rather than
 * one list. Deliberately smaller than `PageHeader` so the hierarchy holds.
 */
export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
