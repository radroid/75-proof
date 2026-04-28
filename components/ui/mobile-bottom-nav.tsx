"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type IconProps = { className?: string; strokeWidth?: number; style?: React.CSSProperties };

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard | React.ComponentType<IconProps>;
  action?: () => void;
};

function FriendsMobileIcon(props: IconProps) {
  const count = useQuery(api.friends.getPendingRequestCount);
  return (
    <span className="relative inline-flex">
      <Users {...props} />
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

// Authed mobile nav. Coach lives here too so the AI surface is reachable
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
    icon: TrendingUp,
  },
  {
    label: "Coach",
    href: "/dashboard/coach",
    icon: Sparkles,
  },
  {
    label: "Friends",
    href: "/dashboard/friends",
    icon: FriendsMobileIcon,
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
        aria-label="Primary"
        // The pill widens with item count: the 4-item guest variant
        // caps at 360px so icons stay roomy; the 5-item authed variant
        // (Today/Progress/Coach/Friends/Settings) gets up to 420px so
        // labels don't crowd. Deriving from `navItems.length` keeps the
        // two variants from drifting if either gains or loses a tab.
        className="flex justify-around items-center mx-auto w-full"
        style={{
          maxWidth: navItems.length >= 5 ? 420 : 360,
          height: "var(--bottom-nav-height)",
          background: "var(--nav-bg)",
          borderRadius: "var(--nav-radius)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "var(--nav-shadow)",
        }}
      >
        {navItems.map(({ href, icon: Icon, label, action }) => {
          const isActive = !action && (href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href));

          const inner = (
            <>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 m-auto"
                  aria-hidden="true"
                  style={{
                    width: 68,
                    height: 46,
                    borderRadius: "var(--nav-radius)",
                    background: "var(--nav-indicator)",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 250,
                    damping: 35,
                  }}
                />
              )}
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
            </>
          );

          // Icon-only SR fallback: the visible label already names the link,
          // but Link/button should have an explicit label for AT parity with
          // pending-request badges, etc.
          const commonClass =
            "flex flex-col items-center justify-center gap-1 relative flex-1 min-w-0 py-2 px-3 " +
            "rounded-[var(--nav-radius)] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0";

          if (action) {
            return (
              <button
                key={label}
                onClick={action}
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
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={commonClass}
            >
              {inner}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}
