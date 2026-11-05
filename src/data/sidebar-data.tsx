import { Activity, BrainCircuit, CalendarDays, ClipboardList, Network, ScrollText } from "lucide-react";

import { CopilotMark } from "@/components/assistant/copilot-mark";
import { type SidebarData } from "@/components/layout/types";

/**
 * Structure only - route, icon, order. Wording lives in
 * `i18n/dictionaries/*\/nav.ts` by `key`.
 */
export const sidebarData: SidebarData = {
  navGroups: [
    {
      items: [{ key: "copilot", url: "/copilot", icon: CopilotMark }],
    },
    {
      group: "me",
      items: [
        { key: "leave", url: "/leave", icon: CalendarDays },
        { key: "procurement", url: "/procurement", icon: ClipboardList },
        { key: "audit", url: "/audit", icon: ScrollText },
      ],
    },
    {
      group: "docs",
      items: [
        { key: "docsArchitecture", url: "/docs/architecture", icon: Network },
        { key: "docsAi", url: "/docs/ai", icon: BrainCircuit },
        { key: "docsMonitoring", url: "/docs/monitoring", icon: Activity },
      ],
    },
  ],
};
