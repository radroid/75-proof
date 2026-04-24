"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { X, Flame, Calendar, Image as ImageIcon, Droplet, Users } from "lucide-react";
import posthog from "posthog-js";

type TourStep = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

const STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: Flame,
    title: "Welcome to your dashboard",
    body: "This is where you track every task, every day of your challenge. Tap any item to mark it complete.",
  },
  {
    id: "checklist",
    icon: Calendar,
    title: "The Daily Six",
    body: "Two workouts, water, reading, diet, and a progress photo. Hit all of them to close the day.",
  },
  {
    id: "photo",
    icon: ImageIcon,
    title: "Progress photo",
    body: "One photo a day. The Progress page stitches them into a timeline so you can see the change.",
  },
  {
    id: "water",
    icon: Droplet,
    title: "Water tracker",
    body: "Tap each glass as you drink. Eight glasses equals a gallon — auto-completes when you hit the target.",
  },
  {
    id: "social",
    icon: Users,
    title: "Bring friends",
    body: "Add friends to share the grind. See their streaks in the Friends tab.",
  },
];

interface DashboardTourProps {
  enabled: boolean;
}

export function DashboardTour({ enabled }: DashboardTourProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const markSeen = useMutation(api.users.markTutorialSeen);

  useEffect(() => {
    if (enabled) {
      setOpen(true);
      posthog.capture("tour_started");
    }
  }, [enabled]);

  useEffect(() => {
    if (open) {
      const step = STEPS[stepIndex];
      posthog.capture("tour_step_viewed", { step_id: step.id, step_index: stepIndex });
    }
  }, [open, stepIndex]);

  const finish = async (reason: "completed" | "skipped") => {
    setOpen(false);
    posthog.capture(reason === "completed" ? "tour_completed" : "tour_skipped", {
      last_step_id: STEPS[stepIndex].id,
      last_step_index: stepIndex,
    });
    try {
      await markSeen();
    } catch {
      // non-fatal
    }
  };

  const next = () => {
    if (stepIndex >= STEPS.length - 1) {
      finish("completed");
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  if (!open) return null;

  const step = STEPS[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="w-full max-w-md bg-background rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex gap-1.5" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? "w-6 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => finish("skipped")}
            aria-label="Skip tour"
            className="text-muted-foreground hover:text-foreground transition-colors min-h-11 min-w-11 inline-flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-6 pb-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Icon className="h-6 w-6" />
          </div>
          <h2 id="tour-title" className="text-xl font-semibold mb-2">
            {step.title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          {stepIndex > 0 && (
            <Button
              variant="outline"
              onClick={() => setStepIndex((i) => i - 1)}
              className="flex-1 min-h-11"
            >
              Back
            </Button>
          )}
          <Button onClick={next} className="flex-1 min-h-11">
            {isLast ? "Let's go" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
