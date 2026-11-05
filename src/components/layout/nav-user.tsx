"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { User } from "@/components/layout/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRtl, useScope } from "@/i18n/provider";
import { logout } from "@/lib/auth";

interface Props {
  user: User;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function NavUser({ user }: Props) {
  const { isMobile } = useSidebar();
  const t = useScope("shell");
  const [signingOut, setSigningOut] = useState(false);
  const rtl = useRtl();
  const fallback = initials(user.name);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } catch {
      toast.error(t.user.logoutFailed);
      setSigningOut(false);
      return;
    }
    window.location.replace("/login");
  }

  const identity = (
    <div className="grid flex-1 text-start text-sm leading-tight">
      <span className="truncate font-semibold">{user.name}</span>
      {user.subtitle ? <span className="truncate text-xs">{user.subtitle}</span> : null}
    </div>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:rounded-md">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg text-xs font-semibold group-data-[collapsible=icon]:rounded-md">
                  {fallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none">
                <span className="truncate font-semibold">{user.name}</span>
                {user.subtitle ? (
                  <span className="truncate text-xs">{user.subtitle}</span>
                ) : null}
              </div>
              <ChevronsUpDown className="ms-auto size-4 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="menu-dark w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl p-1.5 shadow-xl"
            side={isMobile ? "bottom" : rtl ? "left" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg text-xs font-semibold">
                    {fallback}
                  </AvatarFallback>
                </Avatar>
                {identity}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} disabled={signingOut}>
              <LogOut />
              {t.user.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
