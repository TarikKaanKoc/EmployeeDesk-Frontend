"use client";

import { ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useScope } from "@/i18n/provider";

import { Badge } from "../ui/badge";
import { type NavGroup, NavItem } from "./types";

/**
 * Prefetch what somebody is about to click, not everything they can see.
 *
 * Every destination on this rail is a dynamic page, so `prefetch` renders
 * the whole screen on the server - eleven of them, at once, the moment the
 * rail is on view. Measured in production that is what the long waits were:
 * a burst of full renders at the same second, each calling the API, each
 * API call crossing to the database in another region, on one instance -
 * while the CPU sat idle, because none of it was work, all of it was
 * waiting.
 *
 * On hover the router fetches the one page the pointer is heading for, and
 * the click still feels local. Keyboard users get the same on focus.
 */
function usePrefetchOnIntent() {
  const router = useRouter();
  const asked = useRef<Set<string>>(new Set());
  return (href: string) => {
    if (asked.current.has(href)) return;
    asked.current.add(href);
    router.prefetch(href);
  };
}

export function NavGroup({
  group,
  items,
  className,
}: NavGroup & { className?: string }) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const nav = useScope("nav");
  const prefetch = usePrefetchOnIntent();

  /**
   * One lookup for both halves of the rail. A top-level row is named from
   * `nav.items` and a Settings sub-row from `nav.settings`, and the item itself
   * does not know which list it came from - it only carries a key.
   */
  function label(item: { key: string }): string {
    const items = nav.items as Record<string, string>;
    return items[item.key] ?? item.key;
  }

  return (
    <SidebarGroup className={className}>
      {group ? (
        <SidebarGroupLabel>{nav.groups[group]}</SidebarGroupLabel>
      ) : null}
      <SidebarMenu>
        {items.map((item) => {
          const title = label(item);

          if (!item.items) {
            // Same rule as the sub-items below: a screen that is specified but
            // not built is shown padlocked rather than linked, because a nav
            // item that 404s reads as a broken product.
            if (item.locked) {
              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    aria-disabled="true"
                    tooltip={title}
                    title={nav.locked.notBuilt}
                  >
                    <span>
                      {item.icon && <item.icon />}
                      <span>{title}</span>
                      <Lock className="ms-auto !size-3" aria-hidden="true" />
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }
            return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  asChild
                  isActive={checkIsActive(pathname, item, true)}
                  tooltip={title}
                >
                  {/* Fetched when the pointer arrives rather than when the
                      rail appears - see `usePrefetchOnIntent`. */}
                  <Link
                    href={item.url}
                    prefetch={false}
                    onMouseEnter={() => prefetch(item.url)}
                    onFocus={() => prefetch(item.url)}
                    onTouchStart={() => prefetch(item.url)}
                    onClick={() => setOpenMobile(false)}
                  >
                    {item.icon && <item.icon />}
                    {/* Fades out flat and quick while the width rides the
                        slow fold - truncating letter by letter was the one
                        thing the eye could not leave alone. */}
                    <span className="transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none">
                      {title}
                    </span>
                    {item.badge && <NavBadge />}
                    {typeof item.count === "number" && item.count > 0 ? (
                      <Badge className="ms-auto h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums">
                        {item.count}
                      </Badge>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
          return (
            <CollapsibleNavItem
              key={item.key}
              item={item}
              title={title}
              label={label}
              lockedTitle={nav.locked.sample}
              pathname={pathname}
              onNavigate={() => setOpenMobile(false)}
            />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/**
 * A parent row with children, e.g. Settings.
 *
 * Opens on the section the reader is in and folds itself away once they have
 * picked a page: the list of nine sub-pages is a menu, not a map, and leaving
 * it open under the chosen one pushed the user block off the bottom of the
 * rail. The fold is the same 300ms slide the chevron uses, so it reads as the
 * menu tidying up rather than vanishing.
 */
function CollapsibleNavItem({
  item,
  title,
  label,
  lockedTitle,
  pathname,
  onNavigate,
}: {
  item: Extract<NavItem, { items: unknown }>;
  title: string;
  label: (item: { key: string }) => string;
  lockedTitle: string;
  pathname: string;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(() => checkIsActive(pathname, item, true));
  const prefetch = usePrefetchOnIntent();

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={title}>
            {item.icon && <item.icon />}
            <span>{title}</span>
            {item.badge && <NavBadge />}
            {/* `data-flip` rather than a hardcoded left chevron: this
                        one means "opens outward", so in Arabic it has to point
                        the other way. The 90° open state is unaffected. */}
            <ChevronRight
              data-flip
              className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent">
          <SidebarMenuSub>
            {item.items.map((subItem) =>
              subItem.locked ? (
                // A sample page: listed so the layout is not forgotten,
                // but rendered as a span so there is nothing to click
                // and nothing for the router to prefetch.
                <SidebarMenuSubItem key={subItem.key}>
                  <SidebarMenuSubButton
                    asChild
                    aria-disabled="true"
                    title={lockedTitle}
                  >
                    <span>
                      {subItem.icon && <subItem.icon />}
                      <span>{label(subItem)}</span>
                      <Lock className="ms-auto !size-3" aria-hidden="true" />
                    </span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ) : (
                <SidebarMenuSubItem key={subItem.key}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={checkIsActive(pathname, subItem)}
                  >
                    <Link
                      href={subItem.url}
                      prefetch={false}
                      onMouseEnter={() => prefetch(subItem.url)}
                      onFocus={() => prefetch(subItem.url)}
                      onTouchStart={() => prefetch(subItem.url)}
                      onClick={() => {
                        onNavigate();
                        setOpen(false);
                      }}
                    >
                      {subItem.icon && <subItem.icon />}
                      <span>{label(subItem)}</span>
                      {subItem.badge && <NavBadge />}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ),
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/**
 * The one mark the rail carries.
 *
 * `new` is an announcement: solid, spelled out, and off the item again in a
 * release or two. A permanent mark on many items would stop meaning anything.
 */
const NavBadge = () => {
  const nav = useScope("nav");
  return (
    <Badge className="rounded-full px-1 py-0 text-xs">{nav.badges.new}</Badge>
  );
};

function checkIsActive(href: string, item: NavItem, mainNav = false): boolean {
  const currentPath = normalizePath(href);

  if (item.items) {
    return item.items.some((subItem) => checkIsActive(currentPath, subItem));
  }

  const roots =
    "activePath" in item && item.activePath
      ? Array.isArray(item.activePath)
        ? item.activePath
        : [item.activePath]
      : [item.url];
  return roots.some((root) => {
    const itemPath = normalizePath(root);
    if (currentPath === itemPath) return true;
    return (
      mainNav && itemPath !== "/" && currentPath.startsWith(`${itemPath}/`)
    );
  });
}

function normalizePath(url: string): string {
  const [path] = url.split("?");
  return path.replace(/\/$/, "") || "/";
}
