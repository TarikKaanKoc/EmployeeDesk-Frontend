/** Raised for any non-2xx, carrying the status so callers can branch on 401/404. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /**
     * The API's machine-readable `errorCode`, when it sent one.
     *
     * Some refusals are worth *reacting* to rather than only printing - the
     * band-has-no-approver conflict, say, where the console can offer the one
     * screen that fixes it. Branching on this rather than on the sentence
     * means improving the wording never breaks the button.
     */
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Refusals the console does something specific about. */
export const ERROR_CODES = {
  /** Removing/demoting/suspending would leave an approval band with nobody. */
  BAND_WOULD_HAVE_NO_APPROVER: "BAND_WOULD_HAVE_NO_APPROVER",
  /** The step needs an e-mail and this console cannot send one (mail off, or the address is outside its allowlist). */
  MAIL_UNAVAILABLE: "MAIL_UNAVAILABLE",
} as const;
