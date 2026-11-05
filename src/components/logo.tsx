import { cn } from "@/lib/utils";

export const MARK_PATH =
  "M9.5 1.5h13a8 8 0 0 1 8 8v13a8 8 0 0 1-8 8h-13a8 8 0 0 1-8-8v-13a8 8 0 0 1 8-8ZM10.2 9.2h11.6a1.7 1.7 0 0 1 1.7 1.7v0a1.7 1.7 0 0 1-1.7 1.7h-11.6a1.7 1.7 0 0 1-1.7-1.7v-0a1.7 1.7 0 0 1 1.7-1.7ZM10.2 14.3h7.6a1.7 1.7 0 0 1 1.7 1.7v0a1.7 1.7 0 0 1-1.7 1.7h-7.6a1.7 1.7 0 0 1-1.7-1.7v-0a1.7 1.7 0 0 1 1.7-1.7ZM10.2 19.4h3.6a1.7 1.7 0 0 1 1.7 1.7v0a1.7 1.7 0 0 1-1.7 1.7h-3.6a1.7 1.7 0 0 1-1.7-1.7v-0a1.7 1.7 0 0 1 1.7-1.7Z";

interface MarkProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function LogoMark({ className, title = "EmployeeDesk", ...props }: MarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d={MARK_PATH} fill="var(--logo-accent, currentColor)" fillRule="evenodd" />
    </svg>
  );
}

interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  title?: string;
}

/** Mark + wordmark. Size it with a height class; the text follows `--logo-size`. */
export function Logo({ className, title = "EmployeeDesk", ...props }: LogoProps) {
  return (
    <span
      role="img"
      aria-label={title}
      className={cn("inline-flex h-7 items-center gap-2.5 whitespace-nowrap", className)}
      dir="ltr"
      {...props}
    >
      <LogoMark className="h-full w-auto" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="leading-none font-semibold tracking-[-0.025em] text-current"
        style={{ fontSize: "calc(var(--logo-size, 1.75rem) * 0.7)" }}
      >
        Employee<span style={{ color: "var(--logo-accent, currentColor)" }}>Desk</span>
      </span>
    </span>
  );
}
