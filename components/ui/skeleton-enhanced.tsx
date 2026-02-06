import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        shimmer && "animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function StatSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 p-8",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 bg-primary/20" />
          <Skeleton className="h-12 w-32 bg-primary/20" />
          <Skeleton className="h-3 w-28 bg-primary/20" />
        </div>
        <Skeleton className="h-28 w-28 rounded-full bg-primary/20" />
      </div>
    </div>
  );
}

function ChecklistSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export {
  Skeleton,
  CardSkeleton,
  StatSkeleton,
  HeroSkeleton,
  ChecklistSkeleton,
};
