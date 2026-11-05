import { Skeleton } from "@/components/ui/skeleton";

/**
 * The copilot. Its own frame rather than the console's: the screen has no
 * masthead on purpose - the composer is the page - so a title bar here would
 * push the one thing the reader came for down and then take it away again.
 */
export default function CopilotLoading() {
  return (
    <div
      className="relative isolate -m-4 min-h-[calc(100svh-4rem)] p-4 sm:-m-6 sm:p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-[60svh] max-w-2xl flex-col items-center justify-center gap-6">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="flex w-full flex-wrap justify-center gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-40 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
