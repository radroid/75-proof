"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StartChallengeModal } from "@/components/StartChallengeModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { HeroSkeleton, ChecklistSkeleton } from "@/components/ui/skeleton-enhanced";
import { MotionItem } from "@/components/ui/motion";
import { Rocket } from "lucide-react";
import { useThemePersonality } from "@/components/theme-provider";
import { useGuest } from "@/components/guest-provider";

// Themed dashboard components
import { ArcticDashboard } from "@/components/themes/arctic-dashboard";
import { BroadsheetDashboard } from "@/components/themes/broadsheet-dashboard";
import { MilitaryDashboard } from "@/components/themes/military-dashboard";
import { ZenDashboard } from "@/components/themes/zen-dashboard";

import type { ThemePersonality } from "@/lib/themes";

const dashboardComponents: Record<ThemePersonality, React.ComponentType<{ user: any; challenge: any }>> = {
  arctic: ArcticDashboard,
  broadsheet: BroadsheetDashboard,
  military: MilitaryDashboard,
  zen: ZenDashboard,
};

export default function DashboardPage() {
  const { isGuest, demoUser, demoChallenge } = useGuest();
  const { personality } = useThemePersonality();

  // Guest experience — render themed dashboard with demo data
  if (isGuest) {
    const ThemedDashboard = dashboardComponents[personality];
    return <ThemedDashboard user={demoUser} challenge={demoChallenge} />;
  }

  return <AuthenticatedDashboard />;
}

function AuthenticatedDashboard() {
  const user = useQuery(api.users.getCurrentUser);
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (user === null && !isCreatingUser) {
      setIsCreatingUser(true);
      createOrGetUser().finally(() => setIsCreatingUser(false));
    }
  }, [user, createOrGetUser, isCreatingUser]);

  if (user === undefined || user === null || isCreatingUser) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <div className="h-9 w-64 rounded-md bg-muted animate-pulse" />
          <div className="h-5 w-96 mt-2 rounded-md bg-muted animate-pulse" />
        </div>
        <HeroSkeleton />
        <ChecklistSkeleton />
      </div>
    );
  }

  return user?.currentChallengeId ? (
    <ActiveChallenge userId={user._id} challengeId={user.currentChallengeId} user={user} />
  ) : (
    <NoActiveChallenge />
  );
}

function ActiveChallenge({
  userId,
  challengeId,
  user,
}: {
  userId: string;
  challengeId: string;
  user: any;
}) {
  const challenge = useQuery(api.challenges.getChallenge, {
    challengeId: challengeId as any,
  });
  const { personality } = useThemePersonality();

  if (!challenge) {
    return (
      <div className="space-y-6">
        <HeroSkeleton />
        <ChecklistSkeleton />
      </div>
    );
  }

  const ThemedDashboard = dashboardComponents[personality];

  return <ThemedDashboard user={user} challenge={challenge} />;
}

function NoActiveChallenge() {
  const [showModal, setShowModal] = useState(false);

  return (
    <PageContainer>
      <MotionItem>
        <Card variant="bordered" className="border-2 border-dashed border-primary/30">
          <CardContent className="pt-12 pb-12 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
            >
              <Rocket className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold">Ready to Transform?</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Begin your 75 HARD journey today. Track your workouts, water intake,
              reading, and build unbreakable mental toughness.
            </p>
            <Button
              onClick={() => setShowModal(true)}
              size="xl"
              variant="gradient"
              className="mt-8"
            >
              Start 75 HARD Challenge
            </Button>
          </CardContent>
        </Card>
      </MotionItem>

      <StartChallengeModal open={showModal} onOpenChange={setShowModal} />
    </PageContainer>
  );
}
