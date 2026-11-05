"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  History,
  Plus,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  CitationMarker,
  ConfirmCard,
  GuardrailNotes,
  LiveStatus,
  ProcessLine,
  Sources,
} from "@/components/assistant/assistant-cards";
import { ToolResultCards } from "@/components/assistant/assistant-data-cards";
import { ChatHistory } from "@/components/assistant/chat-history";
import { CopilotFace, type CopilotFaceProps } from "@/components/assistant/copilot-face";
import { Button } from "@/components/ui/button";
import { useFormat, useLocale, useScope } from "@/i18n/provider";
import {
  ApiError,
  confirmAction,
  deleteConversation,
  getConversation,
  getConversations,
  streamChat,
  type ChatResponse,
  type Citation,
  type Conversation,
  type PendingAction,
  type ToolCall,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const CITATION = /\[(POL-\d{3})(?:,\s*[^\]]*)?\]/g;

const NEAR_BOTTOM = 120;
const MAX_MESSAGE = 2000;

interface Turn {
  id: number;
  question: string;
  /** Null until the first fragment arrives; partial while `streaming`. */
  answer: string | null;
  streaming: boolean;
  toolCalls: ToolCall[];
  citations: Citation[];
  flags: string[];
  refused: boolean;
  pendingAction: PendingAction | null;
  /** The tool running right now, announced before its result arrives. */
  activeTool: string | null;
  error?: string;
}

function GridBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 opacity-60"
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

type Block = { kind: "paragraph"; text: string } | { kind: "list"; items: string[] };

/** **bold**, `code` and [POL-001, 1.1] citations rendered inline; a citation
    becomes a footnote number that matches the Sources list. */
function renderInline(text: string, citations: Citation[]): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[POL-\d{3}[^\]]*\])/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={index} className="bg-muted rounded px-1 py-0.5 font-mono text-[13px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("[POL-")) {
      const id = part.match(CITATION)?.[0].slice(1, 8) ?? "";
      const at = citations.findIndex((c) => c.policyId === id);
      return <CitationMarker key={index} index={at >= 0 ? at + 1 : 0} citation={at >= 0 ? citations[at] : null} />;
    }
    return part;
  });
}

function parseAnswer(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: "list", items: list });
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
    } else if (!line) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line.replace(/^#{1,4}\s+/, ""));
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard refused; nothing to say.
        }
      }}
      aria-label={copied ? done : label}
      title={copied ? done : label}
      className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded-md transition-colors"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function Caret() {
  return (
    <span
      aria-hidden="true"
      className="bg-foreground/70 ms-0.5 inline-block h-[1em] w-0.5 translate-y-[0.15em] animate-pulse rounded-sm"
    />
  );
}

