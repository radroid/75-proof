"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Today", icon: "📋" },
  { href: "/dashboard/progress", label: "Progress", icon: "📈" },
  { href: "/dashboard/history", label: "History", icon: "📅" },
  { href: "/dashboard/friends", label: "Friends", icon: "👥" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

function RedirectToHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-zinc-500">Redirecting...</div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse text-zinc-500">Loading...</div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <RedirectToHome />
      </Unauthenticated>

      <Authenticated>
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <span className="text-2xl">💪</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    75 HARD
                  </span>
                </Link>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </nav>

              {/* User section */}
              <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                      },
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate dark:text-zinc-50">
                      My Account
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="ml-64 flex-1 p-8">{children}</main>
        </div>
      </Authenticated>
    </>
  );
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
      }`}
    >
      <span>{icon}</span>
      {label}
    </Link>
  );
}
