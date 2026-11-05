"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { sidebarData } from "@/data/sidebar-data";
import { type Dictionary } from "@/i18n/dictionaries";
import { useScope } from "@/i18n/provider";

export interface Crumb {
  label: string;
  icon?: React.ElementType;
  href?: string;
}

function normalise(url: string): string {
  return url.split("?")[0].replace(/\/$/, "") || "/";
}

export function resolveCrumbs(pathname: string, nav: Dictionary["nav"], fallback: string): Crumb[] {
  const path = normalise(pathname);
  const items = nav.items as Record<string, string>;
  for (const group of sidebarData.navGroups) {
    for (const item of group.items) {
      const candidates = item.items ?? [item];
      for (const candidate of candidates) {
        if (!candidate.url) continue;
        const url = normalise(candidate.url);
        if (path === url || path.startsWith(`${url}/`)) {
          const own = { label: items[candidate.key] ?? candidate.key, icon: candidate.icon, href: candidate.url };
          return group.group ? [{ label: nav.groups[group.group] }, own] : [own];
        }
      }
    }
  }
  return [{ label: fallback }];
}

export function Breadcrumbs({ title }: { title?: string }) {
  const pathname = usePathname();
  const nav = useScope("nav");
  const meta = useScope("meta");
  const crumbs = title ? [{ label: title }] : resolveCrumbs(pathname, nav, meta.title);

  return (
    <Breadcrumb className="min-w-0" aria-label={nav.breadcrumbLabel}>
      <BreadcrumbList className="flex-nowrap overflow-hidden whitespace-nowrap">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          const Icon = crumb.icon;
          return (
            <Fragment key={crumb.label}>
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage className="flex items-center gap-1.5 truncate font-medium">
                    {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className="flex items-center gap-1.5">
                      {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="flex items-center gap-1.5">
                    {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                    {crumb.label}
                  </span>
                )}
              </BreadcrumbItem>
              {last ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
