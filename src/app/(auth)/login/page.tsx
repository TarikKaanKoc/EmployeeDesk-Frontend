import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { FormSkeleton } from "@/components/layout/page-skeleton";
import { getScope } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getScope("auth");
  return { title: t.login.metaTitle, description: t.login.metaDescription };
}

export default async function LoginPage() {
  const t = await getScope("auth");
  return (
    <AuthShell
      title={t.login.title}
      description={t.login.description}
      footer={<p>{t.login.syntheticNote}</p>}
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
