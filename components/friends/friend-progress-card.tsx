"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { Check, MoreHorizontal, UserMinus, Ban } from "lucide-react";
import { toast } from "sonner";

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
    };
    todayComplete: boolean | null;
  };
}

export function FriendProgressCard({ friend }: FriendProgressCardProps) {
  const removeFriend = useMutation(api.friends.removeFriend);
  const blockUser = useMutation(api.friends.blockUser);
  const [confirmAction, setConfirmAction] = useState<"remove" | "block" | null>(null);

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
            <Avatar>
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
              <p className="text-sm text-muted-foreground">
                {friend.challenge.currentDay != null
                  ? `Day ${friend.challenge.currentDay} / 75`
                  : "Challenge in progress"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {friend.todayComplete && (
                <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-success" />
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setConfirmAction("remove")}>
                    <UserMinus className="mr-2 h-4 w-4" />
                    Remove Friend
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setConfirmAction("block")}
                    className="text-destructive focus:text-destructive"
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
              value={(friend.challenge.currentDay / 75) * 100}
              className="mt-3 h-2"
            />
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
