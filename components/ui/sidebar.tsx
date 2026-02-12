"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, createContext, useContext, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_STORAGE_KEY = "75hard-sidebar-open";
const SIDEBAR_EXPANDED_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 60;

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: () => void;
  mounted: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setOpen(stored === "true");
    }
    setMounted(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
    }
  }, [open, mounted]);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Cmd+B / Ctrl+B keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle, mounted }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <>{children}</>;
};

export const SidebarBody = (props: React.ComponentProps<"div">) => {
  return (
    <TooltipProvider delayDuration={200}>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </TooltipProvider>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, mounted } = useSidebar();

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-screen px-3 py-3 hidden md:flex md:flex-col bg-sidebar flex-shrink-0 border-r border-sidebar-border z-30",
        "transition-[width] duration-200 ease-in-out",
        className
      )}
      style={{
        width: mounted ? (open ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH) : SIDEBAR_EXPANDED_WIDTH,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const MobileSidebar = ({
  children,
}: React.ComponentProps<"div">) => {
  // Mobile sidebar is replaced by MobileBottomNav in the dashboard layout.
  // This component now only renders children on desktop (handled by SidebarBody).
  return null;
};

export const SidebarToggleButton = () => {
  const { open, toggle, mounted } = useSidebar();
  const isCollapsed = mounted && !open;
  const label = open ? "Collapse sidebar" : "Expand sidebar";

  const button = (
    <button
      onClick={toggle}
      className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer text-sidebar-foreground/60 hover:text-sidebar-foreground"
      aria-label={label}
    >
      {open ? (
        <PanelLeftClose className="h-5 w-5" />
      ) : (
        <PanelLeft className="h-5 w-5" />
      )}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label} <kbd className="ml-1 text-[10px] opacity-60">⌘B</kbd>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open, mounted } = useSidebar();
  const pathname = usePathname();
  const isActive = pathname === link.href;
  const isCollapsed = mounted && !open;

  const linkContent = (
    <Link
      href={link.href}
      className={cn(
        "relative flex items-center group/sidebar rounded-lg transition-all duration-200 cursor-pointer",
        isCollapsed
          ? "w-10 h-10 justify-center mx-auto"
          : "justify-start gap-2 px-2 py-2.5",
        isActive
          ? "bg-sidebar-primary/10 text-sidebar-primary font-semibold"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        className
      )}
      {...props}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className={cn(
            "absolute bg-sidebar-primary rounded-full",
            isCollapsed
              ? "bottom-0 left-1/2 -translate-x-1/2 h-1 w-5"
              : "left-0 top-1/2 -translate-y-1/2 w-[3px] h-6"
          )}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <div
        className={cn(
          "flex items-center justify-center flex-shrink-0",
          isActive && "text-sidebar-primary"
        )}
      >
        {link.icon}
      </div>

      {!isCollapsed && (
        <span className="text-sm whitespace-pre">
          {link.label}
        </span>
      )}
    </Link>
  );

  // Show tooltip only when collapsed
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {link.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
};
