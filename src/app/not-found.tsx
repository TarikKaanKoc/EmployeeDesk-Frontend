import type { Metadata } from "next";

import { NotFoundError } from "@/components/errors/not-found-error";
import { getScope } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getScope("errors");
  return { title: t.notFound.title };
}

export default function NotFound() {
  return <NotFoundError />;
}
