"use client";

import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { FormBanner } from "@/components/auth/form-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Dictionary } from "@/i18n/dictionaries";
import { useScope } from "@/i18n/provider";
import { AuthError, login, safeDestination } from "@/lib/auth";
import { startIntro } from "@/lib/intro-store";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<"email" | "password", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

const FIELD_CLASS =
  "h-12 ps-10 text-sm transition-[color,background-color,border-color,box-shadow] duration-200 " +
  "hover:border-ring/60 focus-visible:border-primary focus-visible:ring-2 " +
  "focus-visible:ring-primary/20 focus-visible:ring-offset-0";

const FIELD_ICON_CLASS =
  "text-muted-foreground/70 pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2";

function validate(email: string, password: string, t: Dictionary["auth"]["login"]): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = t.emailRequired;
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = t.emailInvalid;
  if (!password) errors.password = t.passwordRequired;
  return errors;
}

export function LoginForm() {
  const t = useScope("auth");
  const router = useRouter();
  const search = useSearchParams();
  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();

  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [help, setHelp] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The previous refusal stays on screen while the next attempt runs:
    // clearing it here made the card collapse and reopen on every click.
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const remember = data.get("remember") === "on";
    const errors = validate(email, password, t.login);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      await login({ email: email.trim(), password, remember });
      setFormError(null);
      setHelp(null);
      const destination = safeDestination(search.get("next"), window.location.origin);
      startIntro();
      setPending(false);
      startNavigation(() => {
        router.replace(destination);
      });
    } catch (error) {
      if (error instanceof AuthError && error.code === "ACCOUNT_INACTIVE") {
        setFormError(t.login.inactive);
      } else {
        setFormError(error instanceof Error ? error.message : t.login.genericError);
        setHelp(
          error instanceof AuthError && error.status === 401
            ? t.login.refusedHelp
            : t.login.transientHelp,
        );
      }
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <div className={cn("transition-opacity duration-200", pending && "opacity-60")} aria-live="polite">
          <FormBanner title={formError}>{help}</FormBanner>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={emailId} className="text-sm">
          {t.login.email}
        </Label>
        <div className="relative">
          <Mail className={FIELD_ICON_CLASS} aria-hidden="true" />
          <Input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t.login.emailPlaceholder}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
            className={cn(FIELD_CLASS, fieldErrors.email && "border-destructive")}
            dir="ltr"
          />
        </div>
        {fieldErrors.email && (
          <p id={`${emailId}-error`} className="text-destructive text-xs">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId} className="text-sm">
          {t.login.password}
        </Label>
        <div className="relative">
          <Lock className={FIELD_ICON_CLASS} aria-hidden="true" />
          <Input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t.login.passwordPlaceholder}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
            className={cn(FIELD_CLASS, "pe-10", fieldErrors.password && "border-destructive")}
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
            aria-pressed={showPassword}
            className="text-muted-foreground/70 hover:text-foreground focus-visible:ring-ring absolute top-1/2 end-2.5 -translate-y-1/2 rounded-sm p-1 transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p id={`${passwordId}-error`} className="text-destructive text-xs">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id={rememberId} name="remember" />
        <Label htmlFor={rememberId} className="text-muted-foreground font-normal">
          {t.login.remember}
        </Label>
      </div>

      <Button
        type="submit"
        className="auth-submit mt-1 h-12 w-full text-base font-semibold tracking-[-0.005em]"
        disabled={pending || navigating}
      >
        {(pending || navigating) && <Loader2 className="size-4 animate-spin" />}
        {pending || navigating ? t.login.submitting : t.login.submit}
      </Button>
    </form>
  );
}
