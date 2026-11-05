import type { PluralForms } from "@/i18n/format";

/**
 * The three "My records" screens. They share one namespace because they
 * share a shape - a masthead, a row of tiles, a list - and the words for
 * the shape (empty states, retry, the load-more button) are the same on
 * all three.
 */
export const records = {
  shared: {
    retry: "Try again",
    loadFailed: "Could not load your records.",
    loadMore: "Show earlier",
    all: "All",
    days: { one: "{count} day", other: "{count} days" } as PluralForms,
    rows: { one: "{count} record", other: "{count} records" } as PluralForms,
    details: "Details",
  },

  leave: {
    title: "Leave",
    description: "Your balances and every request you have made, in one place.",
    newRequest: "New request",
    tiles: {
      annual: "Annual leave",
      sick: "Sick leave",
      pending: "Awaiting approval",
      available: "available",
      ofEntitled: "of {count} entitled",
      used: "{count} used",
      pendingDays: "{count} days on hold",
      asOf: "As of {date}",
      none: "nothing waiting",
    },
    types: { annual: "Annual", sick: "Sick" },
    reasons: {
      family: "Family",
      personal: "Personal",
      medical: "Medical",
      travel: "Travel",
      emergency: "Emergency",
    },
    status: { pending: "Pending", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled" },
    columns: {
      request: "Request",
      type: "Type",
      dates: "Dates",
      days: "Days",
      reason: "Reason",
      status: "Status",
      submitted: "Submitted",
    },
    empty: {
      title: "No leave requests yet",
      body: "Your first request will appear here. You can submit one from this page or by asking the assistant.",
    },
    emptyFiltered: "No requests with this status.",
    form: {
      title: "New leave request",
      description: "Every calendar day from the first to the last counts. Approval goes to your line manager.",
      type: "Leave type",
      start: "First day",
      end: "Last day",
      reason: "Reason",
      summary: { one: "{count} day", other: "{count} days" } as PluralForms,
      balanceHint: "{available} available after this request",
      insufficient: "This exceeds your available balance.",
      endBeforeStart: "The last day must be on or after the first day.",
      tooLong: "A single request may not exceed 60 days.",
      submit: "Submit request",
      submitting: "Submitting…",
      cancel: "Cancel",
      submitted: "Request {id} submitted for approval.",
      failed: "The request could not be submitted.",
    },
  },

  procurement: {
    title: "Purchase requests",
    description: "Requests you raised in the ERP, with where each one stands today.",
    tiles: {
      count: { one: "{count} request", other: "{count} requests" } as PluralForms,
      thisStep: "waiting at {step}",
      none: "none",
    },
    status: { under_review: "Under review", approved: "Approved", returned: "Returned", rejected: "Rejected" },
    columns: {
      number: "PR number",
      purpose: "Business purpose",
      amount: "Amount",
      status: "Status",
      step: "Current step",
      created: "Created",
      updated: "Last updated",
    },
    detail: {
      title: "Purchase request",
      department: "Department",
      requester: "Requester",
      reference: "ERP reference",
      step: "Current step",
      amount: "Amount",
      created: "Created",
      updated: "Last updated",
      source: "Read live from the ERP. Changes are made there, not here.",
      ask: "Ask the assistant about {number}",
    },
    empty: {
      title: "No purchase requests",
      body: "Requests raised under your employee ID will appear here once the ERP has them.",
    },
    emptyFiltered: "No requests with this status.",
  },

  audit: {
    title: "Activity",
    description: "A record of what the assistant did on your behalf: each answer, each lookup, each refusal.",
    tiles: {
      turns: "Conversation turns",
      tools: "Record lookups",
      drafts: "Requests drafted",
      guardrails: "Blocked or refused",
      last: "last {date}",
      confirmed: "{count} confirmed",
      none: "none",
      refusals: "{count} refusals",
      injections: "{count} injection attempts",
    },
    events: {
      "chat.turn": "Answer given",
      "tool.called": "Record looked up",
      "tool.refused": "Lookup refused",
      "action.drafted": "Request drafted",
      "action.confirmed": "Request confirmed",
      "action.rejected": "Draft discarded",
      "guardrail.triggered": "Guardrail triggered",
      "assistant.refused": "Answer refused",
    },
    openConversation: "Open",
    detail: {
      refused: "Refused",
      payload: "Recorded data",
    },
    empty: {
      title: "Nothing recorded yet",
      body: "Ask the assistant something and the trail starts here.",
    },
    endOfTrail: "That is the whole trail.",
  },
};