function AnswerMessage({
  turn,
  labels,
  face,
  children,
}: {
  turn: Turn;
  labels: { thinking: string; copy: string; copied: string };
  face?: Omit<CopilotFaceProps, "className" | "thinking">;
  children?: React.ReactNode;
}) {
  const blocks = turn.answer ? parseAnswer(turn.answer) : [];
  return (
    <div className="bg-card border-foreground/5 flex min-w-0 max-w-[92%] gap-3 rounded-3xl rounded-es-md border px-4 py-3.5 text-start break-words shadow-[0_16px_40px_-16px_rgba(35,34,48,0.25)] [overflow-wrap:anywhere]">
      <span className="relative mt-0.5 shrink-0">
        <CopilotFace className="w-6" thinking={turn.streaming} {...face} />
        {turn.streaming && <span className="sr-only">{labels.thinking}</span>}
      </span>
      <div dir="auto" className="min-w-0 flex-1">
        {turn.answer ? (
          <>
            {turn.toolCalls.length > 0 ? (
              <div className="mb-2">
                <ProcessLine calls={turn.toolCalls} />
              </div>
            ) : null}
            <div className="mb-3 empty:hidden">
              <ToolResultCards calls={turn.toolCalls} />
            </div>
            <div className="space-y-3">
              {blocks.map((block, index) =>
                block.kind === "paragraph" ? (
                  <p key={index} className="text-[15px] leading-7">
                    {renderInline(block.text, turn.citations)}
                    {turn.streaming && index === blocks.length - 1 && <Caret />}
                  </p>
                ) : (
                  <ul key={index} className="space-y-1.5 ps-1">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-2.5 text-[15px] leading-7">
                        <span aria-hidden="true" className="bg-primary/60 mt-3 size-1.5 shrink-0 rounded-full" />
                        <span>
                          {renderInline(item, turn.citations)}
                          {turn.streaming && index === blocks.length - 1 && itemIndex === block.items.length - 1 && <Caret />}
                        </span>
                      </li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </>
        ) : (
          <>
            <LiveStatus calls={turn.toolCalls} activeTool={turn.activeTool} />
            <div className="mt-3 empty:hidden">
              <ToolResultCards calls={turn.toolCalls} />
            </div>
          </>
        )}
        {children}
        {!turn.streaming ? <Sources citations={turn.citations} /> : null}
        {turn.answer && !turn.streaming && (
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <GuardrailNotes flags={turn.flags} refused={turn.refused} />
            <span className="ms-auto">
              <CopyButton text={turn.answer} label={labels.copy} done={labels.copied} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function AssistantConsole() {
  const params = useSearchParams();
  const seedQuestion = params.get("ask");
  const t = useScope("copilot");
  const { fmt } = useFormat();
  const locale = useLocale();

  const [input, setInput] = useState(() => seedQuestion ?? "");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [composerFocused, setComposerFocused] = useState(false);
  const [typedAt, setTypedAt] = useState<number | undefined>(undefined);
  const [errorAt, setErrorAt] = useState<number | undefined>(undefined);
  const seqRef = useRef(0);
  const [wakeAt, setWakeAt] = useState(() => Date.now());
  const threadRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const seenTurns = useRef(0);

  const thinking = turns.some((turn) => turn.streaming);
  const started = turns.length > 0;

  const faceCues: Omit<CopilotFaceProps, "className" | "thinking"> = {
    listening: composerFocused,
    attention: composerRef,
    typedAt,
    errorAt,
  };

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch(() => undefined);
  }, []);

  /* Deep links from the record screens: `?c=<id>` opens that thread, and
     `?ask=<text>` seeds the composer with a question about a record. Read
     once, on arrival; the address is not kept in sync afterwards. */
  const linkedConversation = params.get("c");
  const linkedQuestion = params.get("ask");
  useEffect(() => {
    if (linkedConversation) {
      void openConversation({ conversationId: linkedConversation } as Conversation);
    } else if (linkedQuestion) {
      composerRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedConversation, linkedQuestion]);

  useEffect(() => {
    const region = threadRef.current;
    if (!region) return;
    function distanceFromBottom() {
      return region!.scrollHeight - (region!.scrollTop + region!.clientHeight);
    }
    function onScroll() {
      const near = distanceFromBottom() < NEAR_BOTTOM;
      if (near) followRef.current = true;
      setAtBottom(near);
    }
    function release() {
      followRef.current = false;
    }
    function onWheel(event: WheelEvent) {
      if (event.deltaY < 0) release();
    }
    function onKey(event: KeyboardEvent) {
      if (["PageUp", "ArrowUp", "Home"].includes(event.key)) release();
    }
    region.addEventListener("scroll", onScroll, { passive: true });
    region.addEventListener("wheel", onWheel, { passive: true });
    region.addEventListener("touchmove", release, { passive: true });
    window.addEventListener("keydown", onKey);
    onScroll();
    return () => {
      region.removeEventListener("scroll", onScroll);
      region.removeEventListener("wheel", onWheel);
      region.removeEventListener("touchmove", release);
      window.removeEventListener("keydown", onKey);
    };
  }, [started]);

  function scrollToEnd(behavior: ScrollBehavior) {
    const region = threadRef.current;
    if (!region) return;
    region.scrollTo({ top: region.scrollHeight, behavior });
  }

  useEffect(() => {
    const added = turns.length !== seenTurns.current;
    seenTurns.current = turns.length;
    if (added) followRef.current = true;
    if (!followRef.current) return;
    requestAnimationFrame(() => scrollToEnd(added ? "smooth" : "auto"));
  }, [turns]);

  function describe(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.status === 503) return t.errors.notConfigured;
      if (error.status === 429) return error.message;
    }
    return t.errors.failed;
  }

  function patchTurn(id: number, patch: (turn: Turn) => Turn) {
    setTurns((current) => current.map((turn) => (turn.id === id ? patch(turn) : turn)));
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || thinking) return;
    setInput("");
    seqRef.current += 1;
    const id = seqRef.current;
    setTurns((current) => [
      ...current,
      { id, question: trimmed, answer: null, streaming: true, toolCalls: [], citations: [], flags: [], refused: false, pendingAction: null, activeTool: null },
    ]);
    try {
      const result: ChatResponse = await streamChat(
        { message: trimmed, conversationId: currentId, language: locale },
        (piece) => patchTurn(id, (turn) => ({ ...turn, answer: (turn.answer ?? "") + piece })),
        (call) =>
          patchTurn(id, (turn) => ({
            ...turn,
            toolCalls: [...turn.toolCalls, call],
            activeTool: null,
            pendingAction:
              call.name === "draft_leave_request" && call.status === "confirmation_required" && call.result
                ? {
                    actionId: String(call.result.action_id),
                    kind: "leave_request",
                    summary: String(call.result.summary ?? ""),
                    payload: (call.result.payload as Record<string, unknown>) ?? {},
                    expiresAt: String(call.result.expires_at ?? ""),
                  }
                : turn.pendingAction,
          })),
        undefined,
        (name) => patchTurn(id, (turn) => ({ ...turn, activeTool: name })),
      );
      patchTurn(id, (turn) => ({
        ...turn,
        answer: result.answer,
        streaming: false,
        toolCalls: result.toolCalls,
        citations: result.citations,
        flags: result.flags,
        refused: result.refused,
        pendingAction: result.pendingAction,
        activeTool: null,
      }));
      setCurrentId(result.conversationId);
      getConversations().then(setConversations).catch(() => undefined);
    } catch (error) {
      const message = describe(error);
      patchTurn(id, (turn) => ({ ...turn, streaming: false, error: message }));
      setErrorAt((current) => (current ?? 0) + 1);
    } finally {
      composerRef.current?.focus();
    }
  }

  async function decide(turnId: number, action: PendingAction, decision: "confirm" | "reject"): Promise<string> {
    try {
      const result = await confirmAction(action.actionId, decision);
      if (decision === "confirm" && result.result) {
        return fmt(t.confirm.submitted, { id: result.result.requestId });
      }
      return t.confirm.rejected;
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 404 ? t.confirm.expired : t.errors.failed;
      toast.error(message);
      patchTurn(turnId, (turn) => ({ ...turn, pendingAction: null }));
      return message;
    }
  }

  function retry(turn: Turn) {
    if (thinking) return;
    setTurns((current) => current.filter((other) => other.id !== turn.id));
    void ask(turn.question);
  }

  function startNew() {
    if (thinking) return;
    setTurns([]);
    setInput("");
    setCurrentId(null);
    setHistoryOpen(false);
    setWakeAt(Date.now());
    composerRef.current?.focus();
  }

  async function openConversation(conversation: Conversation) {
    if (thinking) return;
    try {
      const full = await getConversation(conversation.conversationId);
      const loaded: Turn[] = [];
      let pending: Turn | null = null;
      for (const message of full.messages) {
        if (message.role === "user") {
          pending = {
            id: message.id,
            question: message.content.split("\n\n<untrusted_document")[0],
            answer: null,
            streaming: false,
            toolCalls: [],
            citations: [],
            flags: [],
            refused: false,
            pendingAction: null,
            activeTool: null,
          };
          loaded.push(pending);
        } else if (pending && pending.answer === null) {
          pending.answer = message.content;
          pending.toolCalls = message.toolCalls ?? [];
          pending.citations = message.citations ?? [];
          pending.flags = message.flags ?? [];
          pending.refused = (message.flags ?? []).includes("unsupported_answer");
        } else {
          loaded.push({
            id: message.id,
            question: "",
            answer: message.content,
            streaming: false,
            toolCalls: [],
            citations: [],
            flags: message.flags ?? [],
            refused: false,
            pendingAction: null,
            activeTool: null,
          });
        }
      }
      setTurns(loaded);
      setCurrentId(full.conversationId);
      setHistoryOpen(false);
      setInput("");
    } catch {
      toast.error(t.errors.failed);
    }
  }

  async function removeConversation(id: string) {
    const removed = conversations.find((c) => c.conversationId === id);
    if (!removed) return;
    const before = conversations;
    setConversations((current) => current.filter((c) => c.conversationId !== id));
    if (currentId === id) {
      setTurns([]);
      setCurrentId(null);
    }
    try {
      await deleteConversation(id);
      toast.success(fmt(t.history.deleted, { title: removed.title ?? "" }));
    } catch {
      setConversations(before);
      toast.error(t.errors.saveFailed);
    }
  }

  const currentTitle = conversations.find((c) => c.conversationId === currentId)?.title ?? null;

  const history = (
    <ChatHistory
      open={historyOpen}
      onOpenChange={setHistoryOpen}
      conversations={conversations}
      currentId={currentId}
      onOpenConversation={(c) => void openConversation(c)}
      onNew={startNew}
      onDelete={(id) => void removeConversation(id)}
    />
  );

  const threadBar = (
    <div className="bg-card/90 flex min-w-0 flex-1 items-center gap-1 rounded-full border p-1 shadow-sm backdrop-blur">
      <p className="min-w-0 flex-1 truncate ps-3.5 pe-2 text-sm font-semibold" dir="auto">
        {currentTitle ?? t.thread.newConversation}
      </p>
      <Button variant="ghost" size="sm" className="hover:bg-muted h-8 rounded-full px-3" onClick={() => setHistoryOpen(true)}>
        <History className="size-4" />
        {t.thread.history}
        <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums">
          {conversations.length}
        </span>
      </Button>
      <span className="bg-border h-5 w-px" aria-hidden="true" />
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-muted h-8 rounded-full px-3"
        onClick={startNew}
        disabled={turns.length === 0 || thinking}
      >
        <Plus className="size-4" />
        {t.thread.newChat}
      </Button>
    </div>
  );

  const composer = (
    <div className="bg-card focus-within:border-primary/40 focus-within:ring-primary/10 w-full rounded-2xl border p-2 shadow-sm transition-shadow focus-within:ring-4">
      <textarea
        ref={composerRef}
        value={input}
        onChange={(event) => {
          setInput(event.target.value);
          setTypedAt(Date.now());
        }}
        onFocus={() => setComposerFocused(true)}
        onBlur={() => setComposerFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void ask(input);
          }
        }}
        rows={1}
        dir="auto"
        maxLength={MAX_MESSAGE}
        placeholder={t.composer.placeholder}
        aria-label={t.composer.label}
        className="placeholder:text-muted-foreground field-sizing-content max-h-44 min-h-9 w-full resize-none bg-transparent px-2.5 py-2 text-[15px] outline-none disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3 px-1 pt-1">
        <p className="text-muted-foreground/70 hidden truncate ps-1.5 text-[11px] sm:block">{t.composer.hint}</p>
        <div className="ms-auto flex shrink-0 items-center gap-2.5">
          {input.length >= MAX_MESSAGE * 0.8 ? (
            <span
              aria-live="polite"
              className={cn(
                "text-[11px] font-medium tabular-nums",
                input.length >= MAX_MESSAGE * 0.975 ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {fmt(t.composer.remaining, { count: MAX_MESSAGE - input.length })}
            </span>
          ) : null}
          <Button
            size="icon"
            className="size-9 rounded-full shadow-sm transition-transform enabled:hover:scale-105"
            onClick={() => void ask(input)}
            disabled={!input.trim() || thinking}
            aria-label={t.composer.send}
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const chips = (
    <div className="mx-auto hidden w-full max-w-xl flex-col items-center gap-2.5 sm:flex">
      <p className="text-muted-foreground/80 flex w-full items-center gap-3 text-[10px] font-semibold tracking-[0.18em] uppercase before:h-px before:flex-1 before:bg-current/15 after:h-px after:flex-1 after:bg-current/15">
        {t.tryAsking}
      </p>
      <div className="grid w-full grid-cols-2 gap-2">
        {t.suggestions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void ask(item.question)}
            disabled={thinking}
            className="bg-card text-foreground/90 hover:border-primary/60 hover:text-foreground focus-visible:ring-primary/40 group relative isolate inline-flex w-full items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-1.5 text-start text-xs font-medium shadow-xs transition-[border-color,box-shadow,transform,color] duration-200 ease-out hover:shadow-[0_6px_18px_-8px_var(--primary)] motion-safe:hover:-translate-y-px focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            <span className="from-primary/12 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true" />
            <span className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground inline-flex size-5 shrink-0 items-center justify-center rounded-md transition-colors duration-200">
              <Sparkles className="size-3" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <ArrowUpRight className="text-muted-foreground/50 group-hover:text-primary size-3 shrink-0 transition-colors" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );

  if (!started) {
    return (
      <div className="relative isolate -m-4 flex h-[calc(100svh-4rem)] flex-col overflow-hidden p-4 sm:-m-6 sm:p-6">
        <GridBackdrop />
        {history}
        <div className="relative z-10 mx-auto -mt-1 w-full max-w-3xl px-1">{threadBar}</div>
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-7 px-4">
          <div className="flex flex-col items-center gap-5">
            <CopilotFace className="w-[4.5rem]" wakeAt={wakeAt} {...faceCues} />
            <div className="space-y-2 text-center">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">{t.hero.eyebrow}</p>
              <h2 className="text-3xl font-semibold tracking-tight">{t.hero.heading}</h2>
              <p className="text-muted-foreground mx-auto max-w-md text-sm">{t.hero.grounded}</p>
            </div>
          </div>
          <div className="flex w-full max-w-2xl flex-col items-center gap-4">
            {composer}
            {chips}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate -m-4 flex h-[calc(100svh-4rem)] flex-col overflow-hidden p-4 sm:-m-6 sm:p-6">
      <GridBackdrop />
      {history}
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center py-2">{threadBar}</div>
        <div ref={threadRef} data-lenis-prevent="" className="no-scrollbar min-h-0 flex-1 space-y-7 overflow-x-hidden overflow-y-auto pt-4 pb-6">
          {turns.map((turn, index) => (
            <div key={turn.id} className="space-y-5">
              {turn.question ? (
                <div className="flex justify-end">
                  <div dir="auto" className="bg-sidebar rounded-ee-md min-w-0 max-w-[75%] rounded-3xl px-4 py-2.5 text-start text-[15px] leading-6 break-words text-white shadow-md [overflow-wrap:anywhere]">
                    <p className="whitespace-pre-wrap">{turn.question}</p>
                  </div>
                </div>
              ) : null}
              {turn.error ? (
                <div className="border-destructive/25 bg-destructive/5 flex min-w-0 max-w-[92%] flex-wrap items-center gap-3 rounded-3xl rounded-es-md border px-4 py-3.5">
                  <AlertTriangle className="text-destructive size-4 shrink-0" aria-hidden="true" />
                  <p className="text-destructive min-w-0 flex-1 text-sm">{turn.error}</p>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => retry(turn)}>
                    <RotateCw />
                    {t.errors.retry}
                  </Button>
                </div>
              ) : (
                <AnswerMessage
                  turn={turn}
                  face={index === turns.length - 1 ? faceCues : undefined}
                  labels={{ thinking: t.thread.thinking, copy: t.thread.copy, copied: t.thread.copied }}
                >
                  {turn.pendingAction ? (
                    <ConfirmCard
                      action={turn.pendingAction}
                      onDecide={(decision) => decide(turn.id, turn.pendingAction!, decision)}
                    />
                  ) : null}
                </AnswerMessage>
              )}
            </div>
          ))}
        </div>
        <div className="relative shrink-0 pt-2 pb-1">
          {!atBottom && (
            <div className="pointer-events-none absolute inset-x-0 -top-12 flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  followRef.current = true;
                  scrollToEnd("smooth");
                }}
                aria-label={t.thread.scrollToEnd}
                className="bg-card pointer-events-auto size-9 rounded-full shadow-md"
              >
                <ArrowDown className="size-4" />
              </Button>
            </div>
          )}
          {composer}
        </div>
      </div>
    </div>
  );
}
