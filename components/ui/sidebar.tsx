"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, createContext, useContext, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, PanelLeft, PanelLeftClose } from "lucide-react";
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
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  );
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
        "sticky top-0 h-screen px-3 py-3 hidden md:flex md:flex-col bg-sidebar flex-shrink-0 border-r border-sidebar-border",
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
  className,
  children,
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="h-14 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-sidebar border-b border-sidebar-border w-full"
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
        >
          <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>
          </div>
          <span className="font-bold text-foreground text-base">75 Proof</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <Menu className="h-5 w-5 text-sidebar-foreground" />
        </button>
      </div>

      {/* Mobile overlay panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[99] md:hidden"
              onClick={() => setOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
              className={cn(
                "fixed top-0 left-0 h-full w-[80vw] max-w-[320px] bg-sidebar p-6 z-[100] flex flex-col justify-between md:hidden",
                className
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>
                  </div>
                  <span className="font-bold text-foreground text-base">75 Proof</span>
                </Link>
                <button
                  className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5 text-sidebar-foreground" />
                </button>
              </div>
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarToggleButton = () => {
  const { open, toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
      title={open ? "Collapse sidebar (⌘B)" : "Expand sidebar (⌘B)"}
    >
      {open ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <PanelLeft className="h-4 w-4" />
      )}
    </button>
  );
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
        "relative flex items-center group/sidebar rounded-lg transition-all duration-200",
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
