"use client";

import { CalendarDays } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { WheelDatePicker } from "@/components/ui/wheel-date-picker";
import { useScope } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * The console's one date control: the value typed as `YYYY-MM-DD`, and the
 * three wheels behind a calendar mark at the field's end.
 *
 * The native `<input type="date">` was the alternative, and it renders a
 * different control in every browser, in the browser's locale rather than
 * the console's - `09/10/2026` meaning neither September nor October with
 * any certainty. This reads the same everywhere, spins Arabic months in the
 * Arabic console, and is the control the correction screen already taught
 * people.
 */
export function DateField({
  value,
  onChange,
  min,
  years,
  align = "end",
  className,
  ...input
}: {
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (next: string) => void;
  /** Earliest selectable day, `YYYY-MM-DD`. */
  min?: string;
  /** Which years the wheel offers, as offsets from this one. */
  years?: { back: number; forward: number };
  align?: "start" | "end";
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  const common = useScope("common");

  return (
    <span className="relative block">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        className={cn("pe-9 tabular-nums", className)}
        {...input}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={input.disabled}
            aria-label={common.actions.pickDate}
            className="text-muted-foreground/70 hover:text-foreground absolute inset-y-0 end-0 grid w-9 place-items-center rounded-e-md disabled:pointer-events-none disabled:opacity-50"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-72 p-3">
          <WheelDatePicker
            value={value}
            min={min}
            years={years}
            onChange={onChange}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
