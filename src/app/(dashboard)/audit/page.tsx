import type { Metadata } from "next";

import { AuditWorkspace } from "@/components/audit/audit-workspace";
import { PageShell } from "@/components/layout/page";
import { RecordsError } from "@/components/records/records-error";
import { getScope } from "@/i18n/server";
import type { AuditPage } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { getAuditTrail } from "@/lib/api.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getScope("records");
  return { title: t.audit.title, description: t.audit.description };
}

type Loaded = { ok: true; data: { page: AuditPage } } | { ok: false; message?: string };

/** The read, kept away from the JSX so a render error is the boundary's to catch. */
async function load(): Promise<Loaded> {
  try {
    const page = await getAuditTrail(50);
    return { ok: true, data: { page } };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.message : undefined };
  }
}

export default async function AuditPage() {
  const t = await getScope("records");
  const loaded = await load();
  if (!loaded.ok) {
    return (
      <PageShell>
        <h2 className="text-lg font-semibold tracking-tight">{t.audit.title}</h2>
        <RecordsError message={loaded.message} />
      </PageShell>
    );
  }
  const { page } = loaded.data;
  return (
    <PageShell>
      <AuditWorkspace initial={page} />
    </PageShell>
  );
}
