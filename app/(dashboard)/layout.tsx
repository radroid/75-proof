"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Users,
  Settings,
  Dumbbell,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  {
    label: "Today",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: "Progress",
    href: "/dashboard/progress",
    icon: <TrendingUp className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: "History",
    href: "/dashboard/history",
    icon: <Calendar className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: "Friends",
    href: "/dashboard/friends",
    icon: <Users className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <RedirectToHome />
      </Unauthenticated>

      <Authenticated>
        <div
          className={cn(
            "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-900 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
            "min-h-screen"
          )}
        >
          <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                {open ? <Logo /> : <LogoIcon />}
                <div className="mt-8 flex flex-col gap-2">
                  {navItems.map((link, idx) => (
                    <SidebarLink key={idx} link={link} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
                <ThemeToggle />
              </div>
            </SidebarBody>
          </Sidebar>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 min-h-full">
              {children}
            </div>
          </main>
        </div>
      </Authenticated>
    </>
  );
}

const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-6 w-6 bg-emerald-500 dark:bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
        <Dumbbell className="h-4 w-4 text-white" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-semibold text-black dark:text-white whitespace-pre"
      >
        SeventyFive
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-6 w-6 bg-emerald-500 dark:bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
        <Dumbbell className="h-4 w-4 text-white" />
      </div>
    </Link>
  );
};
