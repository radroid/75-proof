"use client";

/*
 * Earned paper primitives — the hand-drawn, notebook look of the "earned"
 * design system, ported from the design project's iOS UI kit.
 *
 * These are PRESENTATIONAL only (props in, no data hooks) so they can be
 * composed both by the real dashboard (wired to live habit data) and by the
 * dev preview page used for visual iteration. They are brand-locked to the
 * earned palette on purpose — they only render inside the earned theme.
 */
import * as React from "react";
import { loadStarPositions, saveStarPositions, type StarPos } from "@/lib/star-stickers";
import { EC, HAND, SANS, STAR_PATH } from "@/components/earned/primitives";

// Wave A extracted the reusable primitives (tokens, PaperSurface,
// EarnedPaperDefs, EarnedChip, EarnedPageHeader, EarnedPrompt, HandButton) into
// components/earned/primitives. Re-export them here so existing importers of
// EarnedPaper (earned-dashboard, EarnedChecklist) keep their import paths
// unchanged. The star / checkbox / habit-row pieces below still live in this
// file (Wave B).
export * from "@/components/earned/primitives";

/** Canonical gold star, optionally filled or outlined. */
export function EarnedStar({
  size = 24,
  filled = true,
  color = EC.gold,
  stroke = EC.ink,
  sw = 3,
}: {
  size?: number;
  filled?: boolean;
  color?: string;
  stroke?: string;
  sw?: number;
}) {
  // A FILLED star keeps a thin ink outline so the shape has a ~13:1 edge
  // against the cream paper. Gold (#D8A830) fill alone is only ~1.9:1 on
  // cream — below the WCAG 1.4.11 3:1 floor for meaningful graphics — and the
  // earned star is meaningful (it marks a day as earned). The outline
  // preserves the brand gold rather than darkening it, and reads as consistent
  // with the hand-drawn ink notebook aesthetic. Ink-filled stars (e.g. on a
  // gold chip) already have contrast, so skip the redundant outline there.
  const filledOutline = filled && color !== stroke;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <path
        d={STAR_PATH}
        fill={filled ? color : "none"}
        stroke={filled ? (filledOutline ? stroke : "none") : stroke}
        strokeWidth={filled ? (filledOutline ? 3.5 : 0) : sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Slight per-star tilt + vertical drift so the earned row looks hand-placed,
// not stamped — no two stars sit at the same angle or baseline.
const STAR_TILTS = [-10, -3, 6, 11, -7, 3, -5, 8] as const;
const STAR_VDRIFT = [0, -3, 2, -2, 3, -1, 1, -4] as const;

/** 3-spoke ink burst behind a milestone star (the "Pop" reward only). */
function StarBurst({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size * 2}
      height={size * 2}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%,-50%)",
        overflow: "visible",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <line x1="50" y1="26" x2="50" y2="6" stroke={EC.ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="71" y1="60" x2="88" y2="71" stroke={EC.ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="29" y1="60" x2="12" y2="71" stroke={EC.ink} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** One "draw-on" star: the gold outline strokes itself, then the fill floods
 *  in — matching the ink tick's hand-drawn vocabulary. `beat` adds a small
 *  finishing pulse, used on the last star of the row. */
function StarDrawOn({
  size,
  tilt,
  delay,
  beat,
}: {
  size: number;
  tilt: number;
  delay: number;
  beat?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        animation: beat ? `earn-star-beat 320ms ease-out ${delay + 0.5}s both` : undefined,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ display: "block", overflow: "visible", transform: `rotate(${tilt}deg)` }}
        aria-hidden
      >
        <path
          d={STAR_PATH}
          fill={EC.gold}
          fillOpacity={0}
          stroke="none"
          style={{ animation: `earn-star-fill 0.3s ease ${delay + 0.34}s both` }}
        />
        <path
          d={STAR_PATH}
          fill="none"
          stroke={EC.gold}
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          style={{ strokeDasharray: 1, animation: `earn-star-draw 0.5s cubic-bezier(0.3,0.7,0.4,1) ${delay}s both` }}
        />
      </svg>
    </span>
  );
}

/** One "Pop" star: scales in with an over/undershoot and a 3-spoke ink burst.
 *  Reserved for milestone days so the louder beat stays special. */
function StarPop({ size, tilt, delay }: { size: number; tilt: number; delay: number }) {
  return (
    <span
      style={
        {
          position: "relative",
          display: "inline-block",
          ["--r"]: `${tilt}deg`,
          animation: `earn-star-pop 0.55s cubic-bezier(0.34,1.3,0.4,1) ${delay}s both`,
        } as React.CSSProperties
      }
    >
      <span
        style={{ position: "absolute", inset: 0, animation: `earn-star-burst 0.5s ease-out ${delay + 0.08}s both` }}
      >
        <StarBurst size={size} />
      </span>
      <EarnedStar size={size} filled />
    </span>
  );
}

/** The initial neat row of stars across the top of the page, before the user
 *  drags them anywhere. Hand-placed feel via per-star tilt + slight vertical
 *  drift; nudged down so the milestone ink burst clears the page's top edge.
 *  `width` is the overlay's pixel width; x is stored as a 0..1 fraction of it. */
function defaultStarRow(n: number, size: number, width: number, milestone: boolean): StarPos[] {
  const padTop = milestone ? Math.round(size * 0.85) : Math.round(size * 0.45);
  const stepPx = Math.round(size * 0.9); // gentle overlap, left → right
  const startPx = 22; // small left inset, clear of the red margin
  return Array.from({ length: n }, (_, i) => {
    const xpx = startPx + i * stepPx;
    const vdrift = STAR_VDRIFT[i % STAR_VDRIFT.length];
    return {
      x: clamp(xpx / width, 0, Math.max(0, 1 - size / width)),
      y: padTop + vdrift,
    };
  });
}

/**
 * The full-completion reward: one gold star per completed task, stuck onto the
 * notebook page when every task for the day is done.
 *
 * The stars are an OVERLAY (absolutely positioned over the page, no reflow) so
 * earning them never shoves the rest of the page around. Each star is
 * draggable; where the user leaves them is saved per challenge-day, so the next
 * visit replays the same sticking animation with the stars landing in their
 * chosen spots. `milestone` swaps the quiet draw-on for the louder Pop + ink
 * burst (reserved for special days). The host must be `position: relative`, and
 * re-mounting (e.g. `key={dayNumber}`) replays the animation.
 */
export function EarnedStarReward({
  count,
  milestone = false,
  storageKey,
  ariaLabel,
  onArrangementChange,
}: {
  /** One star per completed task. */
  count: number;
  /** Use the louder Pop+burst instead of the quiet draw-on. */
  milestone?: boolean;
  /** Stable per-challenge-day key for saving the user's star placement. */
  storageKey: string;
  ariaLabel?: string;
  /** Notified when the arrangement becomes custom (dragged/loaded) or default,
   *  so the host can show/hide a "reset to row" control. */
  onArrangementChange?: (hasCustom: boolean) => void;
}) {
  const n = Math.max(0, Math.floor(count));
  // Stars shrink a touch as the count grows so the default row never overflows.
  const size = n <= 6 ? 32 : n <= 9 ? 28 : 26;

  const layerRef = React.useRef<HTMLDivElement>(null);
  const [positions, setPositions] = React.useState<StarPos[] | null>(null);
  const [dragging, setDragging] = React.useState<number | null>(null);
  // Keep the latest onArrangementChange in a ref WITHOUT writing during render
  // (assigning ref.current in the body trips react-hooks/refs). The initial
  // useRef value covers the first mount; an effect keeps it current after.
  const onChangeRef = React.useRef(onArrangementChange);
  React.useEffect(() => {
    onChangeRef.current = onArrangementChange;
  });
  // Which pointer currently owns a drag, so a second finger (multi-touch) can't
  // attach a duplicate move/end pair and fight over the same star's position.
  const activePointerRef = React.useRef<number | null>(null);

  // On mount (and when the day or star count changes) load the user's saved
  // arrangement, else lay out the default top row. Measuring happens after the
  // layer is in the DOM, so the stars — and their draw-on / pop animation —
  // appear a frame later.
  React.useEffect(() => {
    if (n === 0) {
      setPositions(null);
      return;
    }
    const saved = loadStarPositions(storageKey, n);
    if (saved) {
      setPositions(saved);
      onChangeRef.current?.(true);
      return;
    }
    // `|| 360` (not `??`) so a measured 0px width also falls back instead of
    // stacking every star at x=0.
    const width = layerRef.current?.clientWidth || 360;
    setPositions(defaultStarRow(n, size, width, milestone));
    onChangeRef.current?.(false);
  }, [storageKey, n, size, milestone]);

  if (n === 0) return null;

  const beginDrag = (e: React.PointerEvent, i: number) => {
    const layer = layerRef.current;
    // This handler closes over the current render's `positions`, so reading it
    // directly gives the star's live start point — no mirror ref needed.
    const cur = positions;
    if (!layer || !cur) return;
    // Already dragging with another pointer — ignore the second finger.
    if (activePointerRef.current !== null) return;
    e.preventDefault();
    const rect = layer.getBoundingClientRect();
    const startCX = e.clientX;
    const startCY = e.clientY;
    const origLeft = cur[i].x * rect.width;
    const origTop = cur[i].y;
    const node = e.currentTarget as HTMLElement;
    // Track the live array locally so `end` can persist the final positions
    // without a render-time ref or an impure setState updater.
    let latest = cur;
    activePointerRef.current = e.pointerId;
    try {
      node.setPointerCapture(e.pointerId);
    } catch {}
    setDragging(i);
    const move = (ev: PointerEvent) => {
      const nx = clamp((origLeft + (ev.clientX - startCX)) / rect.width, 0, Math.max(0, 1 - size / rect.width));
      const ny = clamp(origTop + (ev.clientY - startCY), 0, Math.max(0, rect.height - size));
      latest = latest.map((q, idx) => (idx === i ? { x: nx, y: ny } : q));
      setPositions(latest);
    };
    const end = () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", end);
      node.removeEventListener("pointercancel", end);
      try {
        node.releasePointerCapture(e.pointerId);
      } catch {}
      activePointerRef.current = null;
      setDragging(null);
      saveStarPositions(storageKey, latest);
      onChangeRef.current?.(true);
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", end);
    node.addEventListener("pointercancel", end);
  };

  return (
    <div
      ref={layerRef}
      role="img"
      aria-label={ariaLabel ?? `${n} ${n === 1 ? "star" : "stars"} earned`}
      // Overlay: floats over the page, lets every click pass through except on
      // the stars themselves (which opt back in below).
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 4 }}
    >
      {positions?.map((pos, i) => {
        const tilt = STAR_TILTS[i % STAR_TILTS.length];
        const isDrag = dragging === i;
        return (
          <span
            key={i}
            onPointerDown={(e) => beginDrag(e, i)}
            style={{
              position: "absolute",
              left: `${pos.x * 100}%`,
              top: pos.y,
              pointerEvents: "auto",
              touchAction: "none",
              cursor: isDrag ? "grabbing" : "grab",
              zIndex: isDrag ? 10 : 1,
              filter: isDrag ? "drop-shadow(2px 5px 3px rgba(31,31,29,0.32))" : undefined,
              transition: isDrag ? "none" : "filter 120ms ease",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {milestone ? (
              <StarPop size={size} tilt={tilt} delay={i * 0.1} />
            ) : (
              <StarDrawOn size={size} tilt={tilt} delay={i * 0.1} beat={i === n - 1} />
            )}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Tiny deterministic "hand" jitter derived from a string seed, so each habit
 * row varies a little (baseline, rotation, stroke weight, shadow offset) but
 * stays stable across renders — no Math.random, no hydration mismatch.
 */
function handJitter(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const unit = (shift: number) => ((h >>> shift) & 1023) / 1023; // 0..1
  return {
    titleDy: (unit(2) - 0.5) * 2.4, // ±1.2px baseline drift
    titleRot: (unit(7) - 0.5) * 1.0, // ±0.5deg
    boxSw: 1.85 + unit(12) * 0.55, // checkbox stroke 1.85–2.4
    shadowX: 2.1 + unit(17) * 1.0, // 2.1–3.1
    shadowY: 2.1 + unit(22) * 1.0,
  };
}

/**
 * Seeded PRNG (mulberry32 over an FNV-1a hash). A given seed always yields the
 * same sequence, so an already-completed row gets a stable-but-varied tick at
 * load time with no hydration mismatch.
 */
function seededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

type TickGeom = {
  /** Short downstroke A→B (the firm press). */
  down: string;
  /** Long up-flick B→C (the fast, lighter flick). */
  up: string;
  /** Base ink weight for this tick. */
  w: number;
  /** Slight whole-stroke rotation, degrees. */
  rot: number;
};

/**
 * Build a hand-drawn tick as TWO strokes that share the elbow B: a short
 * downstroke (A→B) and a long up-flick (B→C). Randomizes STRUCTURE — vertex
 * position, leg lengths, the up-flick's angle + overshoot, the curve bow, and
 * ink weight — so no two ticks share a pose (not just jittered anchors). All
 * coords are clamped to the ~0..36 box so the flick never breaches the frame.
 * `rng` is any 0..1 source: `Math.random` for a unique tap, a seeded RNG for a
 * stable at-load tick.
 */
function buildCheck(rng: () => number): TickGeom {
  const rand = (a: number, b: number) => a + rng() * (b - a);
  const f = (n: number) => Math.round(n * 10) / 10;
  // Cubic from P to Q with a perpendicular bow, so the leg curves like a hand.
  const cubic = (P: number[], Q: number[], bow: number) => {
    const dx = Q[0] - P[0], dy = Q[1] - P[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const c1 = [P[0] + dx * 0.34 + nx * bow * 0.6, P[1] + dy * 0.34 + ny * bow * 0.6];
    const c2 = [P[0] + dx * 0.66 + nx * bow, P[1] + dy * 0.66 + ny * bow];
    return `C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(Q[0])} ${f(Q[1])}`;
  };
  // Elbow.
  const Bx = rand(13.4, 17.4), By = rand(25.8, 29.9);
  // Short leg up-and-left (length + angle both vary).
  const Ax = clamp(Bx - rand(6.5, 10.8), 4.2, 11.8);
  const Ay = clamp(By - rand(7.8, 13.2), 13.8, 21);
  // Long flick up-and-right — a confident slash that's allowed to run well past
  // the box corner (the svg is overflow-visible), with a wide length range.
  const Cx = clamp(Bx + rand(16, 25.5), 29, 40);
  const Cy = clamp(By - rand(22, 31), -4, 8);
  const A = [Ax, Ay], B = [Bx, By], C = [Cx, Cy];
  return {
    down: `M ${f(Ax)} ${f(Ay)} ${cubic(A, B, rand(-0.8, 1.3))}`,
    up: `M ${f(Bx)} ${f(By)} ${cubic(B, C, rand(0.3, 2.2))}`,
    w: rand(2.8, 3.5),
    rot: (rng() * 2 - 1) * 3,
  };
}

export type CheckState = "empty" | "checked" | "star" | "missed" | "rest";

/** Hand-drawn wobbly checkbox. The "checked" state draws a blue ink tick on,
 *  with a fresh randomized path each time it's ticked so no two are alike. */
export function EarnedCheckbox({
  state = "empty",
  size = 34,
  onClick,
  disabled,
  label = "toggle habit",
  boxStroke = 2,
  seed = "",
}: {
  state?: CheckState;
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  /** Box outline stroke width — vary slightly per row for a hand-drawn look. */
  boxStroke?: number;
  /** Stable seed (e.g. habit name) for the at-load tick path so SSR matches. */
  seed?: string;
}) {
  const isDone = state === "checked" || state === "star";

  // The ink tick. First render (incl. an already-complete day) uses a stable
  // seeded path with NO draw animation; a tap empty→done swaps in a fresh
  // Math.random path and replays the stroke. `id` keys the path so each tick
  // restarts the draw — that's what makes re-ticking always look hand-made.
  const [tick, setTick] = React.useState(() => ({
    id: 0,
    geom: buildCheck(seededRng(seed || "earned")),
    animate: false,
    dMs: 150,
    uMs: 180,
  }));
  const prevDone = React.useRef(isDone);
  React.useEffect(() => {
    const was = prevDone.current;
    prevDone.current = isDone;
    if (isDone && !was) {
      setTick((t) => ({
        id: t.id + 1,
        geom: buildCheck(Math.random),
        animate: true,
        dMs: Math.round(120 + Math.random() * 45),
        uMs: Math.round(150 + Math.random() * 55),
      }));
    }
  }, [isDone]);

  const svg = (
    <svg
      key={tick.id}
      viewBox="-1 -2 41 41"
      width={size}
      height={size}
      style={{
        display: "block",
        overflow: "visible",
        filter: "url(#earned-rough-soft)",
        transformOrigin: "center",
        animation: tick.animate ? "earn-box-press 220ms ease-out both" : undefined,
      }}
    >
      <path
        d="M4 5 C 14 3, 28 4, 33 6 C 33.5 16, 33 26, 32 32 C 22 33, 10 33, 4 31 C 3 22, 3.5 12, 4 5 Z"
        fill={state === "star" ? EC.creamLight : "none"}
        stroke={state === "rest" ? EC.sage : EC.ink}
        strokeWidth={boxStroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={state === "rest" ? "3 3" : "none"}
      />
      {state === "checked" && (
        <g transform={`rotate(${tick.geom.rot} 18 17)`}>
          {/* Beat 1 — firm downstroke (heavier ink). */}
          <path
            d={tick.geom.down}
            pathLength={1}
            fill="none"
            stroke={EC.sky}
            strokeWidth={tick.geom.w}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              tick.animate
                ? { strokeDasharray: 1, animation: `earn-draw-check ${tick.dMs}ms cubic-bezier(0.3,0.7,0.5,1) both` }
                : undefined
            }
          />
          {/* Beat 2 — faster, lighter up-flick; starts as the downstroke finishes. */}
          <path
            d={tick.geom.up}
            pathLength={1}
            fill="none"
            stroke={EC.sky}
            strokeWidth={Math.max(1.65, tick.geom.w * 0.66)}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              tick.animate
                ? { strokeDasharray: 1, animation: `earn-draw-check ${tick.uMs}ms cubic-bezier(0.4,0,0.6,1) ${tick.dMs}ms both` }
                : undefined
            }
          />
        </g>
      )}
      {state === "star" && (
        <g transform="translate(6 6) scale(0.24)">
          <path d={STAR_PATH} fill={EC.gold} stroke="none" />
        </g>
      )}
      {state === "missed" && (
        <g stroke={EC.rose} strokeWidth={2.5} strokeLinecap="round">
          <path d="M9 10 L28 27" />
          <path d="M28 10 L9 27" />
        </g>
      )}
    </svg>
  );

  if (!onClick) {
    return (
      <span style={{ width: size, height: size, display: "inline-block" }} aria-hidden>
        {svg}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="earned-focusable"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={state === "checked" || state === "star"}
      style={{
        width: size,
        height: size,
        padding: 0,
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
        touchAction: "manipulation",
      }}
    >
      {svg}
    </button>
  );
}

/** A single habit as a paper card. dashed when open, solid + sticker when done. */
export function EarnedHabitRow({
  name,
  note,
  state,
  onToggle,
  isEditable = true,
  right,
  tilt = 0,
}: {
  name: string;
  note?: string;
  state: CheckState;
  onToggle?: () => void;
  isEditable?: boolean;
  /** Optional right-aligned meta (e.g. counter control). */
  right?: React.ReactNode;
  /** Slight rotation in degrees so rows don't sit dead-parallel. */
  tilt?: number;
}) {
  const done = state === "checked" || state === "star";
  const j = handJitter(name);
  // For a plain binary habit (no counter control) the WHOLE row is the tap /
  // keyboard target — the big card looks tappable, so make it so (44px+ hit
  // area). Counter rows (which carry +/- in `right`) and locked rows keep the
  // small checkbox non-interactive so we never nest interactives or hijack the
  // steppers.
  const rowIsToggle = !!onToggle && isEditable && !right;

  const inner = (
    <>
      <EarnedCheckbox
        state={state}
        // When the row is the button, the checkbox is purely presentational.
        onClick={rowIsToggle ? undefined : isEditable ? onToggle : undefined}
        disabled={!isEditable}
        size={34}
        boxStroke={j.boxSw}
        seed={name}
        label={`${done ? "mark incomplete" : "mark complete"}: ${name}`}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: HAND,
            fontWeight: 600,
            fontSize: 23,
            lineHeight: 1.08,
            color: EC.ink,
            textDecoration: state === "star" ? `underline wavy ${EC.gold}` : "none",
            textUnderlineOffset: 5,
            wordBreak: "break-word",
            // Per-row baseline + rotation jitter so titles don't look stamped.
            transform: `translateY(${j.titleDy.toFixed(2)}px) rotate(${j.titleRot.toFixed(2)}deg)`,
            transformOrigin: "left center",
          }}
        >
          {name}
        </div>
        {note && (
          <div
            style={{
              fontFamily: SANS,
              // Real info (counter readout, "optional") — keep it at WCAG AA:
              // inkSoft at 12px is ~10:1 on the cream row (was 0.6 alpha ≈ 4.1:1).
              fontSize: 12,
              fontWeight: 500,
              color: EC.inkSoft,
              marginTop: 2,
            }}
          >
            {note}
          </div>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </>
  );

  const contentStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 13px",
    width: "100%",
    textAlign: "left",
  };

  return (
    <div style={{ position: "relative", transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      {/* Hand-drawn border on its own layer so the waver filter never touches text. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          border: `1.5px ${done ? "solid" : "dashed"} ${EC.ink}`,
          borderRadius: 11,
          // Open rows still get a faint paper wash so the ink name reads clearly
          // (open ≠ disabled) while the rule lines whisper through behind it.
          background: done ? EC.creamLight : "rgba(249,243,225,0.55)",
          // Per-row shadow offset jitter so the "stickers" aren't stamped identically.
          boxShadow: done ? `${j.shadowX.toFixed(2)}px ${j.shadowY.toFixed(2)}px 0 ${EC.ink}` : "none",
          // Dashed (open) borders smear under heavy displacement — use the gentler waver.
          filter: done ? "url(#earned-rough)" : "url(#earned-rough-soft)",
          transition: "background 140ms ease, box-shadow 140ms ease",
        }}
      />
      {rowIsToggle ? (
        <button
          type="button"
          className="earned-focusable"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={`${done ? "mark incomplete" : "mark complete"}: ${name}`}
          style={{
            ...contentStyle,
            background: "transparent",
            border: "none",
            margin: 0,
            font: "inherit",
            color: "inherit",
            cursor: "pointer",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {inner}
        </button>
      ) : (
        <div style={contentStyle}>{inner}</div>
      )}
    </div>
  );
}
