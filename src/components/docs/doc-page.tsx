"use client";

import { Bell, Box, CheckCheck, Eye, Globe, Lock, Map, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DiagramViewer } from "@/components/docs/diagram-viewer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DOC_ORDER, type DocCard, type DocPage } from "@/data/docs-content";
import { useScope } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const ICON: Record<DocCard["icon"], React.ElementType> = {
  globe: Globe,
  lock: Lock,
  box: Box,
  shield: ShieldCheck,
  wrench: Wrench,
  check: CheckCheck,
  eye: Eye,
  bell: Bell,
  map: Map,
};

/**
 * Diagram first. The picture is the document; the cards under it are the
 * few things a reader should take away, and the segmented control at the
 * top moves between the three notes without a trip through the rail.
 */
export function DocPageView({ doc }: { doc: DocPage }) {
  const t = useScope("docs");
  const nav = useScope("nav");
  const [full, setFull] = useState(false);
  const labels = { architecture: nav.items.docsArchitecture, ai: nav.items.docsAi, monitoring: nav.items.docsMonitoring } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{doc.title}</h2>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">{doc.description}</p>
        </div>
        <nav className="bg-muted/60 flex rounded-lg p-1" aria-label={nav.groups.docs}>
          {DOC_ORDER.map((slug) => (
            <Link
              key={slug}
              href={`/docs/${slug}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                slug === doc.slug ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={slug === doc.slug ? "page" : undefined}
            >
              {labels[slug]}
            </Link>
          ))}
        </nav>
      </div>

      <DiagramViewer
        src={doc.image}
        alt={doc.title}
        width={doc.width}
        height={doc.height}
        className="h-[min(68svh,760px)]"
        onToggleFullscreen={() => setFull(true)}
      />
      <p className="text-muted-foreground -mt-3 text-xs">{t.hint}</p>

      <div className={cn("grid gap-4", doc.cards.length > 2 ? "md:grid-cols-2" : "md:grid-cols-2")}>
        {doc.cards.map((card) => {
          const Icon = ICON[card.icon];
          return (
            <section key={card.title} className="bg-card rounded-xl border p-5" dir="ltr">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{card.title}</h3>
              </div>
              <p className="text-foreground/85 mt-3 text-sm leading-6">{card.body}</p>
            </section>
          );
        })}
      </div>

      <p className="text-muted-foreground text-xs" dir="ltr">
        {t.source}: <span className="font-mono">{doc.source}</span>
      </p>

      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent className="h-[94svh] w-[97vw] max-w-none gap-0 p-2 sm:p-3 [&>button]:hidden">
          <DialogTitle className="sr-only">{doc.title}</DialogTitle>
          <DiagramViewer src={doc.image} alt={doc.title} width={doc.width} height={doc.height} className="h-full" fullscreen onToggleFullscreen={() => setFull(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
