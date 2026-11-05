"use client";

import { NavGroup } from "@/components/layout/nav-group";
import { NavUser } from "@/components/layout/nav-user";
import { SidebarLogo } from "@/components/layout/sidebar-logo";
import type { User } from "@/components/layout/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { sidebarData } from "@/data/sidebar-data";

interface Props extends React.ComponentProps<typeof Sidebar> {
  user: User;
}

export function AppSidebar({ user, ...props }: Props) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader className="gap-2">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((group, index) => (
          <NavGroup key={group.group ?? `group-${index}`} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-1">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
