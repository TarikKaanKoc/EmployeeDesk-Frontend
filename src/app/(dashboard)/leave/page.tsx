import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page";
import { LeaveWorkspace } from "@/components/leave/leave-workspace";
import { RecordsError } from "@/components/records/records-error";
import { getScope } from "@/i18n/server";
import type { LeaveBalance, LeaveRequest } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { getLeaveBalances, getLeaveRequests } from "@/lib/api.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getScope("records");
  return { title: t.leave.title, description: t.leave.description };
}

type Loaded = { ok: true; data: { balances: LeaveBalance[]; requests: LeaveRequest[] } } | { ok: false; message?: string };

/** The read, kept away from the JSX so a render error is the boundary's to catch. */
async function load(): Promise<Loaded> {
  try {
    const [balances, requests] = await Promise.all([getLeaveBalances(), getLeaveRequests()]);
    return { ok: true, data: { balances, requests } };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.message : undefined };
  }
}

export default async function LeavePage() {
  const t = await getScope("records");
  const loaded = await load();
  if (!loaded.ok) {
    return (
      <PageShell>
        <h2 className="text-lg font-semibold tracking-tight">{t.leave.title}</h2>
        <RecordsError message={loaded.message} />
      </PageShell>
    );
  }
  const { balances, requests } = loaded.data;
  return (
    <PageShell>
      <LeaveWorkspace balances={balances} requests={requests} />
    </PageShell>
  );
}
