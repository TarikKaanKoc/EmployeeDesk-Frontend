import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { ErrorScene, type SceneVariant } from "@/components/errors/error-scene";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

interface Props {
  /** HTTP status shown as the headline figure. */
  code: string;
  title: string;
  description: React.ReactNode;
  icon: LucideIcon;
  /** Which floating pieces the illustration carries. Defaults to the code. */
  variant?: SceneVariant;
  /** Buttons - typically a back button plus a link home. */
  actions?: React.ReactNode;
  /** Where the logo in the corner leads. */
  homeHref?: string;
  /**
   * `page` is the full-screen version with the logo in the corner and the
   * dotted backdrop. `embedded` drops both so the screen can sit inside the
   * console shell, beside the sidebar, without a second logo on the page.
   */
  layout?: "page" | "embedded";
  className?: string;
}

/** Shared shell for every error screen so 401/403/404/500/503 stay consistent. */
export function ErrorState({
  code,
  title,
  description,
  icon,
  variant,
  actions,
  homeHref = "/dashboard",
  layout = "page",
  className,
}: Props) {
  const sceneVariant = (variant ?? code) as SceneVariant;
  const page = layout === "page";

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden",
        page ? "min-h-svh" : "min-h-[70svh]",
        className,
      )}
    >
      {page && (
        <>
          {/* Dotted backdrop, faded towards the edges so it never competes
              with the text. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]"
          />
          <header className="relative z-10 flex items-center px-6 py-5 sm:px-10">
            <Link
              href={homeHref}
              className="text-foreground rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Logo className="h-7" />
            </Link>
          </header>
        </>
      )}

      <main className="relative z-10 flex flex-1 items-center px-6 py-10 sm:px-10">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          {/* Copy. */}
          <div className="order-2 flex max-w-xl flex-col items-center text-center lg:order-1 lg:items-start lg:text-start">
            <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] tabular-nums ring-1 ring-primary/20">
              <span className="bg-primary size-1.5 rounded-full" />
              <span dir="ltr">ERROR {code}</span>
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-md text-base text-balance sm:text-lg">
              {description}
            </p>

            {actions && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {actions}
              </div>
            )}
          </div>

          {/* Illustration. */}
          <ErrorScene
            code={code}
            icon={icon}
            variant={sceneVariant}
            className="order-1 w-[min(100%,380px)] lg:order-2 lg:w-[520px]"
          />
        </div>
      </main>

      {page && (
        <footer className="text-muted-foreground relative z-10 px-6 py-5 text-center text-xs sm:px-10">
          <span dir="ltr">© {new Date().getFullYear()} EmployeeDesk</span>
        </footer>
      )}
    </div>
  );
}
