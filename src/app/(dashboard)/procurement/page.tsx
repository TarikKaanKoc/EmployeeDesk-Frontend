import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page";
import { ProcurementWorkspace } from "@/components/procurement/procurement-workspace";
import { RecordsError } from "@/components/records/records-error";
import { getScope } from "@/i18n/server";
import type { PurchaseRequest } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { getPurchaseRequests } from "@/lib/api.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getScope("records");
  return { title: t.procurement.title, description: t.procurement.description };
}

type Loaded = { ok: true; data: { requests: PurchaseRequest[] } } | { ok: false; message?: string };

/** The read, kept away from the JSX so a render error is the boundary's to catch. */
async function load(): Promise<Loaded> {
  try {
    const requests = await getPurchaseRequests();
    return { ok: true, data: { requests } };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.message : undefined };
  }
}

export default async function ProcurementPage() {
  const t = await getScope("records");
  const loaded = await load();
  if (!loaded.ok) {
    return (
      <PageShell>
        <h2 className="text-lg font-semibold tracking-tight">{t.procurement.title}</h2>
        <RecordsError message={loaded.message} />
      </PageShell>
    );
  }
  const { requests } = loaded.data;
  return (
    <PageShell>
      <ProcurementWorkspace requests={requests} />
    </PageShell>
  );
}
