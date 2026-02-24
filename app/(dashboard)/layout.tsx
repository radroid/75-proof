"use client";

import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarToggleButton,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { GuestSignupBanner } from "@/components/guest-signup-banner";
import { useGuest } from "@/components/guest-provider";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Settings,
  Dumbbell,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sharedUserProfileProps, userButtonPopoverElements } from "@/lib/clerk-appearance";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function FriendsNavIcon() {
  const count = useQuery(api.friends.getPendingRequestCount);
  return (
    <span className="relative flex-shrink-0" aria-label={count ? `Friends, ${count} pending requests` : "Friends"}>
      <Users className="h-5 w-5" />
      {(count ?? 0) > 0 && (
        <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground leading-none">
          {count! > 9 ? "9+" : count}
        </span>
      )}
    </span>
  );
}

const staticNavItems = [
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
];

const guestNavItems = staticNavItems;

// Mobile nav items for guests — built inside component to include signup action

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

function AuthenticatedSidebarFooter() {
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

      <div className={cn(
        "flex items-center gap-3",
        isCollapsed ? "justify-center" : "px-2"
      )}>
        <UserButton
          userProfileProps={sharedUserProfileProps}
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
              ...userButtonPopoverElements,
            },
          }}
        />
        {!isCollapsed && (
          <span className="text-sm text-sidebar-foreground">
            Account
          </span>
        )}
      </div>

      <div className={cn(
        "border-t border-sidebar-border pt-3",
        isCollapsed ? "flex justify-center" : "flex justify-end px-2"
      )}>
        <SidebarToggleButton />
      </div>
    </div>
  );
}

function GuestSidebarFooter() {
  const { open, mounted } = useSidebar();
  const isCollapsed = mounted && !open;
  const { promptSignup } = useGuest();

  return (
    <div className="flex flex-col gap-3">
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={promptSignup}
              className="w-10 h-10 flex items-center justify-center mx-auto rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Sign Up Free
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button onClick={promptSignup} size="sm" className="mx-2">
          <LogIn className="h-4 w-4 mr-2" />
          Sign Up Free
        </Button>
      )}

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
  const { isLoaded } = useAuth();
  const { isGuest, promptSignup } = useGuest();

  const guestMobileItems = [
    { label: "Today", href: "/dashboard", icon: LayoutDashboard },
    { label: "Progress", href: "/dashboard/progress", icon: TrendingUp },
    { label: "Sign Up", href: "#", icon: LogIn, action: promptSignup },
  ];

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  const allNavItems = [
    ...staticNavItems,
    {
      label: "Friends",
      href: "/dashboard/friends",
      icon: <FriendsNavIcon />,
    },
  ];

  const navItems = isGuest ? guestNavItems : allNavItems;

  return (
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
            {isGuest ? <GuestSidebarFooter /> : <AuthenticatedSidebarFooter />}
          </SidebarBody>
        </Sidebar>

        <SidebarSpacer />

        <main className="flex-1 overflow-auto scrollbar-gutter-stable">
          <div className="p-4 pb-24 md:p-8 md:pb-8 bg-background min-h-full">
            {children}
          </div>
        </main>

        <MobileBottomNav items={isGuest ? guestMobileItems : undefined} />

        {isGuest && <GuestSignupBanner />}
      </div>
    </SidebarProvider>
  );
}
