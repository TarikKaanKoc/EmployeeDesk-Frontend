import type { PluralForms } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries";

export const copilot: Dictionary["copilot"] = {
  title: "المساعد",
  metaDescription: "اسأل عن سياسة الموارد البشرية والمشتريات، وإجازاتك، وطلبات الشراء الخاصة بك.",

  hero: {
    eyebrow: "EmployeeDesk",
    heading: "كيف يمكنني مساعدتك؟",
    grounded:
      "رصيد إجازاتك وطلباتك، وطلبات الشراء الخاصة بك، وسياسة الموارد البشرية أو المشتريات مع البند الذي جاءت منه.",
  },

  suggestions: [
    { id: "requests", label: "طلبات إجازتي", question: "ما هي طلبات الإجازة الخاصة بي وما حالتها؟" },
    { id: "sick", label: "رصيد الإجازة المرضية", question: "كم يوماً تبقى لي من الإجازة المرضية؟" },
    { id: "pr-policy", label: "ما يتطلبه طلب الشراء", question: "ما الذي يجب أن يتضمنه طلب الشراء قبل تقديمه؟" },
    { id: "sick-day", label: "يوم إجازة مرضية", question: "قدّم يوم إجازة مرضية ليوم غد" },
  ],

  composer: {
    placeholder: "اسأل عن الإجازة أو طلب الشراء أو السياسة…",
    label: "اطرح سؤالاً",
    remaining: "{count} حرفاً متبقياً",
    hint: "Enter للإرسال · Shift + Enter لسطر جديد",
    send: "إرسال السؤال",
  },

  faceLabel: "مساعد EmployeeDesk",

  tryAsking: "جرّب أن تسأل",

  thread: {
    history: "السجل",
    newChat: "محادثة جديدة",
    newConversation: "محادثة جديدة",
    writing: "جارٍ كتابة الإجابة…",
    thinking: "يفكّر…",
    copy: "نسخ الإجابة",
    copied: "تم النسخ",
    scrollToEnd: "الانتقال إلى الأحدث",
  },

  tools: {
    done: {
      get_leave_balance: "تم التحقق من رصيد إجازاتك",
      list_leave_requests: "تم البحث عن طلبات إجازتك",
      draft_leave_request: "تم تحضير طلب إجازة",
      get_purchase_request_status: "تم التحقق من طلب الشراء",
      search_policy: "تم البحث في السياسات",
    },
    get_leave_balance: "رصيد الإجازات",
    list_leave_requests: "طلبات الإجازة",
    draft_leave_request: "مسودة طلب إجازة",
    get_purchase_request_status: "طلب الشراء",
    search_policy: "البحث في السياسة",
    running: {
      get_leave_balance: "جارٍ التحقق من رصيد إجازاتك…",
      list_leave_requests: "جارٍ البحث عن طلبات إجازتك…",
      draft_leave_request: "جارٍ تحضير طلب الإجازة…",
      get_purchase_request_status: "جارٍ سؤال نظام المشتريات…",
      search_policy: "جارٍ البحث في السياسات…",
    },
    status: {
      ok: "تم",
      refused: "مرفوض: سجلاتك فقط",
      confirmation_required: "بانتظار تأكيدك",
      error: "تعذّر الإكمال",
      empty: "لا نتائج",
    },
  },

  citations: {
    title: "المصادر",
    count: "{count} بنود",
    section: "البند {section}",
    effective: "سارٍ من {date}",
    tooltipHint: "البند المستشهد به",
  },

  confirm: {
    fields: {
      type: "نوع الإجازة",
      dates: "التواريخ",
      days: "الأيام",
      reason: "السبب",
      range: "من {start} إلى {end}",
    },
    leaveTypes: { annual: "إجازة سنوية", sick: "إجازة مرضية" },
    reasons: {
      family: "عائلي",
      personal: "شخصي",
      medical: "طبي",
      travel: "سفر",
      emergency: "طارئ",
    },
    title: "أكّد قبل الإرسال",
    body: "لم يُكتب شيء بعد. راجع المسودة ثم أكّد أو ارفض.",
    confirm: "تأكيد وإرسال",
    reject: "رفض",
    submitting: "جارٍ الإرسال…",
    submitted: "تم التقديم برقم {id}. الحالة: بانتظار الموافقة.",
    rejected: "لم يُقدَّم شيء.",
    expired: "انتهت صلاحية هذه المسودة. اسأل مجدداً لإعداد مسودة جديدة.",
    expiresAt: "تنتهي {time}",
  },

  documents: {
    hr: "سياسة الموارد البشرية",
    procurement: "سياسة المشتريات",
    information_security: "سياسة أمن المعلومات",
  },

  cards: {
    balance: {
      title: "رصيد الإجازات",
      asOf: "حتى {date}",
      available: "متاح",
      entitled: "المستحق",
      used: "المستخدم",
      pending: "قيد الانتظار",
      days: { zero: "{count} يوم", one: "يوم واحد", two: "يومان", few: "{count} أيام", many: "{count} يوماً", other: "{count} يوم" } as PluralForms,
      types: { annual: "إجازة سنوية", sick: "إجازة مرضية" },
    },
    requests: {
      title: "طلبات الإجازة",
      empty: "لا توجد طلبات إجازة بعد.",
      columns: { id: "الطلب", type: "النوع", dates: "التواريخ", days: "الأيام", status: "الحالة" },
      status: { pending: "قيد الانتظار", approved: "موافق عليه", rejected: "مرفوض", cancelled: "ملغى" },
    },
    purchase: {
      title: "طلب الشراء",
      step: "الخطوة الحالية",
      amount: "المبلغ",
      created: "تاريخ الإنشاء",
      updated: "آخر تحديث",
      status: { under_review: "قيد المراجعة", approved: "موافق عليه", returned: "معاد", rejected: "مرفوض" },
    },
  },

  flags: {
    refused: "مرفوض",
    cross_employee_request: "سجلاتك فقط",
    injection_suspected: "تم تجاهل تعليمات وردت في الإدخال",
    unsupported_answer: "غير موجود في السياسة",
    foreign_id_redacted: "تمت إزالة رقم موظف آخر",
  },

  errors: {
    notConfigured: "المساعد غير مهيّأ في هذا النشر بعد.",
    failed: "لم يجب المساعد.",
    retry: "حاول مجدداً",
    saveFailed: "تعذّر حفظ هذا التغيير.",
  },

  history: {
    title: "المحادثات",
    kept: "{count} محفوظة",
    searchPlaceholder: "ابحث في العناوين",
    searchLabel: "البحث في المحادثات",
    newConversation: "محادثة جديدة",
    delete: "حذف",
    deleteFor: "حذف “{title}”",
    deleted: "تم حذف “{title}”",
    close: "إغلاق",
    groups: {
      today: "اليوم",
      yesterday: "أمس",
      thisWeek: "هذا الأسبوع",
      thisMonth: "هذا الشهر",
      older: "أقدم",
    },
    emptyNone: "لا محادثات بعد",
    emptyNoneBody: "اسأل المساعد شيئاً وسيُحفظ هنا مع إجابته.",
    emptyNoMatch: "لا شيء يطابق ذلك",
  },
};
