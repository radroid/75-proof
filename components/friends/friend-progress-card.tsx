"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, MoreHorizontal, UserMinus, Ban, HandHeart } from "lucide-react";
import { CoStreakChip } from "./co-streak-chip";
import { FriendHabitsStrip, type FriendHabit } from "./friend-habits-strip";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";

interface FriendProgressCardProps {
  friend: {
    user: {
      _id: Id<"users">;
      displayName: string;
      avatarUrl?: string;
    };
    challenge: {
      currentDay: number | null;
      startDate: string;
      daysTotal?: number;
      isHabitTracker?: boolean;
    };
    todayComplete: boolean | null;
    coStreak?: number;
    habits?: FriendHabit[] | null;
  };
}

export function FriendProgressCard({ friend }: FriendProgressCardProps) {
  const removeFriend = useMutation(api.friends.removeFriend);
  const blockUser = useMutation(api.friends.blockUser);
  const sendNudge = useMutation(api.nudges.sendNudge);
  const nudgedIds = useQuery(api.nudges.getRecentNudgedFriendIds);
  const [confirmAction, setConfirmAction] = useState<"remove" | "block" | null>(null);
  const [nudging, setNudging] = useState(false);
  const [justNudged, setJustNudged] = useState(false);

  const alreadyNudged = nudgedIds?.includes(String(friend.user._id)) ?? false;

  const handleNudge = async () => {
    if (alreadyNudged || nudging) return;
    haptic("impact");
    setNudging(true);
    try {
      await sendNudge({ toUserId: friend.user._id });
      setJustNudged(true);
      window.setTimeout(() => setJustNudged(false), 400);
      toast.success(`Nudged ${friend.user.displayName} 👋`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send nudge";
      toast.error(msg);
    }
    setNudging(false);
  };

  const handleRemove = async () => {
    try {
      await removeFriend({ friendId: friend.user._id });
      toast.success("Friend removed");
    } catch {
      toast.error("Failed to remove friend");
    }
    setConfirmAction(null);
  };

  const handleBlock = async () => {
    try {
      await blockUser({ targetUserId: friend.user._id });
      toast.success("User blocked");
    } catch {
      toast.error("Failed to block user");
    }
    setConfirmAction(null);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Avatar className="shrink-0">
              <AvatarImage
                src={friend.user.avatarUrl}
                alt={friend.user.displayName}
              />
              <AvatarFallback>
                {friend.user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{friend.user.displayName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {friend.challenge.currentDay != null
                  ? friend.challenge.isHabitTracker
                    ? `Day ${friend.challenge.currentDay} · habit tracker`
                    : `Day ${friend.challenge.currentDay} / ${friend.challenge.daysTotal ?? 75}`
                  : "Challenge in progress"}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {friend.todayComplete && (
                <div
                  className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center"
                  aria-label="Today complete"
                  title="Today complete"
                >
                  <Check className="h-4 w-4 text-success" />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNudge}
                disabled={alreadyNudged || nudging}
                aria-label={
                  alreadyNudged
                    ? `Already nudged ${friend.user.displayName}`
                    : `Nudge ${friend.user.displayName}`
                }
                title={
                  alreadyNudged
                    ? "Already nudged today"
                    : `Nudge ${friend.user.displayName}`
                }
                className="h-11 w-11 transition-transform duration-200 touch-manipulation active:scale-95 disabled:active:scale-100"
                data-just-nudged={justNudged ? "true" : undefined}
              >
                <HandHeart
                  className={[
                    "h-4 w-4 transition-transform duration-200",
                    alreadyNudged ? "text-primary" : "text-muted-foreground",
                    justNudged ? "scale-125" : "",
                  ].join(" ")}
                />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 -mr-2"
                    aria-label={`More options for ${friend.user.displayName}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  <DropdownMenuItem
                    onClick={() => setConfirmAction("remove")}
                    className="py-2.5"
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Remove Friend
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setConfirmAction("block")}
                    className="text-destructive focus:text-destructive py-2.5"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {friend.challenge.currentDay != null && (
            <Progress
              value={
                friend.challenge.isHabitTracker
                  ? 100
                  : (friend.challenge.currentDay /
                      (friend.challenge.daysTotal ?? 75)) *
                    100
              }
              className="mt-3 h-2"
            />
          )}
          {(friend.coStreak ?? 0) >= 2 && (
            <CoStreakChip
              days={friend.coStreak ?? 0}
              friendName={friend.user.displayName}
            />
          )}
          {friend.habits && friend.habits.length > 0 && (
            <FriendHabitsStrip habits={friend.habits} />
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "remove"
                ? "Remove Friend"
                : "Block User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "remove"
                ? `Are you sure you want to remove ${friend.user.displayName} as a friend? You can send a new request later.`
                : `Are you sure you want to block ${friend.user.displayName}? They won't be able to see your progress or send you requests.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction === "remove" ? handleRemove : handleBlock}
              className={
                confirmAction === "block"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {confirmAction === "remove" ? "Remove" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
