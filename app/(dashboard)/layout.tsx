"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarToggleButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Users,
  Settings,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  {
    label: "Today",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Progress",
    href: "/dashboard/progress",
    icon: <TrendingUp className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "History",
    href: "/dashboard/history",
    icon: <Calendar className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Friends",
    href: "/dashboard/friends",
    icon: <Users className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5 flex-shrink-0" />,
  },
];

function RedirectToHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
}

function SidebarHeader() {
  const { open, mounted } = useSidebar();
  const isCollapsed = mounted && !open;

  if (isCollapsed) {
    return (
      <div className="flex justify-center py-1">
        <Link
          href="/dashboard"
          className="flex items-center justify-center"
        >
          <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Dumbbell className="h-4 w-4 text-primary-foreground" />
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Link
        href="/dashboard"
        className="font-normal flex items-center space-x-2 text-sm py-1 relative z-20"
      >
        <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <Dumbbell className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground whitespace-pre text-base">
          75 Proof
        </span>
      </Link>
    </div>
  );
}

function SidebarFooter() {
  const { open, mounted } = useSidebar();
  const isCollapsed = mounted && !open;

  return (
    <div className="flex flex-col gap-3">
      {/* Account */}
      <div className={cn(
        "flex items-center gap-3",
        isCollapsed ? "justify-center" : "px-2"
      )}>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
        {!isCollapsed && (
          <span className="text-sm text-sidebar-foreground">
            Account
          </span>
        )}
      </div>

      {/* Toggle — always at the bottom, visually separated */}
      <div className={cn(
        "border-t border-sidebar-border pt-3",
        isCollapsed ? "flex justify-center" : "flex justify-end px-2"
      )}>
        <SidebarToggleButton />
      </div>
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
            "flex flex-col md:flex-row bg-background w-full flex-1 mx-auto overflow-hidden",
            "min-h-screen"
          )}
        >
          <Sidebar>
            <SidebarBody className="justify-between gap-4">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <SidebarHeader />
                <div className="mt-6 flex flex-col gap-1">
                  {navItems.map((link, idx) => (
                    <SidebarLink key={idx} link={link} />
                  ))}
                </div>
              </div>
              <SidebarFooter />
            </SidebarBody>
          </Sidebar>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8 bg-background min-h-full">
              {children}
            </div>
          </main>
        </div>
      </Authenticated>
    </>
  );
}
