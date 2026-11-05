"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="bg-background z-30 flex h-16 w-full min-w-0 shrink-0 items-center gap-2 border-b px-4 sm:px-6 md:rounded-t-xl">
      <SidebarTrigger className="size-8 shrink-0" />
      <Separator orientation="vertical" className="me-1 !h-4" />
      <Breadcrumbs title={title} />
      <div className="ms-auto flex shrink-0 items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
