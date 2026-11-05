/**
 * The 401/403/404/500/503 screens.
 *
 * Each one names the *next move* rather than only the failure: an error page a
 * reader cannot leave is a dead end regardless of how well it is worded.
 */
export const errors = {
  backToDashboard: "Back to the assistant",
  backToSignIn: "Back to sign in",

  /* Messages the console's own route handlers return. They surface in form
     banners, so they are worded for a reader, not a log. */
  api: {
    notAuthenticated: "You're not signed in.",
    unreachable:
      "The service is not reachable right now. Try again in a moment.",
    missingCredentials: "Enter your email and password.",
    signInFailed: "Sign-in failed. Try again.",
  },

  forbidden: {
    code: "403",
    title: "Access forbidden",
    description:
      "You don't have permission to view this resource. Contact your organization administrator if you think this is a mistake.",
    action: "Back to my work",
  },

  notFound: {
    code: "404",
    title: "Page not found",
    description:
      "The page you're looking for doesn't exist or may have been moved.",
  },

  general: {
    code: "500",
    title: "Something went wrong",
    description:
      "An unexpected error occurred on our side. Try again, and if it keeps happening let us know.",
    reference: "Reference: {digest}",
    retry: "Try again",
  },
};
