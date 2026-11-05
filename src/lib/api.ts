/**
 * Browser-side client for the EmployeeDesk API.
 *
 * Same-origin proxy, not the API directly: the session token lives in an
 * HttpOnly cookie, and `app/api/backend` attaches the bearer server-side.
 * Types mirror the FastAPI response models in `EmployeeDesk-Backend`.
 */

export { ApiError } from "@/lib/api-error";
import { ApiError } from "@/lib/api-error";

const BASE = "/api/backend";

async function failure(response: Response): Promise<ApiError> {
  let message = response.statusText;
  let code: string | undefined;
  try {
    const body = await response.json();
    message = body.message ?? body.detail ?? message;
    code = typeof body.errorCode === "string" ? body.errorCode : undefined;
  } catch {
    // Non-JSON error body; the status text is all we have.
  }
  return new ApiError(response.status, message, code);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) throw await failure(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type Language = "en" | "ar";

export interface Me {
  employeeId: string;
  displayNameEn: string;
  displayNameAr: string;
  department: string;
  role: string;
  workLocation: string;
  email: string;
  employmentStatus: "active" | "inactive";
}

export function getMe(): Promise<Me> {
  return request<Me>("/auth/me");
}

export interface Citation {
  policyId: string;
  documentId: "hr" | "procurement" | "information_security";
  section: string;
  language: Language;
  theme: string;
  text: string;
  effectiveFrom: string;
  answerable: boolean;
}

export type ToolName =
  | "get_leave_balance"
  | "list_leave_requests"
  | "draft_leave_request"
  | "get_purchase_request_status"
  | "search_policy";

export type ToolStatus = "ok" | "refused" | "confirmation_required" | "error" | "empty";

export interface ToolCall {
  name: ToolName | string;
  status: ToolStatus;
  arguments: Record<string, unknown>;
  detail: string | null;
  /** The tool's data for tools that return records; null for refusals and errors. */
  result?: Record<string, unknown> | null;
}

export interface PendingAction {
  actionId: string;
  kind: "leave_request";
  summary: string;
  payload: Record<string, unknown>;
  expiresAt: string;
}

export interface ChatResponse {
  conversationId: string;
  language: Language;
  answer: string;
  citations: Citation[];
  toolCalls: ToolCall[];
  pendingAction: PendingAction | null;
  refused: boolean;
  flags: string[];
}

export interface Attachment {
  documentId?: string;
  title?: string;
  content?: string;
}

export interface ChatInput {
  message: string;
  conversationId?: string | null;
  language?: Language | null;
  attachments?: Attachment[];
}

export interface MessageOut {
  id: number;
  role: "user" | "assistant";
  content: string;
  language: Language;
  citations: Citation[] | null;
  toolCalls: ToolCall[] | null;
  flags: string[] | null;
  createdAt: string;
}

export interface Conversation {
  conversationId: string;
  title: string | null;
  language: Language;
  createdAt: string;
  updatedAt: string;
  messages: MessageOut[];
}

export function getConversations(): Promise<Conversation[]> {
  return request<Conversation[]>("/assistant/conversations");
}

export function getConversation(id: string): Promise<Conversation> {
  return request<Conversation>(`/assistant/conversations/${encodeURIComponent(id)}`);
}

export function deleteConversation(id: string): Promise<void> {
  return request<void>(`/assistant/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export interface ConfirmResponse {
  actionId: string;
  decision: "confirm" | "reject";
  result: { requestId: string; status: string } | null;
  message: string;
}

export function confirmAction(
  actionId: string,
  decision: "confirm" | "reject",
): Promise<ConfirmResponse> {
  return request<ConfirmResponse>(`/assistant/confirm/${encodeURIComponent(actionId)}`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

/** One server-sent event: its name and its JSON payload. */
function parseEvent(block: string): { name: string; data: unknown } | null {
  let name = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trim());
  }
  if (!data.length) return null;
  try {
    return { name, data: JSON.parse(data.join("\n")) };
  } catch {
    return null;
  }
}

/**
 * Ask the assistant and read the answer as it is written. `onToken` gets
 * each fragment; `onTool` each tool call as it completes; the promise
 * resolves with the saved turn (`done`). An `error` event rejects.
 */
export async function streamChat(
  input: ChatInput,
  onToken: (text: string) => void,
  onTool?: (call: ToolCall) => void,
  onMeta?: (meta: { conversation_id: string; language: Language; flags: string[] }) => void,
  onToolStart?: (name: string) => void,
): Promise<ChatResponse> {
  const response = await fetch(`${BASE}/assistant/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({
      message: input.message,
      conversationId: input.conversationId ?? null,
      language: input.language ?? null,
      attachments: input.attachments ?? [],
    }),
    cache: "no-store",
  });
  if (!response.ok) throw await failure(response);
  if (!response.body) throw new ApiError(502, "The answer did not stream.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: ChatResponse | null = null;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const event = parseEvent(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
      if (!event) continue;
      if (event.name === "token") onToken((event.data as { text: string }).text);
      else if (event.name === "tool_call") onTool?.(event.data as ToolCall);
      else if (event.name === "tool_start") onToolStart?.((event.data as { name: string }).name);
      else if (event.name === "meta")
        onMeta?.(event.data as { conversation_id: string; language: Language; flags: string[] });
      else if (event.name === "done") result = event.data as ChatResponse;
      else if (event.name === "error") {
        const { code, message } = event.data as { code?: string; message?: string };
        throw new ApiError(502, message ?? "The assistant did not answer.", code);
      }
    }
  }
  if (!result) throw new ApiError(502, "The answer ended before it was saved.");
  return result;
}

