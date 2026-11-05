"use client";

import {
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { useDirection, useScope } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/* Geometry, in viewBox units. Both lenses share a radius; the pupil sits well
   inside so it still reads as a disc when it is pressed against the rim. */
const LENS = [
  { cx: 64, cy: 51.5 },
  { cx: 181.3, cy: 51.5 },
] as const;
const LENS_R = 38.5;
const PUPIL_R = 22.5;
/** Extra radius the pupil gains when the pointer is right on the face. */
/** How far a pupil may travel from the lens centre before it hits the rim. */
const REACH = LENS_R - PUPIL_R;
const FACE_CY = 51.5;

/** Mouth curve depths: how far below the corners the middle of the lip sits. */
const MOUTH_SMILE = 13;
const MOUTH_GRIN = 19;
const MOUTH_FLAT = 0;

/** Per-frame catch-up while attentive. 1 would snap; this lands in a few frames. */
const FOLLOW = 0.35;
/** Per-frame catch-up while bored: a slow drift back to centre. */
const FOLLOW_BORED = 0.04;
/** Pointer still for this long and the face loses interest. */
const BORED_AFTER_MS = 4500;

/** Pointer speed (px/ms) that counts as a flick worth a startled look. */
const STARTLE_SPEED = 3.2;
const STARTLE_MS = 240;
const STARTLE_COOLDOWN_MS = 2200;

/** One line of reading, edge to edge, while an answer is being written. */
const READ_LINE_MS = 1100;
/** How long a failure shows on the face before it lets it go on its own. */
const ERROR_HOLD_MS = 2600;
const GRIN_MS = 650;
const WAKE_MS = 160;

export type CopilotFaceProps = {
  className?: string;
  /** An answer is being written: the eyes narrow and read along the line. */
  thinking?: boolean;
  /** The composer has focus: the gaze drops to it and waits. */
  listening?: boolean;
  /** Where to look while listening - normally the composer. */
  attention?: RefObject<HTMLElement | null>;
  /** Bumped on every keystroke: the gaze twitches along the text being typed. */
  typedAt?: number;
  /** Bumped when a request fails: the glasses droop and the eyes look away. */
  errorAt?: number;
  /** Bumped when a fresh thread opens: the glasses settle into place. */
  wakeAt?: number;
};

/**
 * The assistant's face - the eyes follow the pointer.
 *
 * This screen opens on an empty box, and the one thing that makes an empty box
 * feel ready to be spoken to is something on it that is awake and looking at
 * you. Tracking beats a canned animation because it is the reader's own
 * movement coming back at them.
 *
 * Each pupil aims from its own lens at the pointer, so a cursor close to the
 * face makes the eyes converge on it instead of sliding in parallel. Movement
 * is written straight to the DOM from a requestAnimationFrame loop - no React
 * render and no CSS transition sit between the pointer and the eye, which is
 * what makes it feel like looking rather than lagging.
 *
 * The same loop plays the conversation back on the face. Focus the composer
 * and the eyes drop to it and follow the caret as you type; send, and the nose
 * bobs before the face narrows its eyes and reads the answer out line by line
 * (left to right, or right to left in an RTL locale); when the answer lands it
 * looks back up and grins for a moment. A failed request droops the glasses
 * and sends the eyes off to one side until the pointer moves; a new thread
 * opens with the glasses settling into place.
 *
 * Smaller tells ride along too: the glasses lift when the pointer is above
 * the face and settle when it is below; the pupils widen as it comes close; a
 * fast flick startles it; a click pulls the gaze there; and if nothing moves
 * for a few seconds the eyes wander off until something does.
 *
 * The eyes never close. Blinking was tried and read as a tic at the size the
 * face is drawn in the thread, so the whole family of it - scheduled blinks,
 * a wink on send, a blink on click - is out.
 *
 * Before the pointer has moved - and on touch, where it never will - the eyes
 * fall back to the CSS drift in `globals.css`, so the face is never a pair of
 * dead dots. Under reduced motion it stays still entirely.
 */
export function CopilotFace({
  className,
  thinking = false,
  listening = false,
  attention,
  typedAt,
  errorAt,
  wakeAt,
}: CopilotFaceProps) {
  const t = useScope("copilot");
  const dir = useDirection();
  const clipId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const noseRef = useRef<SVGPathElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const pupilRefs = useRef<(SVGGElement | null)[]>([null, null]);
  const pupilDiscRefs = useRef<(SVGCircleElement | null)[]>([null, null]);

  const [tracking, setTracking] = useState(false);
  const [startled, setStartled] = useState(false);
  /* One-shot moods keyed by the timestamp that started them: the mood is on
     until its own timestamp has been marked as spent. */
  const [spentWake, setSpentWake] = useState<number | undefined>(undefined);
  const [spentError, setSpentError] = useState<number | undefined>(undefined);
  const waking = wakeAt !== undefined && wakeAt !== spentWake;
  const erroring = errorAt !== undefined && errorAt !== spentError;

  /**
   * Everything the animation loop reads lives here, so the effects that
   * translate props into gestures can poke at it without re-creating the loop.
   * Only the loop and those effects touch it; nothing here is rendered.
   */
  const anim = useRef({
    // Pointer-driven pupil targets and their eased positions.
    target: LENS.map(() => ({ x: 0, y: 0 })),
    current: LENS.map(() => ({ x: 0, y: 0 })),
    // Pose the eyes are being pulled toward regardless of the pointer.
    override: null as null | { x: number; y: number; k: number }[],
    targetLift: 0,
    lift: 0,
    targetPupil: PUPIL_R,
    pupil: PUPIL_R,
    targetNose: 0,
    nose: 0,
    targetMouth: MOUTH_SMILE,
    mouth: MOUTH_SMILE,
    bored: false,
    startledUntil: 0,
    errorUntil: 0,
    readStart: 0,
    nudge: { x: 0, y: 0, until: 0 },
    focus: null as null | { x: number; y: number },
    /** Re-measures where the caret is; set while listening. */
    locate: () => {},
    frame: 0,
    wake: () => {},
    lookAt: (() => {}) as (clientX: number, clientY: number) => void,
  });

  /* Mode flags mirrored into refs so the loop sees the latest without being
     rebuilt on every prop change. */
  const mode = useRef({ thinking, listening, dir });
  useEffect(() => {
    mode.current = { thinking, listening, dir };
  }, [thinking, listening, dir]);

  /* ── The loop ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const a = anim.current;
    let started = false;
    let boredTimer = 0;
    let startleTimer = 0;
    let lastStartle = 0;
    let last: { x: number; y: number; t: number } | null = null;

    const ease = (from: number, to: number, k: number) =>
      Math.abs(to - from) < 0.02 ? to : from + (to - from) * k;

    /** Convert a client-space point into viewBox units. */
    const toLocal = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const box = svg.getBoundingClientRect();
      if (box.width === 0) return null;
      const unit = box.width / 245;
      return { x: (clientX - box.left) / unit, y: (clientY - box.top) / unit };
    };

    /** Pupil offsets that point each lens at a viewBox-space point. */
    const aimAt = (px: number, py: number) =>
      LENS.map((lens) => {
        const dx = px - lens.cx;
        const dy = py - lens.cy;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return { x: 0, y: 0 };
        // Full deflection once the point is a couple of face-widths away;
        // closer than that the pupil eases back toward centre so a cursor
        // resting on the face is met rather than overshot.
        const amount = REACH * Math.min(1, dist / (LENS_R * 3));
        return { x: (dx / dist) * amount, y: (dy / dist) * amount };
      });

    const tick = () => {
      const now = performance.now();
      const { thinking, listening, dir } = mode.current;
      const failing = now < a.errorUntil;
      let settled = true;

      /* Where the eyes want to be this frame, most urgent first. */
      let want: { x: number; y: number }[];
      let k = a.bored ? FOLLOW_BORED : FOLLOW;
      if (failing) {
        // Off to one side and down: the look of someone who would rather not
        // have to say it. Away from the reading direction, so it also reads
        // as "not looking at the text".
        const side = dir === "rtl" ? 1 : -1;
        want = LENS.map(() => ({ x: side * REACH * 0.7, y: REACH * 0.55 }));
        k = 0.12;
        settled = false;
      } else if (thinking) {
        // Reading: sweep along a line, then jump back to its start - a
        // carriage return rather than a pendulum.
        if (!a.readStart) a.readStart = now;
        const phase = ((now - a.readStart) % READ_LINE_MS) / READ_LINE_MS;
        const along = (dir === "rtl" ? 1 - phase : phase) * 2 - 1;
        const x = along * REACH * 0.8;
        const y = REACH * 0.35 + Math.sin(phase * Math.PI) * 1.5;
        want = LENS.map(() => ({ x, y }));
        k = phase < 0.08 ? 0.5 : 0.3;
        settled = false;
      } else if (listening && a.focus) {
        const nudging = now < a.nudge.until;
        want = aimAt(a.focus.x, a.focus.y).map((p) => ({
          x: p.x + (nudging ? a.nudge.x : 0),
          y: p.y + (nudging ? a.nudge.y : 0),
        }));
        k = 0.3;
        if (nudging) settled = false;
      } else {
        want = a.target;
      }

      LENS.forEach((_, i) => {
        const cur = a.current[i];
        cur.x = ease(cur.x, want[i].x, k);
        cur.y = ease(cur.y, want[i].y, k);
        if (cur.x !== want[i].x || cur.y !== want[i].y) settled = false;
        pupilRefs.current[i]?.setAttribute(
          "transform",
          `translate(${cur.x} ${cur.y})`,
        );
      });

      // A startled face pins its pupils small for the beat, whatever the
      // distance says.
      const wantPupil = now < a.startledUntil ? PUPIL_R * 0.84 : a.targetPupil;
      a.pupil = ease(a.pupil, wantPupil, 0.25);
      if (a.pupil !== wantPupil) settled = false;
      pupilDiscRefs.current.forEach((el) =>
        el?.setAttribute("r", a.pupil.toFixed(2)),
      );

      const wantLift = failing ? 4 : a.targetLift;
      a.lift = ease(a.lift, wantLift, 0.2);
      if (a.lift !== wantLift) settled = false;
      headRef.current?.setAttribute("transform", `translate(0 ${a.lift})`);

      a.nose = ease(a.nose, a.targetNose, 0.3);
      if (a.nose !== a.targetNose) settled = false;
      noseRef.current?.setAttribute("transform", `translate(0 ${a.nose})`);

      const wantMouth = failing ? MOUTH_FLAT : a.targetMouth;
      a.mouth = ease(a.mouth, wantMouth, 0.22);
      if (a.mouth !== wantMouth) settled = false;
      mouthRef.current?.setAttribute("d", mouthPath(a.mouth));

      a.frame = settled ? 0 : window.requestAnimationFrame(tick);
    };

    a.wake = () => {
      if (!a.frame) a.frame = window.requestAnimationFrame(tick);
    };

    /** Point the whole face at a client-space position. */
    a.lookAt = (clientX: number, clientY: number) => {
      const p = toLocal(clientX, clientY);
      if (!p) return;

      aimAt(p.x, p.y).forEach((o, i) => {
        a.target[i].x = o.x;
        a.target[i].y = o.y;
      });

      // Pupils hold their resting size; dilating toward the pointer reads as
      // the face bulging its eyes at you.
      a.targetPupil = PUPIL_R;

      // Brows: above the face the glasses lift a touch, below they settle.
      const above = Math.max(-1, Math.min(1, (FACE_CY - p.y) / (LENS_R * 4)));
      a.targetLift = above > 0 ? -3 * above : 1.5 * -above;

      // Any movement is forgiveness: the failure face lets go.
      a.errorUntil = 0;

      if (!started) {
        started = true;
        setTracking(true);
      }
      if (a.bored) {
        a.bored = false;
        setTracking(true);
      }
      window.clearTimeout(boredTimer);
      boredTimer = window.setTimeout(() => {
        // Lost interest: let the pupils wander back and hand the idle drift
        // to CSS. The first move snaps attention straight back.
        a.bored = true;
        a.target.forEach((o) => {
          o.x = 0;
          o.y = 0;
        });
        a.targetPupil = PUPIL_R;
        a.targetLift = 0;
        setTracking(false);
        a.wake();
      }, BORED_AFTER_MS);

      a.wake();
    };

    function handleMove(event: PointerEvent) {
      const now = performance.now();
      if (last) {
        const dt = now - last.t;
        if (dt > 0 && dt < 80) {
          const speed =
            Math.hypot(event.clientX - last.x, event.clientY - last.y) / dt;
          if (speed > STARTLE_SPEED && now - lastStartle > STARTLE_COOLDOWN_MS) {
            lastStartle = now;
            a.startledUntil = now + STARTLE_MS;
            setStartled(true);
            window.clearTimeout(startleTimer);
            startleTimer = window.setTimeout(
              () => setStartled(false),
              STARTLE_MS,
            );
          }
        }
      }
      last = { x: event.clientX, y: event.clientY, t: now };
      a.lookAt(event.clientX, event.clientY);
    }

    function handleDown(event: PointerEvent) {
      const svg = svgRef.current;
      // Clicks on the face itself are for the face, not to be looked at; a
      // click into the composer is the start of listening, which takes the
      // gaze over on its own.
      if (
        event.target instanceof Node &&
        (svg?.contains(event.target) ||
          attention?.current?.contains(event.target))
      ) {
        return;
      }
      a.lookAt(event.clientX, event.clientY);
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleDown, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleDown);
      window.clearTimeout(boredTimer);
      window.clearTimeout(startleTimer);
      if (a.frame) window.cancelAnimationFrame(a.frame);
      a.frame = 0;
      a.wake = () => {};
      a.lookAt = () => {};
    };
  }, [attention]);

  /* ── Listening: find the composer and hold the gaze on it ─────────────── */
  useEffect(() => {
    const a = anim.current;
    if (!listening) {
      a.focus = null;
      a.wake();
      return;
    }

    const locate = () => {
      const el = attention?.current;
      const svg = svgRef.current;
      if (!el || !svg) return;
      const box = svg.getBoundingClientRect();
      if (box.width === 0) return;
      // The caret itself, when there is one: the eyes follow the writing
      // along the line, the way a listener's do. Anything else gets the
      // start of its first line.
      const point =
        el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement
          ? caretPoint(el)
          : firstLinePoint(el, dir);
      const unit = box.width / 245;
      a.focus = {
        x: (point.x - box.left) / unit,
        y: (point.y - box.top) / unit,
      };
      a.wake();
    };

    a.locate = locate;
    locate();
    window.addEventListener("resize", locate);
    window.addEventListener("scroll", locate, { passive: true, capture: true });
    // Arrow keys and mouse selection move the caret without typing.
    document.addEventListener("selectionchange", locate);
    return () => {
      a.locate = () => {};
      window.removeEventListener("resize", locate);
      window.removeEventListener("scroll", locate, { capture: true });
      document.removeEventListener("selectionchange", locate);
    };
  }, [listening, attention, dir]);

  /* ── Typing: a twitch along the line for every keystroke ──────────────── */
  useEffect(() => {
    if (typedAt === undefined) return;
    const a = anim.current;
    // The caret has moved; the eyes go with it. The bob is a small dip, not
    // a sideways jump - the sideways travel is the caret's own.
    a.locate();
    a.nudge = {
      x: 0,
      y: 0.6 + Math.random() * 0.6,
      until: performance.now() + 90,
    };
    a.wake();
  }, [typedAt]);

  /* ── Sent / done: derived from the edges of `thinking` ────────────────── */
  const wasThinking = useRef(thinking);
  const firstRender = useRef(true);
  useEffect(() => {
    const a = anim.current;
    const before = wasThinking.current;
    wasThinking.current = thinking;
    const timers: number[] = [];

    // Went into thinking - or was born thinking, which is how the answer row
    // arrives: a nod of the nose, "got it".
    if (thinking && (!before || firstRender.current)) {
      a.targetNose = -2.5;
      timers.push(
        window.setTimeout(() => {
          a.targetNose = 0;
          a.wake();
        }, 140),
      );
      a.readStart = 0;
      a.wake();
    }

    // Came out of thinking: the answer is there. Eyes back to the reader and
    // a grin that settles into the usual smile.
    if (!thinking && before) {
      a.readStart = 0;
      a.targetMouth = MOUTH_GRIN;
      timers.push(
        window.setTimeout(() => {
          a.targetMouth = MOUTH_SMILE;
          a.wake();
        }, GRIN_MS),
      );
      a.wake();
    }

    firstRender.current = false;
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [thinking]);

  /* ── Error: droop, flatten, look away ─────────────────────────────────── */
  useEffect(() => {
    if (!erroring) return;
    const a = anim.current;
    a.errorUntil = performance.now() + ERROR_HOLD_MS;
    a.wake();
    const id = window.setTimeout(() => {
      setSpentError(errorAt);
      a.wake();
    }, ERROR_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [errorAt, erroring]);

  /* ── Wake: the glasses settle into place ──────────────────────────────── */
  useEffect(() => {
    if (!waking) return;
    const a = anim.current;
    a.lift = 3;
    a.targetLift = 0;
    a.wake();
    const id = window.setTimeout(() => setSpentWake(wakeAt), WAKE_MS);
    return () => window.clearTimeout(id);
  }, [wakeAt, waking]);

  const squash = startled ? 1.14 : thinking ? 0.78 : erroring ? 0.86 : 1;

  const drifting = !tracking && !listening && !thinking && !erroring;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 245 163"
      fill="none"
      role="img"
      aria-label={t.faceLabel}
      className={cn("h-auto w-16 overflow-visible", className)}
    >
      <defs>
        {LENS.map((lens, i) => (
          <clipPath key={i} id={`${clipId}-${i}`}>
            <circle cx={lens.cx} cy={lens.cy} r={LENS_R} />
          </clipPath>
        ))}
      </defs>

      {/* Everything but the mouth rides on the "head" group, which is what
          lifts and settles with the pointer's height. */}
      <g ref={headRef}>
        {/* Lens glass, under everything, so the pupils have something to be
            clipped against and the frame strokes cover the seams. */}
        {LENS.map((lens, i) => (
          <circle
            key={i}
            cx={lens.cx}
            cy={lens.cy}
            r={LENS_R}
            className="fill-card dark:fill-foreground"
          />
        ))}

        {/* Pupils. Each one is clipped to its own lens, so at full deflection
            it is cut by the rim instead of sliding out from under the frame.
            The wrapping group is what the loop moves; the disc itself only
            narrows and breathes, so the transforms never fight. */}
        <g className={cn(drifting && "copilot-eyes")}>
          {LENS.map((lens, i) => (
            <g key={i} clipPath={`url(#${clipId}-${i})`}>
              <g
                ref={(el) => {
                  pupilRefs.current[i] = el;
                }}
              >
                <circle
                  ref={(el) => {
                    pupilDiscRefs.current[i] = el;
                  }}
                  cx={lens.cx}
                  cy={lens.cy}
                  r={PUPIL_R}
                  className="fill-foreground dark:fill-background"
                  style={{
                    transform: `scaleY(${squash})`,
                    transformOrigin: "center",
                    transformBox: "fill-box",
                    transition: "transform 120ms ease-in-out",
                  }}
                />
              </g>
            </g>
          ))}
        </g>

        {/* Frames, bridge, temples and nose - one stroke weight, drawn as
            strokes so the whole face recolours with the foreground token. */}
        <g
          className="stroke-foreground"
          strokeWidth="12.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {LENS.map((lens, i) => (
            <circle key={i} cx={lens.cx} cy={lens.cy} r={LENS_R + 6.25} />
          ))}
          {/* Temple stubs */}
          <path d="M6.25 51.5H13" />
          <path d="M232 51.5H238.75" />
          {/* Bridge */}
          <path d="M112 43.5C116.5 36 128.5 36 133 43.5" />
          {/* The nose: hangs off the bridge, runs down between the lenses and
              curls back under itself. It bobs on its own when a question is
              taken in. */}
          <path
            ref={noseRef}
            d="M128 48C127 68 138 80 138 96A10 10 0 0 1 120 103"
          />
        </g>
      </g>

      {/* The mouth. A gentle smile while idle, a grin for a beat when an
          answer lands, a flat line on failure; while the answer is being
          written it purses to a small oval, which is the same face
          mid-sentence rather than a second illustration. */}
      {thinking ? (
        <ellipse
          cx="122.5"
          cy="155"
          rx="11"
          ry="12"
          className="fill-foreground"
        />
      ) : (
        <path
          ref={mouthRef}
          d={mouthPath(MOUTH_SMILE)}
          className="stroke-foreground"
          strokeWidth="13.5"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

/** The lip as a curve whose middle hangs `depth` units below its corners. */
function mouthPath(depth: number) {
  const c = 151 + depth;
  const s = 151 + depth * 0.7;
  return `M93 151C101 ${s.toFixed(1)} 113 ${c.toFixed(1)} 122.5 ${c.toFixed(1)}S144 ${s.toFixed(1)} 152 151`;
}

/** Where the first line of an element begins, in client space. */
function firstLinePoint(el: HTMLElement, dir: "ltr" | "rtl") {
  const r = el.getBoundingClientRect();
  return {
    x: dir === "rtl" ? r.right - r.width * 0.2 : r.left + r.width * 0.2,
    y: r.top + Math.min(r.height / 2, 24),
  };
}

/* Styles that decide where text wraps and sits inside the field. */
const MIRRORED = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "wordSpacing",
  "textIndent",
  "tabSize",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "boxSizing",
  "direction",
  "textAlign",
] as const;

/**
 * The caret's position in client space.
 *
 * Fields do not expose it, so the text up to the caret is laid out again in a
 * hidden copy of the field with the same width and typography, and the point
 * just after it is measured there. Standard technique; the copy lives for one
 * measurement and is removed.
 */
function caretPoint(el: HTMLTextAreaElement | HTMLInputElement) {
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const mirror = document.createElement("div");
  for (const prop of MIRRORED) mirror.style[prop] = style[prop];
  Object.assign(mirror.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${rect.width}px`,
    visibility: "hidden",
    pointerEvents: "none",
    whiteSpace: el instanceof HTMLTextAreaElement ? "pre-wrap" : "pre",
    overflowWrap: "break-word",
  } satisfies Partial<CSSStyleDeclaration>);
  const dirAttr = el.getAttribute("dir");
  if (dirAttr) mirror.setAttribute("dir", dirAttr);

  const end = el.selectionEnd ?? el.value.length;
  mirror.textContent = el.value.slice(0, end);
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const m = marker.getBoundingClientRect();
  const box = mirror.getBoundingClientRect();
  mirror.remove();

  return {
    x: rect.left + (m.left - box.left) - el.scrollLeft,
    y: rect.top + (m.top - box.top) + m.height / 2 - el.scrollTop,
  };
}
