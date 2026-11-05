import { cookies } from "next/headers";

import type { User } from "@/components/layout/types";
import { USER_COOKIE } from "@/lib/session-cookie";

/** What `/api/session` stored at login: the API's `/auth/me` payload. */
export interface SessionUser {
  employeeId: string;
  email: string;
  displayNameEn: string;
  displayNameAr: string;
  department: string;
  role: string;
}

/**
 * The display copy of the signed-in employee. Readable on purpose: it carries
 * a name and an email, never authority. The token cookie is what the proxy
 * and the API gate on.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (typeof parsed?.email !== "string") return null;
    return {
      employeeId: parsed.employeeId ?? "",
      email: parsed.email,
      displayNameEn: parsed.displayNameEn ?? "",
      displayNameAr: parsed.displayNameAr ?? "",
      department: parsed.department ?? "",
      role: parsed.role ?? "",
    };
  } catch {
    return null;
  }
}

export async function getDisplayUser(locale: "en" | "ar"): Promise<User> {
  const user = await getSessionUser();
  if (!user) return { name: "Account", email: "", avatar: "", subtitle: "" };
  const name = (locale === "ar" ? user.displayNameAr : user.displayNameEn) || user.email.split("@")[0];
  return {
    name,
    email: user.email,
    avatar: "",
    subtitle: [user.employeeId, user.department].filter(Boolean).join(" · "),
  };
}
