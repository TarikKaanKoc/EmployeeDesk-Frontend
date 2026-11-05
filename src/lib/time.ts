/**
 * The clock the console reads.
 *
 * Fixed, not the reader's: two people looking at the same bill, the same
 * approval or the same mail have to be looking at the same clock, and the
 * entity is in Qatar. Qatar has no daylight saving, so the offset is a
 * constant rather than a lookup.
 *
 * This is for *moments* - when a request was submitted, when somebody
 * decided. A date printed on a document is not a moment: a leave request
 * dated 2026-08-11 is the eleventh wherever it is read, so those stay pinned
 * to UTC and must not be moved here, or they shift by a day for anyone west
 * of this zone.
 */
export const APP_TIME_ZONE = "Asia/Qatar";
