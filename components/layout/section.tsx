"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/components/ui/motion";

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function Section({
  children,
  title,
  description,
  action,
  className,
}: SectionProps) {
  return (
    <motion.section variants={fadeUp} className={cn("mt-8", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px bg-gradient-to-r from-transparent via-border to-transparent", className)}
    />
  );
}
