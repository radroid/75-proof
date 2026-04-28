"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Settings,
  Sparkles,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { haptic } from "@/lib/haptics";

const INDICATOR_WIDTH = 68;
const INDICATOR_HEIGHT = 46;
// Pointer must move this many pixels before we treat the gesture as a drag.
// Smaller than 8 made stationary taps misfire as drags on jittery touch
// digitizers; larger than ~10 felt sluggish on a deliberate slow drag.
const DRAG_THRESHOLD_PX = 8;

type IconProps = { className?: string; strokeWidth?: number; style?: React.CSSProperties };

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard | React.ComponentType<IconProps>;
  action?: () => void;
};

// Progress now hosts the friends, requests, and activity surfaces (research
// §4 Phase 3). The pending-friend-request count rides on the Progress slot
// so users still see the signal without a dedicated nav entry.
function ProgressMobileIcon(props: IconProps) {
  const count = useQuery(api.friends.getPendingRequestCount);
  return (
    <span className="relative inline-flex">
      <TrendingUp {...props} />
      {(count ?? 0) > 0 && (
        <span
          role="status"
          aria-label={`${count} pending friend request${count! === 1 ? "" : "s"}`}
          className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground leading-none"
        >
          <span aria-hidden="true">{count! > 9 ? "9+" : count}</span>
        </span>
      )}
    </span>
  );
}

