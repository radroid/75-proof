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
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Settings,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    label: "Friends",
    href: "/dashboard/friends",
    icon: <Users className="h-5 w-5 flex-shrink-0" />,
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

  const settingsLink = (
    <Link
      href="/dashboard/settings"
      className={cn(
        "flex items-center rounded-lg transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        isCollapsed
          ? "w-10 h-10 justify-center mx-auto"
          : "gap-2 px-2 py-2.5"
      )}
    >
      <Settings className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && (
        <span className="text-sm">Settings</span>
      )}
    </Link>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Settings link */}
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {settingsLink}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Settings
          </TooltipContent>
        </Tooltip>
      ) : (
        settingsLink
      )}

      {/* Account */}
      <div className={cn(
        "flex items-center gap-3",
        isCollapsed ? "justify-center" : "px-2"
      )}>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
              userButtonPopoverCard: "!bg-[var(--card)] !border-[var(--border)]",
              userButtonPopoverActionButton: "!text-[var(--foreground)]",
              userButtonPopoverActionButtonText: "!text-[var(--foreground)]",
              userButtonPopoverActionButtonIcon: "!text-[var(--muted-foreground)]",
              userButtonPopoverFooter: "!hidden",
            },
            variables: {
              colorPrimary: "var(--primary)",
              colorBackground: "var(--card)",
              colorText: "var(--foreground)",
              colorTextSecondary: "var(--muted-foreground)",
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

const SIDEBAR_EXPANDED_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 60;

function SidebarSpacer() {
  const { open, mounted } = useSidebar();
  return (
    <div
      className="hidden md:block flex-shrink-0 transition-[width] duration-200 ease-in-out"
      style={{
        width: mounted ? (open ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH) : SIDEBAR_EXPANDED_WIDTH,
      }}
    />
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
        <SidebarProvider>
          <div
            className={cn(
              "flex flex-col md:flex-row bg-background w-full flex-1 mx-auto",
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

            <SidebarSpacer />

            {/* Main content */}
            <main className="flex-1 overflow-auto scrollbar-gutter-stable">
              <div className="p-4 pb-24 md:p-8 md:pb-8 bg-background min-h-full">
                {children}
              </div>
            </main>

            {/* Mobile bottom tab bar */}
            <MobileBottomNav />
          </div>
        </SidebarProvider>
      </Authenticated>
    </>
  );
}
