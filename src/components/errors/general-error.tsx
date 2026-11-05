"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/errors/error-state";
import { Button } from "@/components/ui/button";
import { useFormat, useScope } from "@/i18n/provider";

interface Props {
  error?: Error & { digest?: string };
  /** Next 16 error-boundary retry - re-fetches and re-renders the segment. */
  onRetry?: () => void;
  /** Where "back" leads. The console goes home; an auth page goes to sign-in. */
  home?: "dashboard" | "login";
  /** Inside the console shell: no corner logo, no full-height backdrop. */
  embedded?: boolean;
}

export function GeneralError({
  error,
  onRetry,
  home = "dashboard",
  embedded = false,
}: Props) {
  const t = useScope("errors");
  const { fmt } = useFormat();

  return (
    <ErrorState
      code={t.general.code}
      title={t.general.title}
      description={
        <>
          {t.general.description}
          {error?.digest && (
            <span className="mt-2 block font-mono text-xs">
              {fmt(t.general.reference, { digest: error.digest })}
            </span>
          )}
        </>
      }
      icon={CircleAlert}
      layout={embedded ? "embedded" : "page"}
      homeHref={home === "login" ? "/login" : "/dashboard"}
      actions={
        <>
          {onRetry && (
            <Button size="lg" variant="outline" onClick={onRetry}>
              <RotateCcw className="size-4" />
              {t.general.retry}
            </Button>
          )}
          <Button size="lg" asChild>
            <Link href={home === "login" ? "/login" : "/dashboard"}>
              {home === "login" ? t.backToSignIn : t.backToDashboard}
            </Link>
          </Button>
        </>
      }
    />
  );
}
