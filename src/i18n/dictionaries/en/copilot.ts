import type { PluralForms } from "@/i18n/format";
export const copilot = {
  title: "Assistant",
  metaDescription:
    "Ask about HR and procurement policy, your leave, and your purchase requests.",

  hero: {
    eyebrow: "EmployeeDesk",
    heading: "How can I help?",
    grounded:
      "Your leave balance and requests, your purchase requests, and HR or procurement policy with the clause it comes from.",
  },

  suggestions: [
    { id: "requests", label: "My leave requests", question: "Which leave requests do I have and what is their status?" },
    { id: "sick", label: "Sick leave balance", question: "How many sick leave days do I have left?" },
    { id: "pr-policy", label: "What a purchase request needs", question: "What must a purchase request include before it is submitted?" },
    { id: "sick-day", label: "One day of sick leave", question: "Submit one day of sick leave for tomorrow" },
  ],

  composer: {
    placeholder: "Ask about leave, a purchase request, or a policy…",
    label: "Ask a question",
    remaining: "{count} characters left",
    hint: "Enter to send · Shift + Enter for a new line",
    send: "Send question",
  },

  faceLabel: "EmployeeDesk assistant",

  tryAsking: "Try asking",

  thread: {
    history: "History",
    newChat: "New chat",
    newConversation: "New conversation",
    writing: "Writing the answer…",
    thinking: "thinking…",
    copy: "Copy answer",
    copied: "Copied",
    scrollToEnd: "Jump to the latest",
  },

  tools: {
    done: {
      get_leave_balance: "Checked your leave balance",
      list_leave_requests: "Looked up your leave requests",
      draft_leave_request: "Prepared a leave request",
      get_purchase_request_status: "Checked the purchase request",
      search_policy: "Searched the policies",
    },
    get_leave_balance: "Leave balance",
    list_leave_requests: "Leave requests",
    draft_leave_request: "Leave request draft",
    get_purchase_request_status: "Purchase request",
    search_policy: "Policy search",
    running: {
      get_leave_balance: "Checking your leave balance…",
      list_leave_requests: "Looking up your leave requests…",
      draft_leave_request: "Preparing the leave request…",
      get_purchase_request_status: "Asking the procurement system…",
      search_policy: "Searching the policies…",
    },
    status: {
      ok: "done",
      refused: "refused: own records only",
      confirmation_required: "waiting for your confirmation",
      error: "could not complete",
      empty: "nothing found",
    },
  },

  citations: {
    title: "Sources",
    count: "{count} clauses",
    section: "Section {section}",
    effective: "Effective {date}",
    tooltipHint: "Cited clause",
  },

  confirm: {
    fields: {
      type: "Leave type",
      dates: "Dates",
      days: "Days",
      reason: "Reason",
      range: "{start} to {end}",
    },
    leaveTypes: { annual: "Annual leave", sick: "Sick leave" },
    reasons: {
      family: "Family",
      personal: "Personal",
      medical: "Medical",
      travel: "Travel",
      emergency: "Emergency",
    },
    title: "Confirm before it is submitted",
    body: "Nothing has been written yet. Review the draft and confirm, or reject it.",
    confirm: "Confirm and submit",
    reject: "Reject",
    submitting: "Submitting…",
    submitted: "Submitted as {id}. Status: pending approval.",
    rejected: "Nothing was submitted.",
    expired: "This draft has expired. Ask again to prepare a new one.",
    expiresAt: "Expires {time}",
  },

  documents: {
    hr: "HR Policy",
    procurement: "Procurement Policy",
    information_security: "Information Security Policy",
  },

  cards: {
    balance: {
      title: "Leave balance",
      asOf: "As of {date}",
      available: "available",
      entitled: "Entitled",
      used: "Used",
      pending: "Pending",
      days: { one: "{count} day", other: "{count} days" } as PluralForms,
      types: { annual: "Annual leave", sick: "Sick leave" },
    },
    requests: {
      title: "Leave requests",
      empty: "No leave requests yet.",
      columns: { id: "Request", type: "Type", dates: "Dates", days: "Days", status: "Status" },
      status: { pending: "Pending", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled" },
    },
    purchase: {
      title: "Purchase request",
      step: "Current step",
      amount: "Amount",
      created: "Created",
      updated: "Last updated",
      status: { under_review: "Under review", approved: "Approved", returned: "Returned", rejected: "Rejected" },
    },
  },

  flags: {
    refused: "Refused",
    cross_employee_request: "Own records only",
    injection_suspected: "Instructions in the input were ignored",
    unsupported_answer: "Not in the policy",
    foreign_id_redacted: "Another employee's id was removed",
  },

  errors: {
    notConfigured: "The assistant is not configured on this deployment yet.",
    failed: "The assistant did not answer.",
    retry: "Try again",
    saveFailed: "Could not save that change.",
  },

  history: {
    title: "Conversations",
    kept: "{count} kept",
    searchPlaceholder: "Search titles",
    searchLabel: "Search conversations",
    newConversation: "New conversation",
    delete: "Delete",
    deleteFor: "Delete “{title}”",
    deleted: "Deleted “{title}”",
    close: "Close",
    groups: {
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "Earlier this week",
      thisMonth: "Earlier this month",
      older: "Older",
    },
    emptyNone: "No conversations yet",
    emptyNoneBody: "Ask the assistant something and it will be kept here with its answer.",
    emptyNoMatch: "Nothing matches that",
  },
};
