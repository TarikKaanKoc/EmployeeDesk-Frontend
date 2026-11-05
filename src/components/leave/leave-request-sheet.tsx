"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFormat, useScope } from "@/i18n/provider";
import {
  ApiError,
  createLeaveRequest,
  type LeaveBalance,
  type LeaveReasonCategory,
  type LeaveType,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const REASONS: LeaveReasonCategory[] = ["personal", "family", "medical", "travel", "emergency"];
const MAX_DAYS = 60;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function inclusiveDays(start: string, end: string): number | null {
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * The direct path to a leave request: the same write the assistant makes
 * after its confirmation step, here behind a form the reader fills in
 * themself. Submitting is the confirmation; the API records it as such.
 */
export function LeaveRequestSheet({
  open,
  onOpenChange,
  balances,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: LeaveBalance[];
}) {
  const t = useScope("records").leave;
  const { fmt, plural, number } = useFormat();
  const router = useRouter();
  const id = useId();

  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState<LeaveReasonCategory>("personal");
  const [pending, setPending] = useState(false);

  const balance = balances.find((b) => b.leaveType === leaveType);
  const days = useMemo(() => inclusiveDays(start, end), [start, end]);

  let problem: string | null = null;
  if (days !== null && days < 1) problem = t.form.endBeforeStart;
  else if (days !== null && days > MAX_DAYS) problem = t.form.tooLong;
  else if (days !== null && balance && days > balance.availableDays) problem = t.form.insufficient;

  const ready = days !== null && days >= 1 && !problem && !pending;

  function reset() {
    setLeaveType("annual");
    setStart("");
    setEnd("");
    setReason("personal");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setPending(true);
    try {
      const row = await createLeaveRequest({ leaveType, startDate: start, endDate: end, reasonCategory: reason });
      toast.success(fmt(t.form.submitted, { id: row.requestId }));
      onOpenChange(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError && error.message ? error.message : t.form.failed);
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5 text-start">
          <SheetTitle>{t.form.title}</SheetTitle>
          <SheetDescription>{t.form.description}</SheetDescription>
        </SheetHeader>

        <form id={`${id}-form`} onSubmit={submit} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor={`${id}-type`}>{t.form.type}</Label>
            <Select value={leaveType} onValueChange={(value) => setLeaveType(value as LeaveType)}>
              <SelectTrigger id={`${id}-type`} className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["annual", "sick"] as LeaveType[]).map((type) => {
                  const b = balances.find((row) => row.leaveType === type);
                  return (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        {t.types[type]}
                        {b ? (
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {number(b.availableDays)} {t.tiles.available}
                          </span>
                        ) : null}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${id}-start`}>{t.form.start}</Label>
              <DateField
                id={`${id}-start`}
                value={start}
                onChange={(next) => {
                  setStart(next);
                  if (!end || (end && next > end)) setEnd(next);
                }}
                min={today()}
                years={{ back: 0, forward: 1 }}
                align="start"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-end`}>{t.form.end}</Label>
              <DateField
                id={`${id}-end`}
                value={end}
                onChange={setEnd}
                min={start || today()}
                years={{ back: 0, forward: 1 }}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-reason`}>{t.form.reason}</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as LeaveReasonCategory)}>
              <SelectTrigger id={`${id}-reason`} className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t.reasons[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* The arithmetic the reader would otherwise do in their head,
              done in front of them: how long the request is, and what is
              left afterwards. Turns red the moment it stops adding up. */}
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm transition-colors",
              problem ? "border-destructive/40 bg-destructive/5" : "bg-muted/40",
            )}
            aria-live="polite"
          >
            {days === null ? (
              <p className="text-muted-foreground">{t.form.start} · {t.form.end}</p>
            ) : problem ? (
              <p className="text-destructive font-medium">{problem}</p>
            ) : (
              <>
                <p className="font-medium tabular-nums">{plural(days, t.form.summary)}</p>
                {balance ? (
                  <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                    {fmt(t.form.balanceHint, { available: number(balance.availableDays - days) })}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            {t.form.cancel}
          </Button>
          <Button type="submit" form={`${id}-form`} disabled={!ready}>
            {pending ? t.form.submitting : t.form.submit}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
