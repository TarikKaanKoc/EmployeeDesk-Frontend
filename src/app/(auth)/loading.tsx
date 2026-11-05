import { FormSkeleton } from "@/components/layout/page-skeleton";

export default function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <FormSkeleton />
      </div>
    </div>
  );
}
