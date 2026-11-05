import { PageShell } from "@/components/layout/page";
import { HeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <PageShell>
      <HeaderSkeleton />
      <StatCardsSkeleton count={3} className="grid-cols-3" />
      <TableSkeleton rows={6} columns={7} />
    </PageShell>
  );
}