// Authed mobile nav. Coach lives here so the AI surface is reachable
// without opening the desktop sidebar — it's becoming the central
// interaction point (see BACKLOG C-3). Settings stays one tap away
// because there's no other persistent settings affordance on mobile.
const defaultNavItems: NavItem[] = [
  {
    label: "Today",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Progress",
    href: "/dashboard/progress",
    icon: ProgressMobileIcon,
  },
  {
    label: "Coach",
    href: "/dashboard/coach",
    icon: Sparkles,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function MobileBottomNav({ items }: { items?: NavItem[] } = {}) {
  const navItems = items ?? defaultNavItems;
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = navItems.findIndex(({ href, action }) => {
    if (action) return false;
    return href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);
  });

  // Single indicator — measured against the active tab's offset within the
  // nav row so motion is guaranteed horizontal-only. The previous
  // per-tab `layoutId` shared-element approach was animating Y too whenever
  // the iOS URL bar collapsed/restored between route swaps (the FROM and TO
  // bounding rects landed at different viewport-Y values when the user
  // tapped a tab while scrolled to the bottom of a page).
  const navRef = React.useRef<HTMLElement | null>(null);
  const tabRefs = React.useRef<Array<HTMLElement | null>>([]);
  const [indicatorX, setIndicatorX] = React.useState(0);
  const [indicatorReady, setIndicatorReady] = React.useState(false);
  // Tracked in state (not read from the ref during render) so the clamp in
  // `effectiveIndicatorX` recomputes when the viewport resizes.
  const [navWidth, setNavWidth] = React.useState(0);

  // Drag-to-scrub state. `dragX` is the pointer's x within the nav (or
  // null when not dragging); `dragHoverIndex` is the tab the indicator is
  // currently centered over so we can re-color the icon/label to preview
  // the destination before release.
  const [dragX, setDragX] = React.useState<number | null>(null);
  const [dragHoverIndex, setDragHoverIndex] = React.useState<number | null>(
    null,
  );
  // Pointer-down bookkeeping. Lives in a ref because pointer handlers don't
  // need to trigger renders before the threshold is crossed.
  const pointerStateRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null>(null);
  // Set true when a pointer-up resolves a drag. The Link's onClick checks
  // this and preventDefaults so we don't double-fire navigation (drag
  // already routed) and don't navigate away from a no-op same-tab drop.
  const suppressNextClickRef = React.useRef(false);

  const measureIndicator = React.useCallback(() => {
    const navEl = navRef.current;
    const tabEl = activeIndex >= 0 ? tabRefs.current[activeIndex] : null;
    if (!navEl || !tabEl) {
      setIndicatorReady(false);
      return;
    }
    const navRect = navEl.getBoundingClientRect();
    const tabRect = tabEl.getBoundingClientRect();
    setNavWidth(navRect.width);
    setIndicatorX(
      tabRect.left - navRect.left + tabRect.width / 2 - INDICATOR_WIDTH / 2,
    );
    setIndicatorReady(true);
  }, [activeIndex]);

  React.useLayoutEffect(() => {
    measureIndicator();
  }, [measureIndicator, navItems.length]);

  React.useEffect(() => {
    const navEl = navRef.current;
    if (!navEl || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measureIndicator);
    observer.observe(navEl);
    return () => observer.disconnect();
  }, [measureIndicator]);

  // Locate which tab a horizontal coordinate (in nav-local space) sits over.
  // Walks `tabRefs` rather than dividing nav width by item count so it works
  // even if the items have non-uniform widths in the future.
  const tabIndexAtX = React.useCallback(
    (localX: number): number => {
      const navEl = navRef.current;
      if (!navEl) return -1;
      const navRect = navEl.getBoundingClientRect();
      let firstNavigable = -1;
      let lastNavigable = -1;
      for (let i = 0; i < navItems.length; i++) {
        if (navItems[i].action) continue; // action items aren't drag targets
        const tab = tabRefs.current[i];
        if (!tab) continue;
        if (firstNavigable === -1) firstNavigable = i;
        lastNavigable = i;
        const r = tab.getBoundingClientRect();
        const left = r.left - navRect.left;
        const right = left + r.width;
        if (localX >= left && localX <= right) return i;
      }
      // Past either end → clamp to the nearest navigable tab.
      if (localX < 0) return firstNavigable;
      return lastNavigable;
    },
    [navItems],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Ignore right/middle mouse; only respond to primary pointer presses.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const s = pointerStateRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    if (!s.isDragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
        return;
      }
      // Axis lock: if the user is panning vertically, abandon — we don't want
      // to hijack page scroll by accident.
      if (Math.abs(dy) > Math.abs(dx)) {
        pointerStateRef.current = null;
        return;
      }
      s.isDragging = true;
      // Capture so the gesture survives if the finger drifts off the bar
      // (e.g. into the page area while still tracking horizontally).
      navRef.current?.setPointerCapture(e.pointerId);
    }

    const navEl = navRef.current;
    if (!navEl) return;
    const navRect = navEl.getBoundingClientRect();
    const localX = e.clientX - navRect.left;
    setDragX(localX);
    const idx = tabIndexAtX(localX);
    if (idx !== dragHoverIndex) {
      setDragHoverIndex(idx);
      // Tiny haptic when the indicator crosses into a new tab.
      haptic("selection");
    }
  };

  const finishPointerGesture = (
    e: React.PointerEvent<HTMLElement>,
    commit: boolean,
  ) => {
    const s = pointerStateRef.current;
    pointerStateRef.current = null;
    if (s?.pointerId === e.pointerId && navRef.current?.hasPointerCapture(e.pointerId)) {
      navRef.current.releasePointerCapture(e.pointerId);
    }
    const wasDragging = !!s?.isDragging;
    if (wasDragging && commit && dragHoverIndex !== null && dragHoverIndex >= 0) {
      const item = navItems[dragHoverIndex];
      // Suppress the synthetic click that follows a touch pointer-up so we
      // don't navigate twice (or navigate to the wrong item if the finger
      // released while over a different tab than the original press).
      suppressNextClickRef.current = true;
      // Clear the suppression after one frame — long enough for the click
      // event to fire and short enough that future taps aren't swallowed.
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
      if (item.action) {
        item.action();
      } else if (item.href && dragHoverIndex !== activeIndex) {
        router.push(item.href);
      }
    }
    setDragX(null);
    setDragHoverIndex(null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) =>
    finishPointerGesture(e, true);
  const handlePointerCancel = (e: React.PointerEvent<HTMLElement>) =>
    finishPointerGesture(e, false);

  // Effective indicator position: while dragging, follow the pointer
  // (clamped so the pill never escapes the nav frame); otherwise use the
  // measured position of the active tab.
  const effectiveIndicatorX = React.useMemo(() => {
    if (dragX === null) return indicatorX;
    const min = 0;
    const max = Math.max(0, navWidth - INDICATOR_WIDTH);
    return Math.min(max, Math.max(min, dragX - INDICATOR_WIDTH / 2));
  }, [dragX, indicatorX, navWidth]);

  const isDragging = dragX !== null;

  return (
    <motion.div
      className="fixed left-6 right-6 z-50 md:hidden"
      style={{
        // Pin above the home indicator / gesture bar. Using CSS vars keeps
        // `--bottom-nav-gap` (consumed by the guest signup banner) in sync.
        bottom: "var(--bottom-nav-offset)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        // Prevent the nav's own scroll attempts from bubbling to the body
        // (belt-and-braces with `overscroll-behavior` on the page container).
        touchAction: "manipulation",
      }}
      // Only animate in on first mount — not on every route change. This
      // avoids the pill popping in each time the user taps a tab.
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <nav
        ref={navRef}
        aria-label="Primary"
        // The pill widens with item count: the 4-item guest variant
        // caps at 360px so icons stay roomy; the 5-item authed variant
        // (Today/Progress/Coach/Friends/Settings) gets up to 420px so
        // labels don't crowd. Deriving from `navItems.length` keeps the
        // two variants from drifting if either gains or loses a tab.
        className="flex justify-around items-center mx-auto w-full relative"
        style={{
          maxWidth: navItems.length >= 5 ? 420 : 360,
          height: "var(--bottom-nav-height)",
          background: "var(--nav-bg)",
          borderRadius: "var(--nav-radius)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "var(--nav-shadow)",
          // `pan-y` lets the user keep scrolling the page vertically with a
          // gesture that starts on the nav, while we claim horizontal motion
          // for the scrub. `userSelect: none` prevents the long-press
          // text-selection hint that otherwise pops on iOS during a drag.
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <motion.div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            width: INDICATOR_WIDTH,
            height: INDICATOR_HEIGHT,
            top: "50%",
            left: 0,
            marginTop: -INDICATOR_HEIGHT / 2,
            borderRadius: "var(--nav-radius)",
            background: "var(--nav-indicator)",
          }}
          initial={false}
          animate={{
            x: effectiveIndicatorX,
            opacity: indicatorReady && activeIndex >= 0 ? 1 : 0,
            // Slightly bigger and snappier feedback while the user is
            // actively scrubbing, so the pill feels like it's grabbed.
            scale: isDragging ? 1.05 : 1,
          }}
          transition={
            isDragging
              ? { type: "tween", duration: 0.05, ease: "linear" }
              : { type: "spring", stiffness: 250, damping: 35 }
          }
        />
        {navItems.map(({ href, icon: Icon, label, action }, idx) => {
          // The actual route — used for `aria-current` so AT only ever reports
          // one tab as current, regardless of drag state.
          const isCurrentRoute = idx === activeIndex;
          // Visual state. Mirrors `isCurrentRoute` plus the drag-hover preview
          // so both tabs read as "active" while the indicator is mid-scrub.
          const isActive =
            isCurrentRoute || (isDragging && idx === dragHoverIndex);

          const inner = (
            <motion.div
              className="relative z-10 flex flex-col items-center gap-1"
              whileTap={{ scale: 0.92 }}
              // Lift the active icon slightly for clearer affordance.
              animate={{ y: isActive ? -1 : 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
              <Icon
                className="h-5 w-5 transition-colors"
                strokeWidth={isActive ? 2.5 : 2}
                style={{
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  transitionDuration: "var(--duration-normal)",
                }}
              />
              <span
                className="leading-none transition-colors text-[10px] tracking-wide"
                style={{
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  fontFamily: "var(--font-body)",
                  fontWeight: isActive ? 700 : 500,
                  transitionDuration: "var(--duration-normal)",
                }}
              >
                {label}
              </span>
            </motion.div>
          );

          // Icon-only SR fallback: the visible label already names the link,
          // but Link/button should have an explicit label for AT parity with
          // pending-request badges, etc.
          const commonClass =
            "flex flex-col items-center justify-center gap-1 relative flex-1 min-w-0 py-2 px-3 " +
            "rounded-[var(--nav-radius)] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0";

          const setTabRef = (el: HTMLElement | null) => {
            tabRefs.current[idx] = el;
          };

          if (action) {
            return (
              <button
                key={label}
                ref={setTabRef as React.Ref<HTMLButtonElement>}
                onClick={(e) => {
                  if (suppressNextClickRef.current) {
                    e.preventDefault();
                    return;
                  }
                  action();
                }}
                aria-label={label}
                className={commonClass}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={href}
              ref={setTabRef as React.Ref<HTMLAnchorElement>}
              href={href}
              aria-label={label}
              aria-current={isCurrentRoute ? "page" : undefined}
              className={commonClass}
              onClick={(e) => {
                // Drag already routed (or chose to no-op) — swallow the
                // synthetic click that follows pointer-up on touch devices.
                if (suppressNextClickRef.current) e.preventDefault();
              }}
            >
              {inner}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}
