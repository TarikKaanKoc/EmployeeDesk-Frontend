import type { errors as en } from "@/i18n/dictionaries/en/errors";

export const errors: typeof en = {
  backToDashboard: "العودة إلى لوحة المعلومات",
  backToSignIn: "العودة إلى تسجيل الدخول",

  api: {
    notAuthenticated: "لم تسجّل الدخول.",
    unreachable: "الخدمة غير متاحة الآن. أعد المحاولة بعد قليل.",
    missingCredentials: "أدخل بريدك الإلكتروني وكلمة المرور.",
    signInFailed: "تعذّر تسجيل الدخول. أعد المحاولة.",
  },

  forbidden: {
    code: "403",
    title: "الوصول ممنوع",
    description:
      "ليست لديك صلاحية لعرض هذا المورد. تواصل مع مسؤول المنشأة إذا كنت ترى أن هذا خطأ.",
    action: "العودة إلى عملي",
  },

  notFound: {
    code: "404",
    title: "الصفحة غير موجودة",
    description: "الصفحة التي تبحث عنها غير موجودة أو ربما نُقلت.",
  },

  general: {
    code: "500",
    title: "حدث خطأ ما",
    description:
      "وقع خطأ غير متوقّع لدينا. أعد المحاولة، وإن تكرّر الأمر فأخبرنا.",
    reference: "المرجع: {digest}",
    retry: "إعادة المحاولة",
  },
};
