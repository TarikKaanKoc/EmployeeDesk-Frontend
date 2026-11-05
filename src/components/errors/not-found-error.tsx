import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/errors/error-state";
import { Button } from "@/components/ui/button";
import { getScope } from "@/i18n/server";

export async function NotFoundError() {
  const t = await getScope("errors");

  return (
    <ErrorState
      code={t.notFound.code}
      title={t.notFound.title}
      description={t.notFound.description}
      icon={FileQuestion}
      actions={
        <Button size="lg" asChild>
          <Link href="/copilot">{t.backToDashboard}</Link>
        </Button>
      }
    />
  );
}
