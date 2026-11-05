"use client";

import Link from "next/link";

import { Logo, LogoMark } from "@/components/logo";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useScope } from "@/i18n/provider";

/**
 * The brand row at the head of the rail.
 *
 * It is drawn as a full-bleed 4rem band with its own hairline because the
 * content header beside it is exactly that - same height, same border - so
 * the line under the logo and the line under the breadcrumbs meet at the
 * seam and read as one continuous edge across the whole top of the app.
 * The negative margins undo `SidebarHeader`'s padding to make that possible;
 * collapsed mode restores the compact centred mark and drops the band.
 */
export function SidebarLogo() {
  const { setOpenMobile } = useSidebar();
  const nav = useScope("nav");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link
          href="/copilot"
          onClick={() => setOpenMobile(false)}
          aria-label={nav.logoLabel}
          style={{ ["--logo-accent" as string]: "var(--sidebar-primary)", ["--logo-size" as string]: "1.5rem" }}
          className="border-sidebar-border/60 hover:bg-sidebar-accent/50 focus-visible:ring-sidebar-ring -mx-2 -mt-2 flex h-16 items-center justify-center border-b px-4 transition-colors focus-visible:ring-2 focus-visible:outline-hidden group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0!"
        >
          {/* Expanded: the lockup at the same optical size the landing header
              uses - width-stretching it to the sidebar made it read as a
              different, oversized logo. Collapsed: the mark alone. */}
          <Logo className="h-6 group-data-[collapsible=icon]:hidden" style={{ ["--logo-size" as string]: "1.5rem" }} />
          <LogoMark className="hidden h-5 group-data-[collapsible=icon]:block" />
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
