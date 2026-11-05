import type { LucideIcon } from "lucide-react";
import { Cog, Sparkles, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";

/** One hand-drawn scene per status code. */
export type SceneVariant = "401" | "403" | "404" | "500" | "503";

interface Props {
  code: string;
  /** Accepted for API symmetry; the scenes draw their own subject. */
  icon?: LucideIcon;
  variant: SceneVariant;
  className?: string;
}

/**
 * The illustration beside every error screen. Five distinct line-art scenes
 * (a lost page, a locked door, a barrier, a smoking server, a crane at work),
 * drawn as inline SVG on the theme tokens so they follow light/dark without a
 * second asset, and animated only behind `motion-safe`.
 */
export function ErrorScene({ code, variant, className }: Props) {
  const Scene = SCENES[variant];
  return (
    <div
      aria-hidden="true"
      dir="ltr"
      className={cn("relative mx-auto w-full max-w-[520px] select-none", className)}
    >
      <div className="bg-primary/15 absolute inset-[15%] rounded-full blur-3xl" />
      <Scene code={code} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Shared bits                                                             */
/* ---------------------------------------------------------------------- */

const INK = "stroke-foreground/80";
const FLOAT = "motion-safe:animate-error-float";
const ORIGIN = { transformBox: "fill-box", transformOrigin: "center" } as const;

function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      direction="ltr"
      className="relative h-auto w-full overflow-visible"
    >
      {children}
    </svg>
  );
}

/** The status code, set in the console's own face. */
function Code({
  x,
  y,
  size,
  children,
  className = "fill-primary",
}: {
  x: number;
  y: number;
  size: number;
  children: string;
  className?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor="middle"
      letterSpacing={-size * 0.05}
      className={cn("font-sans font-extrabold tabular-nums", className)}
    >
      {children}
    </text>
  );
}

function Blob() {
  return <ellipse cx="240" cy="195" rx="205" ry="145" className="fill-primary/8" />;
}

function Ground({ y = 322, w = 150 }: { y?: number; w?: number }) {
  return <ellipse cx="240" cy={y} rx={w} ry="9" className="fill-foreground/6" />;
}

function Sparkle({ x, y, size = 22, delay }: { x: number; y: number; size?: number; delay?: string }) {
  return (
    <g className={FLOAT} style={{ animationDelay: delay }}>
      <Sparkles x={x} y={y} width={size} height={size} className="stroke-primary/60" strokeWidth={1.75} />
    </g>
  );
}

function Gear({
  x,
  y,
  size,
  reverse,
  className = "stroke-primary",
}: {
  x: number;
  y: number;
  size: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <g
      style={ORIGIN}
      className={reverse ? "motion-safe:animate-error-spin-reverse" : "motion-safe:animate-error-spin"}
    >
      <Cog x={x} y={y} width={size} height={size} className={className} strokeWidth={1.4} />
    </g>
  );
}

/* ---------------------------------------------------------------------- */
/* 404 - a magnifier over a pile of papers, and nothing found              */
/* ---------------------------------------------------------------------- */

function NotFoundScene({ code }: { code: string }) {
  return (
    <Canvas>
      <Blob />
      <Ground y={326} w={170} />

      {/* Search trail. */}
      <path
        d="M40 296 C 100 240, 130 318, 190 262 S 270 226, 318 248"
        className="stroke-primary/40"
        strokeWidth={3}
        strokeDasharray="1 10"
      />

      {/* Pile of papers. */}
      <g className={FLOAT} style={{ animationDelay: "-3s" }}>
        <rect x="64" y="118" width="124" height="156" rx="12" transform="rotate(-12 126 196)" className={cn("fill-muted", INK)} />
        <rect x="86" y="108" width="124" height="156" rx="12" transform="rotate(-5 148 186)" className={cn("fill-card", INK)} strokeWidth={2.5} />
        <g transform="rotate(-5 148 186)" className="stroke-foreground/25" strokeWidth={5}>
          <line x1="108" y1="142" x2="190" y2="142" />
          <line x1="108" y1="162" x2="176" y2="162" />
          <line x1="108" y1="182" x2="188" y2="182" />
          <line x1="108" y1="202" x2="150" y2="202" />
        </g>
        <path d="M210 108 l-22 0 l22 22 z" transform="rotate(-5 148 186)" className={cn("fill-muted", INK)} />
      </g>

      {/* Magnifier. */}
      <g className={FLOAT}>
        <line x1="356" y1="240" x2="416" y2="300" className={INK} strokeWidth={18} />
        <line x1="358" y1="242" x2="414" y2="298" className="stroke-primary" strokeWidth={9} />
        <circle cx="300" cy="184" r="84" className={cn("fill-card", INK)} strokeWidth={5} />
        <circle cx="300" cy="184" r="70" className="fill-primary/10 stroke-primary/40" strokeWidth={2} />
        <path d="M246 156 Q 256 130 282 120" className="stroke-primary/50" strokeWidth={5} />
        <Code x={300} y={206} size={60}>{code}</Code>
      </g>

      {/* Stray question marks + a miss. */}
      <text x="216" y="74" fontSize="30" className="fill-primary/50 font-sans font-bold">?</text>
      <text x="410" y="120" fontSize="22" className="fill-primary/35 font-sans font-bold">?</text>
      <text x="60" y="80" fontSize="18" className="fill-primary/30 font-sans font-bold">?</text>
      <g className={FLOAT} style={{ animationDelay: "-1.5s" }}>
        <circle cx="118" cy="62" r="16" className="fill-card stroke-destructive" strokeWidth={2.5} />
        <path d="M111 55l14 14M125 55l-14 14" className="stroke-destructive" strokeWidth={2.5} />
      </g>
      <Sparkle x={396} y={44} delay="-2s" />
      <Sparkle x={150} y={300} size={16} delay="-4s" />
    </Canvas>
  );
}

/* ---------------------------------------------------------------------- */
/* 401 - a padlock, the key that opens it, and the sign-in card behind     */
/* ---------------------------------------------------------------------- */

function UnauthorizedScene({ code }: { code: string }) {
  return (
    <Canvas>
      <Blob />
      <Ground y={330} w={160} />

      {/* Sign-in card. */}
      <g>
        <rect x="256" y="52" width="180" height="212" rx="18" className={cn("fill-card", INK)} strokeWidth={2.5} />
        <circle cx="346" cy="100" r="24" className="fill-primary/15 stroke-primary/50" />
        <circle cx="346" cy="93" r="8" className="fill-primary/70" />
        <path d="M330 118 a16 11 0 0 1 32 0 z" className="fill-primary/70" />
        <rect x="280" y="140" width="132" height="24" rx="7" className="fill-muted stroke-foreground/20" />
        <rect x="280" y="174" width="132" height="24" rx="7" className="fill-muted stroke-foreground/20" />
        <g className="fill-foreground/45">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={294 + i * 12} cy="186" r="3" />
          ))}
        </g>
        <rect x="280" y="212" width="132" height="28" rx="9" className="fill-primary/25" />
        <line x1="318" y1="226" x2="374" y2="226" className="stroke-primary/60" strokeWidth={4} />
      </g>

      {/* Padlock. */}
      <g className={FLOAT}>
        <path d="M128 176 v-48 a56 56 0 0 1 112 0 v48" className={INK} strokeWidth={20} />
        <path d="M128 176 v-48 a56 56 0 0 1 112 0 v48" className="stroke-muted" strokeWidth={9} />
        <rect x="90" y="168" width="188" height="140" rx="24" className={cn("fill-primary", INK)} strokeWidth={3} />
        <circle cx="184" cy="210" r="15" className="fill-primary-foreground" />
        <rect x="177" y="218" width="14" height="26" rx="5" className="fill-primary-foreground" />
        <Code x={184} y={290} size={40} className="fill-primary-foreground">{code}</Code>
      </g>

      {/* The key, on its way. */}
      <path d="M350 300 C 300 276, 262 258, 208 236" className="stroke-primary/40" strokeWidth={3} strokeDasharray="1 10" />
      <g className={FLOAT} style={{ animationDelay: "-2.5s" }}>
        <g transform="rotate(-28 392 302)">
          <circle cx="368" cy="302" r="22" className={cn("fill-card", INK)} strokeWidth={5} />
          <circle cx="368" cy="302" r="8" className="fill-primary/40" />
          <line x1="390" y1="302" x2="460" y2="302" className={INK} strokeWidth={9} />
          <path d="M436 306 v14 M452 306 v20" className={INK} strokeWidth={7} />
        </g>
      </g>

      <Sparkle x={62} y={70} delay="-1s" />
      <Sparkle x={228} y={40} size={16} delay="-3.5s" />
      <Sparkle x={446} y={196} size={16} delay="-5s" />
    </Canvas>
  );
}

