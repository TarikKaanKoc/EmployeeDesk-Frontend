import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { ApiError } from "@/lib/api-error";
import type { AuditPage, LeaveBalance, LeaveRequest, PurchaseRequest } from "@/lib/api";
import { API_URL as BACKEND } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * Server-side reads for the record screens.
 *
 * A server component cannot call the browser proxy, so it reads the
 * HttpOnly cookie itself and talks to the API directly. `server-only`
 * turns an accidental import from a client file into a build error rather
 * than a leaked token. Reads are memoised per request so a page and its
 * metadata never fetch the same path twice.
 */
const FIRST_TIMEOUT_MS = 8_000;
const RETRY_TIMEOUT_MS = 20_000;
const TRANSIENT = new Set([502, 503, 504]);

const fetchOnce = cache(async (path: string): Promise<unknown> => rawRequest(path));

function request<T>(path: string): Promise<T> {
  return fetchOnce(path) as Promise<T>;
}

async function rawRequest(path: string): Promise<unknown> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) throw new ApiError(401, "Not authenticated");

  let last: unknown;
  for (const deadline of [FIRST_TIMEOUT_MS, RETRY_TIMEOUT_MS]) {
    const final = deadline === RETRY_TIMEOUT_MS;
    let response: Response;
    try {
      response = await fetch(`${BACKEND}${path}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(deadline),
      });
    } catch (error) {
      last =
        error instanceof Error && error.name === "TimeoutError"
          ? new ApiError(504, "The API did not answer in time.")
          : error;
      if (final) throw last;
      continue;
    }
    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = await response.json();
        message = body.message ?? body.detail ?? message;
      } catch {
        // Not JSON; the status text will do.
      }
      last = new ApiError(response.status, message);
      if (final || !TRANSIENT.has(response.status)) throw last;
      continue;
    }
    return response.json();
  }
  throw last;
}

/** Decimal fields arrive as strings; the screens add them up. */
function numeric<T extends object>(row: T): T {
  const out = { ...row } as Record<string, unknown>;
  for (const key of ["entitledDays", "usedDays", "pendingDays", "availableDays", "amountQar"]) {
    if (typeof out[key] === "string") out[key] = Number(out[key]);
  }
  return out as T;
}

export async function getLeaveBalances(): Promise<LeaveBalance[]> {
  const out = await request<{ balances: LeaveBalance[] }>("/leave/balances");
  return out.balances.map(numeric);
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const out = await request<{ requests: LeaveRequest[] }>("/leave/requests");
  return out.requests;
}

export async function getPurchaseRequests(): Promise<PurchaseRequest[]> {
  const out = await request<{ requests: PurchaseRequest[] }>("/procurement/requests");
  return out.requests.map(numeric);
}

export function getAuditTrail(limit = 50): Promise<AuditPage> {
  return request<AuditPage>(`/audit/me?limit=${limit}`);
}
