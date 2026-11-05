import { AuthShowcase } from "@/components/auth/auth-showcase";
import { Logo } from "@/components/logo";
import { getScope } from "@/i18n/server";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

/**
 * The auth layout: a product panel on the start edge, the form on the end
 * edge. The panel shows the product rather than describing it: one line of
 * copy, a still of a real answer, and the four guarantees as quiet rows.
 */
export async function AuthShell({ title, description, children, footer, wide }: Props) {
  const t = await getScope("auth");

  return (
    <div className="bg-muted/30 flex min-h-svh flex-col lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-start lg:p-3">
      <aside
        className="bg-sidebar text-sidebar-foreground relative hidden flex-col overflow-hidden rounded-[1.75rem] p-12 lg:sticky lg:top-3 lg:flex lg:h-[calc(100svh-1.5rem)] xl:p-14"
        style={{ ["--logo-accent" as string]: "var(--sidebar-primary)" }}
      >
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase opacity-60">
          {t.shell.positioning}
        </p>

        <AuthShowcase />
      </aside>

      {/* Below lg the panel is gone, so the form owns the whole viewport:
          the logo and form travel together, centred in the viewport, and the footer note is pinned to the bottom. The card
          chrome only appears from sm up; on a phone the form sits straight
          on the page, as a native sign-in would. */}
      <main className="relative flex flex-1 flex-col overflow-hidden px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-10 lg:min-h-[calc(100svh-1.5rem)] lg:justify-center lg:px-14 lg:py-6">
        <div className={cn("relative mx-auto flex w-full flex-1 flex-col lg:flex-none", wide ? "max-w-[34rem]" : "max-w-[24rem]")}>
          <div className="flex flex-1 flex-col justify-center py-8 lg:flex-none lg:py-0">
            <div className="mb-8 flex justify-center lg:mb-6 lg:justify-start" style={{ ["--logo-accent" as string]: "#2DA394" }}>
              <Logo className="h-7" style={{ ["--logo-size" as string]: "1.75rem" }} />
            </div>
            <div className="sm:bg-card sm:ring-border/60 sm:rounded-2xl sm:p-7 sm:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_44px_-24px_rgba(0,0,0,0.22)] sm:ring-1 dark:sm:shadow-black/30">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-xl sm:tracking-[-0.015em]">{title}</h1>
              <p className="text-muted-foreground mt-1 text-sm">{description}</p>
              <div className="mt-6 sm:mt-5">{children}</div>
            </div>
          </div>
          {footer && <div className="text-muted-foreground mt-auto text-center text-xs lg:mt-4 lg:text-start">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