/* ---------------------------------------------------------------------- */
/* 403 - a shield behind a striped barrier, and a no-entry sign            */
/* ---------------------------------------------------------------------- */

function ForbiddenScene({ code }: { code: string }) {
  return (
    <Canvas>
      <defs>
        <pattern id="err-stripes-403" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="11" height="22" className="fill-primary" />
        </pattern>
      </defs>
      <Blob />

      {/* Shield. */}
      <g className={FLOAT}>
        <path d="M240 42 L344 80 V168 C344 236 298 288 240 314 C182 288 136 236 136 168 V80 Z" className={cn("fill-card", INK)} strokeWidth={4} />
        <path d="M240 68 L322 98 V168 C322 222 286 264 240 286 C194 264 158 222 158 168 V98 Z" className="fill-primary" />
        <Code x={240} y={198} size={56} className="fill-primary-foreground">{code}</Code>
        <rect x="192" y="216" width="96" height="10" rx="5" className="fill-primary-foreground/60" />
      </g>

      {/* Barrier. */}
      <g>
        <line x1="76" y1="318" x2="60" y2="352" className={INK} strokeWidth={5} />
        <line x1="404" y1="318" x2="420" y2="352" className={INK} strokeWidth={5} />
        <rect x="36" y="290" width="408" height="30" rx="9" className={cn("fill-card", INK)} strokeWidth={3} />
        <rect x="40" y="294" width="400" height="22" rx="7" fill="url(#err-stripes-403)" />
      </g>

      {/* No entry. */}
      <g className={FLOAT} style={{ animationDelay: "-2s" }}>
        <circle cx="398" cy="92" r="32" className="fill-card stroke-destructive" strokeWidth={6} />
        <line x1="376" y1="70" x2="420" y2="114" className="stroke-destructive" strokeWidth={6} />
      </g>

      {/* A small lock, keeping watch. */}
      <g className={FLOAT} style={{ animationDelay: "-4s" }}>
        <path d="M66 132 v-14 a18 18 0 0 1 36 0 v14" className={INK} strokeWidth={7} />
        <rect x="54" y="128" width="60" height="48" rx="10" className={cn("fill-muted", INK)} strokeWidth={2.5} />
        <circle cx="84" cy="150" r="5" className="fill-foreground/60" />
      </g>

      <Sparkle x={112} y={48} size={18} delay="-1s" />
      <Sparkle x={356} y={236} size={16} delay="-3s" />
    </Canvas>
  );
}

