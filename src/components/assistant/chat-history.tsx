"use client";

import { MessageSquareText, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFormat, useLocale, useScope } from "@/i18n/provider";
import type { Conversation } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  currentId: string | null;
  onOpenConversation: (conversation: Conversation) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

type GroupKey = "today" | "yesterday" | "thisWeek" | "thisMonth" | "older";

function groupOf(iso: string): GroupKey {
  const date = new Date(iso);
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (date.getTime() >= start) return "today";
  if (date.getTime() >= start - day) return "yesterday";
  if (date.getTime() >= start - 7 * day) return "thisWeek";
  if (date.getTime() >= start - 30 * day) return "thisMonth";
  return "older";
}

const ORDER: GroupKey[] = ["today", "yesterday", "thisWeek", "thisMonth", "older"];

/** Past conversations, in a panel from the end edge. */
export function ChatHistory({
  open,
  onOpenChange,
  conversations,
  currentId,
  onOpenConversation,
  onDelete,
  onNew,
}: Props) {
  const t = useScope("copilot");
  const { fmt } = useFormat();
  const locale = useLocale();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = conversations.filter(
      (c) => !needle || (c.title ?? "").toLowerCase().includes(needle),
    );
    const byGroup = new Map<GroupKey, Conversation[]>();
    for (const c of matching) {
      const key = groupOf(c.updatedAt);
      byGroup.set(key, [...(byGroup.get(key) ?? []), c]);
    }
    return ORDER.filter((key) => byGroup.has(key)).map((key) => ({
      key,
      items: byGroup.get(key)!,
    }));
  }, [conversations, query]);

  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "ar" ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center justify-between gap-3">
            <span>
              {t.history.title}
              <span className="text-muted-foreground ms-2 text-xs font-normal">
                {fmt(t.history.kept, { count: conversations.length })}
              </span>
            </span>
            <Button size="sm" variant="outline" onClick={onNew}>
              <Plus />
              {t.history.newConversation}
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="border-b px-5 py-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.history.searchPlaceholder}
              aria-label={t.history.searchLabel}
              className="h-9 ps-9"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {groups.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-16 text-center text-sm">
              <MessageSquareText className="size-8 opacity-40" aria-hidden="true" />
              <p className="text-foreground font-medium">
                {query ? t.history.emptyNoMatch : t.history.emptyNone}
              </p>
              {!query ? <p className="text-xs">{t.history.emptyNoneBody}</p> : null}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.key} className="mb-4">
                <p className="text-muted-foreground px-2 pb-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  {t.history.groups[group.key]}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((c) => (
                    <li key={c.conversationId} className="group/row flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenConversation(c)}
                        className={cn(
                          "hover:bg-muted flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2.5 py-2 text-start transition-colors",
                          c.conversationId === currentId && "bg-muted",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium" dir="auto">
                            {c.title ?? t.thread.newConversation}
                          </span>
                          <span className="text-muted-foreground block text-[11px] tabular-nums">
                            {time.format(new Date(c.updatedAt))}
                          </span>
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground size-8 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100"
                        aria-label={fmt(t.history.deleteFor, { title: c.title ?? "" })}
                        onClick={() => onDelete(c.conversationId)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
