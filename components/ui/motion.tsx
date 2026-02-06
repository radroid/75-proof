"use client";

import * as React from "react";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// Animation variants
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

// Hover lift animation preset
export const hoverLift = {
  whileHover: { y: -2 },
  transition: { type: "spring", stiffness: 400, damping: 25 },
};

// Press scale animation preset
export const pressScale = {
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 25 },
};

// Motion Page - Stagger container for page entrance
interface MotionPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function MotionPage({ children, className, ...props }: MotionPageProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Motion Item - Fade-up animation for children
interface MotionItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function MotionItem({ children, className, ...props }: MotionItemProps) {
  return (
    <motion.div variants={fadeUp} className={className} {...props}>
      {children}
    </motion.div>
  );
}

// Motion Card - Card with hover lift
interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  enableHover?: boolean;
}

export function MotionCard({
  children,
  className,
  enableHover = true,
  ...props
}: MotionCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={enableHover ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "transition-shadow duration-200",
        enableHover && "hover:shadow-[var(--shadow-card-hover)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Motion Grid - Grid with staggered children
interface MotionGridProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function MotionGrid({ children, className, ...props }: MotionGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainerFast}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Motion List - Staggered list items
interface MotionListProps extends HTMLMotionProps<"ul"> {
  children: React.ReactNode;
  className?: string;
}

export function MotionList({
  children,
  className,
  ...props
}: MotionListProps) {
  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.ul>
  );
}

// Motion List Item
interface MotionListItemProps extends HTMLMotionProps<"li"> {
  children: React.ReactNode;
  className?: string;
}

export function MotionListItem({
  children,
  className,
  ...props
}: MotionListItemProps) {
  return (
    <motion.li variants={fadeUp} className={className} {...props}>
      {children}
    </motion.li>
  );
}

// Motion Scale - Scale in animation
interface MotionScaleProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function MotionScale({
  children,
  className,
  ...props
}: MotionScaleProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Motion Presence wrapper for exit animations
export { AnimatePresence } from "framer-motion";
