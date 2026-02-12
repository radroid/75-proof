"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Settings,
} from "lucide-react";

const navItems = [
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
    label: "Friends",
    href: "/dashboard/friends",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <motion.div
      className="fixed bottom-8 left-6 right-6 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <nav
        className="flex justify-around items-center h-[56px] mx-auto max-w-[360px]"
        style={{
          background: "var(--nav-bg)",
          borderRadius: "var(--nav-radius)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "var(--nav-shadow)",
        }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 relative flex-1 min-w-0 py-2 px-3"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 m-auto"
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
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
              >
                <Icon
                  className="h-5 w-5 transition-colors"
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
                    fontWeight: isActive ? 600 : 500,
                    transitionDuration: "var(--duration-normal)",
                  }}
                >
                  {label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}
