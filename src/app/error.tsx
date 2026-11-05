"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

import { GeneralError } from "@/components/errors/general-error";
import { reportError } from "@/lib/report-error";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reportError(error, { boundary: "root" });
  }, [error]);

  return <GeneralError error={error} onRetry={() => unstable_retry()} />;
}
