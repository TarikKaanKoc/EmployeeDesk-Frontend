"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

import { GeneralError } from "@/components/errors/general-error";
import { reportError } from "@/lib/report-error";

/** A crashed sign-in page sends the reader back to sign-in, not to a
 *  dashboard they cannot open. */
export default function AuthError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reportError(error, { boundary: "auth" });
  }, [error]);

  return (
    <GeneralError error={error} onRetry={() => unstable_retry()} home="login" />
  );
}
