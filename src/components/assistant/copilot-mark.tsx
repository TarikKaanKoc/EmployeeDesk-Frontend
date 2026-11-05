import { cn } from "@/lib/utils";

/**
 * The copilot's face at icon size.
 *
 * The same geometry as `CopilotFace` with the tracking removed: a nav item does
 * not need eyes that follow the pointer, and mounting the live face for a 16px
 * glyph would add a pointer listener to the sidebar for the sake of movement
 * nobody can see at that scale. Strokes are heavier here than on the live face
 * because the frame outline disappears at a sixteenth of its designed size.
 *
 * Uses `currentColor` rather than the foreground token, so it inherits the
 * active and muted states of whatever menu row it sits in, like every lucide
 * icon beside it.
 */
export function CopilotMark({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 245 163"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 overflow-visible", className)}
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="64" cy="51.5" r="43" />
        <circle cx="181.3" cy="51.5" r="43" />
        <path d="M8 51.5H13" />
        <path d="M232 51.5H237" />
        <path d="M112 43.5C116.5 36 128.5 36 133 43.5" />
        <path d="M128 48C127 68 138 80 138 96A10 10 0 0 1 120 103" />
        <path d="M93 151C101 160 113 164 122.5 164S144 160 152 151" />
      </g>
      <circle cx="74" cy="43" r="21" fill="currentColor" />
      <circle cx="191" cy="43" r="21" fill="currentColor" />
    </svg>
  );
}