/* ---------------------------------------------------------------------- */
/* 500 - a server rack, smoke, and a cable that came loose                 */
/* ---------------------------------------------------------------------- */

function ServerErrorScene({ code }: { code: string }) {
  const units = [0, 1, 2, 3];
  return (
    <Canvas>
      <Blob />
      <line x1="40" y1="302" x2="440" y2="302" className="stroke-foreground/25" strokeWidth={3} />

      {/* Smoke. */}
      <g className="fill-muted stroke-foreground/30">
        <circle cx="222" cy="62" r="16" className={FLOAT} />
        <circle cx="250" cy="42" r="12" className={FLOAT} style={{ animationDelay: "-2s" }} />
        <circle cx="278" cy="58" r="9" className={FLOAT} style={{ animationDelay: "-4s" }} />
      </g>

      {/* Rack. */}
      <g>
        <rect x="166" y="82" width="150" height="220" rx="14" className={cn("fill-card", INK)} strokeWidth={4} />
        {units.map((i) => {
          const y = 96 + i * 52;
          const dead = i === 1;
          return (
            <g key={i}>
              <rect x="180" y={y} width="122" height="40" rx="8" className="fill-muted stroke-foreground/25" />
              <circle cx="196" cy={y + 20} r="4" className={dead ? "fill-destructive motion-safe:animate-pulse" : "fill-success"} />
              <circle cx="210" cy={y + 20} r="4" className={dead ? "fill-destructive/40" : "fill-success/60"} />
              <g className="stroke-foreground/25" strokeWidth={3}>
                <line x1="232" y1={y + 14} x2="288" y2={y + 14} />
                <line x1="232" y1={y + 26} x2="288" y2={y + 26} />
              </g>
            </g>
          );
        })}
      </g>

      {/* Loose cable and plug. */}
      <path d="M316 244 C 362 244, 356 296, 396 296" className={INK} strokeWidth={4} />
      <g className={FLOAT} style={{ animationDelay: "-1s" }}>
        <rect x="394" y="284" width="28" height="24" rx="5" className={cn("fill-card", INK)} strokeWidth={2.5} />
        <path d="M422 290 h14 M422 302 h14" className={INK} strokeWidth={3.5} />
        <g className="stroke-warning" strokeWidth={3}>
          <path d="M448 276 l8 -8" />
          <path d="M452 296 h11" />
          <path d="M448 316 l8 8" />
        </g>
      </g>

      {/* Warning sign with the code. */}
      <g className={FLOAT} style={{ animationDelay: "-3s" }}>
        <path d="M84 112 L152 232 H16 Z" className={cn("fill-primary", INK)} strokeWidth={4} />
        <line x1="84" y1="150" x2="84" y2="192" className="stroke-primary-foreground" strokeWidth={9} />
        <circle cx="84" cy="212" r="5" className="fill-primary-foreground" />
      </g>
      <Code x={392} y={190} size={64}>{code}</Code>

      <Sparkle x={130} y={60} size={18} delay="-2s" />
      <Sparkle x={344} y={88} size={16} delay="-4s" />
    </Canvas>
  );
}

