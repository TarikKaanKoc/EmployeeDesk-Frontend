import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocPageView } from "@/components/docs/doc-page";
import { PageShell } from "@/components/layout/page";
import { DOCS, type DocSlug } from "@/data/docs-content";

interface Props {
  params: Promise<{ slug: string }>;
}

function pick(slug: string) {
  return slug in DOCS ? DOCS[slug as DocSlug] : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = pick((await params).slug);
  return doc ? { title: doc.title, description: doc.description } : {};
}

export default async function DocsPage({ params }: Props) {
  const doc = pick((await params).slug);
  if (!doc) notFound();
  return (
    <PageShell>
      <DocPageView doc={doc} />
    </PageShell>
  );
}
