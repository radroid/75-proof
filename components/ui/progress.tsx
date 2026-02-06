"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  variant?: "default" | "gradient" | "success";
  showGlow?: boolean;
}

function Progress({
  className,
  value,
  variant = "default",
  showGlow = false,
  ...props
}: ProgressProps) {
  const isNearComplete = (value ?? 0) >= 90;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <motion.div
        data-slot="progress-indicator"
        className={cn(
          "h-full rounded-full",
          variant === "default" && "bg-primary",
          variant === "gradient" && "bg-[var(--gradient-primary)]",
          variant === "success" && "bg-success",
          showGlow && isNearComplete && "shadow-[0_0_8px_var(--primary)]"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${value ?? 0}%` }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          mass: 0.5,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
