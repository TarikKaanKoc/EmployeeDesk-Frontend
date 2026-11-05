import type { common as en } from "@/i18n/dictionaries/en/common";

/**
 * Modern Standard Arabic, in the register a Gulf HR team actually uses at
 * work. Where a loanword is what people say out loud, the loanword wins over a
 * purer coinage nobody would recognise at work.
 *
 * Typed against the English slice, so a key added there and missed here is a
 * build error rather than an `undefined` an Arabic reader discovers first.
 */
export const common: typeof en = {
  actions: {
    pickDate: "اختر تاريخًا",
    next: "التالي",
    previous: "السابق",
    clearSearch: "مسح البحث",
  },

  results: {
    count: "{total} {noun}",
    partial: "{showing} من أصل {total} {noun}",
  },
  pagination: {
    range: "{from}-{to} من {total}",
    page: "صفحة {page} من {pages}",
  },
};
