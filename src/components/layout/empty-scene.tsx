/**
 * A small line-art scene for an empty panel - the same hand as the error
 * pages (`components/errors/error-scene.tsx`): theme tokens for every stroke
 * and fill, so it holds up in dark mode and needs no bitmap.
 *
 * `search` is a magnifier over a pile of papers: the reader looked and the
 * filter hid everything. `inbox` is an open tray with nothing in it yet.
 */
export function EmptyScene({
  kind = "search",
  className,
}: {
  kind?: "search" | "inbox" | "suppliers" | "orders";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <ellipse cx="120" cy="88" rx="104" ry="64" className="fill-primary/8" />
      {kind === "search" ? (
        <>
          {/* Papers. */}
          <rect
            x="52"
            y="44"
            width="70"
            height="88"
            rx="8"
            transform="rotate(-10 87 88)"
            className="fill-muted stroke-foreground/60"
          />
          <rect
            x="64"
            y="38"
            width="70"
            height="88"
            rx="8"
            transform="rotate(-4 99 82)"
            className="fill-card stroke-foreground/80"
            strokeWidth={2.5}
          />
          <g
            transform="rotate(-4 99 82)"
            className="stroke-foreground/25"
            strokeWidth={4}
          >
            <line x1="76" y1="58" x2="122" y2="58" />
            <line x1="76" y1="72" x2="112" y2="72" />
            <line x1="76" y1="86" x2="120" y2="86" />
            <line x1="76" y1="100" x2="98" y2="100" />
          </g>
          {/* Magnifier. */}
          <g className="motion-safe:animate-error-float">
            <line
              x1="178"
              y1="104"
              x2="206"
              y2="132"
              className="stroke-foreground/80"
              strokeWidth={12}
            />
            <line
              x1="179"
              y1="105"
              x2="205"
              y2="131"
              className="stroke-primary"
              strokeWidth={6}
            />
            <circle
              cx="152"
              cy="78"
              r="38"
              className="fill-card stroke-foreground/80"
              strokeWidth={4}
            />
            <circle
              cx="152"
              cy="78"
              r="30"
              className="fill-primary/10 stroke-primary/40"
            />
            <path
              d="M128 66 Q 134 52 148 48"
              className="stroke-primary/50"
              strokeWidth={4}
            />
            <path
              d="M143 78 h18 M152 69 v18"
              className="stroke-primary/60"
              strokeWidth={3}
            />
          </g>
          {/* Trail and stray marks. */}
          <path
            d="M22 132 C 50 110, 70 140, 100 118"
            className="stroke-primary/40"
            strokeWidth={3}
            strokeDasharray="1 8"
          />
          <text
            x="196"
            y="40"
            fontSize="18"
            className="fill-primary/40 font-sans font-bold"
          >
            ?
          </text>
          <text
            x="34"
            y="34"
            fontSize="13"
            className="fill-primary/30 font-sans font-bold"
          >
            ?
          </text>
        </>
      ) : kind === "suppliers" ? (
        <>
          {/* A supplier's premises and the record that stands for it: a
              tower with a cornice and two bands of glass, and one card
              lifting away. */}
          <line
            x1="48"
            y1="138"
            x2="192"
            y2="138"
            className="stroke-foreground/20"
            strokeWidth={3}
          />
          <rect
            x="76"
            y="52"
            width="56"
            height="86"
            className="fill-card stroke-foreground/80"
            strokeWidth={2.5}
          />
          <rect
            x="70"
            y="44"
            width="68"
            height="10"
            rx="3"
            className="fill-primary/15 stroke-foreground/80"
            strokeWidth={2.5}
          />
          <g className="fill-primary/15 stroke-foreground/30" strokeWidth={1.5}>
            <rect x="87" y="66" width="12" height="46" rx="2" />
            <rect x="109" y="66" width="12" height="46" rx="2" />
          </g>
          <path
            d="M96 138 v-14 a8 8 0 0 1 16 0 v14"
            className="fill-muted stroke-foreground/60"
            strokeWidth={2}
          />
          <g className="motion-safe:animate-error-float">
            <rect
              x="146"
              y="62"
              width="62"
              height="44"
              rx="6"
              className="fill-card stroke-foreground/80"
              strokeWidth={2.5}
            />
            <line
              x1="158"
              y1="78"
              x2="196"
              y2="78"
              className="stroke-foreground/30"
              strokeWidth={4}
            />
            <line
              x1="158"
              y1="90"
              x2="180"
              y2="90"
              className="stroke-primary/50"
              strokeWidth={4}
            />
          </g>
        </>
      ) : kind === "orders" ? (
        <>
          {/* An order, written and ticked. */}
          <rect
            x="78"
            y="38"
            width="84"
            height="104"
            rx="8"
            className="fill-card stroke-foreground/80"
            strokeWidth={2.5}
          />
          <rect
            x="104"
            y="30"
            width="32"
            height="16"
            rx="5"
            className="fill-primary/20 stroke-foreground/80"
            strokeWidth={2.5}
          />
          <g className="stroke-foreground/25" strokeWidth={4}>
            <line x1="94" y1="68" x2="146" y2="68" />
            <line x1="94" y1="84" x2="134" y2="84" />
            <line x1="94" y1="100" x2="142" y2="100" />
          </g>
          <line
            x1="94"
            y1="116"
            x2="118"
            y2="116"
            className="stroke-primary/50"
            strokeWidth={4}
          />
          <g className="motion-safe:animate-error-float">
            <circle
              cx="172"
              cy="110"
              r="24"
              className="fill-card stroke-foreground/80"
              strokeWidth={2.5}
            />
            <path
              d="M162 110 l7 7 l14 -15"
              className="stroke-primary"
              strokeWidth={4}
            />
          </g>
        </>
      ) : (
        <>
          <path
            d="M56 84 L74 52 H166 L184 84 V126 a8 8 0 0 1 -8 8 H64 a8 8 0 0 1 -8 -8 Z"
            className="fill-card stroke-foreground/80"
            strokeWidth={2.5}
          />
          <path
            d="M56 84 H98 a22 14 0 0 0 44 0 H184"
            className="fill-primary/15 stroke-foreground/80"
            strokeWidth={2.5}
          />
          <g className="motion-safe:animate-error-float">
            <rect
              x="92"
              y="24"
              width="56"
              height="40"
              rx="6"
              className="fill-card stroke-foreground/60"
            />
            <path d="M92 30 l28 18 l28 -18" className="stroke-primary/60" />
          </g>
        </>
      )}
    </svg>
  );
}
