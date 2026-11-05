"use client";

import { Maximize2, Minimize2, Minus, Plus, Scan } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useScope } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const MIN = 0.2;
const MAX = 4;

/**
 * A pan-and-zoom surface for one large PNG. Wheel zooms around the
 * pointer, drag pans, the buttons step, "fit" shows the whole picture.
 * It does its own maths instead of pulling a library: the image is one
 * element, and a transform on it is all that is needed.
 */
export function DiagramViewer({
  src,
  alt,
  width,
  height,
  className,
  fullscreen,
  onToggleFullscreen,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}) {
  const t = useScope("docs");
  const frame = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const fit = useCallback(() => {
    const el = frame.current;
    if (!el) return;
    const pad = 24;
    const scale = Math.min((el.clientWidth - pad) / width, (el.clientHeight - pad) / height);
    setView({ scale, x: (el.clientWidth - width * scale) / 2, y: (el.clientHeight - height * scale) / 2 });
  }, [width, height]);

  useEffect(() => {
    fit();
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  function zoomAt(factor: number, cx?: number, cy?: number) {
    const el = frame.current;
    if (!el) return;
    setView((v) => {
      const next = Math.min(MAX, Math.max(MIN, v.scale * factor));
      const k = next / v.scale;
      const px = cx ?? el.clientWidth / 2;
      const py = cy ?? el.clientHeight / 2;
      return { scale: next, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  }

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = el!.getBoundingClientRect();
      zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX - rect.left, event.clientY - rect.top);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className={cn("bg-muted/40 relative overflow-hidden rounded-xl border", className)}>
      <div
        ref={frame}
        className={cn("absolute inset-0 touch-none select-none", dragging ? "cursor-grabbing" : "cursor-grab")}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
          setDragging(true);
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const d = drag.current;
          setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }));
        }}
        onPointerUp={() => {
          drag.current = null;
          setDragging(false);
        }}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          zoomAt(1.6, e.clientX - rect.left, e.clientY - rect.top);
        }}
      >
        {/* Native img on purpose: next/image would re-encode a 4000px diagram and blur the small type. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          draggable={false}
          className="absolute top-0 left-0 max-w-none origin-top-left rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,.06)]"
          style={{ width, height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        />
      </div>

      <div className="bg-background/95 absolute end-3 top-3 flex items-center gap-0.5 rounded-lg border p-0.5 shadow-sm backdrop-blur" dir="ltr">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => zoomAt(1 / 1.25)} aria-label={t.zoomOut}>
          <Minus className="size-4" />
        </Button>
        <span className="text-muted-foreground w-12 text-center text-xs tabular-nums">{Math.round(view.scale * 100)}%</span>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => zoomAt(1.25)} aria-label={t.zoomIn}>
          <Plus className="size-4" />
        </Button>
        <span className="bg-border mx-0.5 h-5 w-px" />
        <Button variant="ghost" size="icon" className="size-8" onClick={fit} aria-label={t.fit}>
          <Scan className="size-4" />
        </Button>
        {onToggleFullscreen ? (
          <Button variant="ghost" size="icon" className="size-8" onClick={onToggleFullscreen} aria-label={fullscreen ? t.exitFull : t.openFull}>
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
