import { cookies } from "next/headers";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getLocale } from "@/i18n/server";
import { getDisplayUser } from "@/lib/session-user";

interface Props {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: Props) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const locale = await getLocale();
  const user = await getDisplayUser(locale);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <NavigationProgress />
      <SmoothScroll />
      <AppSidebar user={user} />
      <SidebarInset
        id="content"
        className="h-svh min-w-0 overflow-hidden md:h-[calc(100svh-(--spacing(4)))]"
      >
        <Header />
        <div id="page-scroll" className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
