/**
 * Words that belong to no single screen.
 *
 * The bar for living here is that the string means the *same* thing everywhere
 * it appears. "Next" does; "Approve" does not - approving a leave request and
 * approving a purchase request are different promises, and Arabic
 * would not necessarily use one verb for both. Feature namespaces own those.
 */
export const common = {
  actions: {
    pickDate: "Pick a date",
    next: "Next",
    previous: "Previous",
    clearSearch: "Clear search",
  },

  /** The line under every list. `{showing}`, `{total}` and `{noun}` are filled in. */
  results: {
    count: "{total} {noun}",
    partial: "{showing} of {total} {noun}",
  },
  pagination: {
    range: "{from}-{to} of {total}",
    page: "Page {page} of {pages}",
  },
};