/* ---------------------------------------------------------------------- */
/* 503 - a crane lowering the fix, cones, gears, a progress bar            */
/* ---------------------------------------------------------------------- */

function MaintenanceScene({ code }: { code: string }) {
  return (
    <Canvas>
      <defs>
        <pattern id="err-stripes-503" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="16" className="fill-primary" />
        </pattern>
        <clipPath id="err-bar-503">
          <rect x="142" y="258" width="146" height="14" rx="7" />
        </clipPath>
        <clipPath id="err-cone-503">
          <path d="M96 300 L110 214 H130 L144 300 Z" />
        </clipPath>
      </defs>
      <Blob />
      <line x1="40" y1="302" x2="440" y2="302" className={INK} strokeWidth={3} />

      {/* Crane. */}
      <g>
        <line x1="420" y1="40" x2="420" y2="302" className={INK} strokeWidth={7} />
        <line x1="150" y1="62" x2="428" y2="62" className={INK} strokeWidth={7} />
        <line x1="420" y1="34" x2="200" y2="62" className="stroke-foreground/40" strokeWidth={2} />
        <g className="stroke-foreground/30" strokeWidth={2}>
          {[170, 210, 250, 290, 330, 370].map((x) => (
            <path key={x} d={`M${x} 58 l20 -12 l20 12`} />
          ))}
        </g>
        <rect x="404" y="24" width="32" height="20" rx="4" className={cn("fill-primary", INK)} strokeWidth={2.5} />
        <rect x="406" y="292" width="28" height="12" rx="3" className={cn("fill-muted", INK)} strokeWidth={2.5} />
      </g>

      {/* The hanging block. */}
      <g className={FLOAT}>
        <line x1="230" y1="66" x2="230" y2="126" className={INK} strokeWidth={3} />
        <path d="M230 126 v8 a12 12 0 1 0 12 -14" className={INK} strokeWidth={4} />
        <rect x="170" y="146" width="120" height="82" rx="14" className={cn("fill-primary", INK)} strokeWidth={3} />
        <Code x={230} y={202} size={44} className="fill-primary-foreground">{code}</Code>
      </g>

      {/* Progress bar. */}
      <rect x="140" y="256" width="150" height="18" rx="9" className={cn("fill-card", INK)} strokeWidth={2.5} />
      <g clipPath="url(#err-bar-503)">
        <rect x="120" y="258" width="118" height="14" fill="url(#err-stripes-503)" className="motion-safe:animate-error-stripes" />
      </g>

      {/* Cone. */}
      <g>
        <path d="M96 300 L110 214 H130 L144 300 Z" className={cn("fill-primary", INK)} strokeWidth={3} />
        <g clipPath="url(#err-cone-503)" className="fill-card">
          <rect x="90" y="240" width="60" height="12" />
          <rect x="90" y="268" width="60" height="12" />
        </g>
        <rect x="80" y="296" width="80" height="10" rx="4" className={cn("fill-card", INK)} strokeWidth={2.5} />
      </g>

      {/* Gears and a wrench. */}
      <Gear x={292} y={196} size={92} />
      <Gear x={356} y={240} size={52} reverse className="stroke-primary/50" />
      <g className={FLOAT} style={{ animationDelay: "-2s" }}>
        <Wrench x={52} y={112} width={48} height={48} transform="rotate(20 76 136)" className={INK} strokeWidth={1.6} />
      </g>

      <Sparkle x={330} y={110} size={18} delay="-1s" />
      <Sparkle x={70} y={200} size={14} delay="-3s" />
    </Canvas>
  );
}

const SCENES: Record<SceneVariant, (p: { code: string }) => React.ReactElement> = {
  "401": UnauthorizedScene,
  "403": ForbiddenScene,
  "404": NotFoundScene,
  "500": ServerErrorScene,
  "503": MaintenanceScene,
};
