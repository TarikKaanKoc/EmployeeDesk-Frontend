import type { Dictionary } from "@/i18n/dictionaries";

interface User {
  name: string;
  email: string;
  avatar: string;
  /** Employee id and department under the name. */
  subtitle?: string;
}

export type NavKey = keyof Dictionary["nav"]["items"];
export type NavGroupKey = keyof Dictionary["nav"]["groups"];

interface BaseNavItem {
  key: NavKey;
  badge?: "new";
  count?: number;
  icon?: React.ElementType;
  locked?: boolean;
}

export type NavItem =
  | (BaseNavItem & {
      items: (BaseNavItem & { url: string })[];
      url?: never;
    })
  | (BaseNavItem & {
      url: string;
      activePath?: string | string[];
      items?: never;
    });

interface NavGroup {
  group?: NavGroupKey;
  items: NavItem[];
}

interface SidebarData {
  navGroups: NavGroup[];
  footerGroups?: NavGroup[];
}

export type { NavGroup, SidebarData, User };
