import { PageShell } from "@/components/layout/page";
import { HeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <PageShell>
      <HeaderSkeleton />
      <StatCardsSkeleton count={4} className="grid-cols-2 xl:grid-cols-4" />
      <TableSkeleton rows={8} columns={3} toolbar />
    </PageShell>
  );
}
