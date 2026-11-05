import type { Metadata } from "next";

import { AssistantConsole } from "@/components/assistant/assistant-console";
import { getScope } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getScope("copilot");
  return { title: t.title, description: t.metaDescription };
}

/**
 * The assistant. No page header: the empty state is the page, and the
 * screen introduces itself. Threads load client-side from the API.
 */
export default function AssistantPage() {
  return <AssistantConsole />;
}