/**
 * My records: leave, purchase requests and the activity trail. Every call
 * is scoped to the signed-in employee by the API; there is no employee id
 * parameter to pass, by design.
 */

export type LeaveType = "annual" | "sick";
export type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveReasonCategory = "family" | "personal" | "medical" | "travel" | "emergency";

export interface LeaveBalance {
  leaveType: LeaveType;
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  asOfDate: string;
}

export interface LeaveRequest {
  requestId: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reasonCategory: LeaveReasonCategory;
  status: LeaveRequestStatus;
  confirmationRecorded: boolean;
  createdAt: string;
}

export interface LeaveRequestCreate {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reasonCategory: LeaveReasonCategory;
}

export async function getLeaveBalances(): Promise<LeaveBalance[]> {
  const out = await request<{ employeeId: string; balances: LeaveBalance[] }>("/leave/balances");
  return out.balances.map(numeric);
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const out = await request<{ employeeId: string; requests: LeaveRequest[] }>("/leave/requests");
  return out.requests;
}

export function createLeaveRequest(body: LeaveRequestCreate): Promise<LeaveRequest> {
  return request<LeaveRequest>("/leave/requests", { method: "POST", body: JSON.stringify(body) });
}

export type PurchaseRequestStatus = "under_review" | "approved" | "returned" | "rejected";

export interface PurchaseRequest {
  prNumber: string;
  requesterEmployeeId: string;
  department: string;
  businessPurpose: string;
  amountQar: number;
  status: PurchaseRequestStatus;
  currentStep: string;
  createdDate: string;
  lastUpdated: string;
  reference: string;
}

export async function getPurchaseRequests(): Promise<PurchaseRequest[]> {
  const out = await request<{ employeeId: string; requests: PurchaseRequest[] }>("/procurement/requests");
  return out.requests.map(numeric);
}

export type AuditEventType =
  | "chat.turn"
  | "tool.called"
  | "tool.refused"
  | "action.drafted"
  | "action.confirmed"
  | "action.rejected"
  | "guardrail.triggered"
  | "assistant.refused";

export interface AuditEvent {
  id: number;
  eventType: AuditEventType;
  conversationId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AuditPage {
  employeeId: string;
  events: AuditEvent[];
  nextBefore: number | null;
}

export function getAuditTrail(params: { limit?: number; before?: number | null } = {}): Promise<AuditPage> {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.before) search.set("before", String(params.before));
  const query = search.toString();
  return request<AuditPage>(`/audit/me${query ? `?${query}` : ""}`);
}

/**
 * Pydantic serialises Decimal as a JSON string, so day counts and amounts
 * arrive as "18.0". The screens do arithmetic on them; coerce once here.
 */
function numeric<T extends object>(row: T): T {
  const out = { ...row } as Record<string, unknown>;
  for (const key of ["entitledDays", "usedDays", "pendingDays", "availableDays", "amountQar"]) {
    if (typeof out[key] === "string") out[key] = Number(out[key]);
  }
  return out as T;
}
