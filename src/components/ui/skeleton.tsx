import { cn } from "@/lib/utils";

/**
 * A placeholder for something that is on its way.
 *
 * Two treatments. The default pulse is for a first paint, where the whole
 * screen is scaffolding; `shimmer` is for a swap inside a screen the reader
 * is already looking at - stepping to the next bill, say - where a light
 * travelling across the shape reads as "this is being fetched" rather than
 * as the page having gone blank. `onDark` is the same sweep in white, for
 * the placeholders that sit on the dark header.
 */
function Skeleton({
  className,
  shimmer = false,
  onDark = false,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean;
  onDark?: boolean;
  /**
   * The element to draw.
   *
   * A div by default, and `span` where the placeholder stands in for text
   * inside a heading or a description: those render as `<h2>` and `<p>`,
   * which cannot legally hold a div, and the browser fixes the nesting by
   * moving it - so the server's HTML and the client's disagree and the
   * hydration fails.
   */
  as?: "div" | "span";
}) {
  return (
    <Tag
      className={cn(
        "rounded-md",
        onDark
          ? "ed-shimmer-light"
          : shimmer
            ? "ed-shimmer"
            : "bg-primary/10 animate-pulse",
        className,
        Tag === "span" && "block",
      )}
      {...props}
    />
  );
}

export { Skeleton };
