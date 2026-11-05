"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useScope } from "@/i18n/provider";

/** A read failed. The page still has its masthead; this stands where the list would. */
export function RecordsError({ message }: { message?: string }) {
  const t = useScope("records");
  const router = useRouter();
  return (
    <div className="bg-card flex flex-col items-center gap-3 rounded-xl border px-6 py-14 text-center" role="alert">
      <span className="bg-destructive/10 text-destructive grid size-10 place-items-center rounded-full">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium">{t.shared.loadFailed}</p>
      {message ? <p className="text-muted-foreground max-w-md text-xs">{message}</p> : null}
      <Button variant="outline" size="sm" onClick={() => router.refresh()}>
        {t.shared.retry}
      </Button>
    </div>
  );
}
