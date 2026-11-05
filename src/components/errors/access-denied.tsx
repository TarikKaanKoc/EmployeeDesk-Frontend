import { ShieldOff } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/errors/error-state";
import { Button } from "@/components/ui/button";
import { getScope } from "@/i18n/server";

/**
 * The 403 screen, drawn inside the console shell, for a page a scoped role
 * may not open. A hand-typed /audit answers in the product's own error
 * voice instead of silently teleporting the reader; the one action leads
 * to where this person's work actually lives.
 */
export async function AccessDenied({ home }: { home: string }) {
  const t = await getScope("errors");
  return (
    <ErrorState
      code={t.forbidden.code}
      title={t.forbidden.title}
      description={t.forbidden.description}
      icon={ShieldOff}
      layout="embedded"
      homeHref={home}
      actions={
        <Button asChild>
          <Link href={home}>{t.forbidden.action}</Link>
        </Button>
      }
    />
  );
}
