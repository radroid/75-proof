"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HandHeart, X } from "lucide-react";

export function IncomingNudges() {
  const nudges = useQuery(api.nudges.getIncomingNudges);
  const markSeen = useMutation(api.nudges.markIncomingNudgesSeen);
  const [dismissing, setDismissing] = useState(false);

  if (!nudges || nudges.length === 0) return null;

  const unique = Array.from(
    new Map(nudges.map((n) => [String(n.from._id), n])).values()
  );
  const preview = unique.slice(0, 3);
  const extra = unique.length - preview.length;

  const names = preview.map((n) => n.from.displayName).join(", ");
  const label =
    unique.length === 1
      ? `${names} nudged you`
      : extra > 0
      ? `${names} +${extra} nudged you`
      : `${names} nudged you`;

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await markSeen({});
    } catch {
      setDismissing(false);
    }
  };

  return (
    <Card
      className={[
        "border-primary/30 bg-primary/5 transition-opacity duration-200",
        dismissing ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <HandHeart className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="flex -space-x-2 shrink-0">
            {preview.map((n) => (
              <Avatar key={n._id} className="h-7 w-7 border-2 border-background">
                <AvatarImage
                  src={n.from.avatarUrl}
                  alt={n.from.displayName}
                />
                <AvatarFallback className="text-[10px]">
                  {n.from.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <p className="text-sm flex-1 min-w-0">
            <span className="font-medium break-words">{label}</span>
            <span className="text-muted-foreground"> — keep going!</span>
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            disabled={dismissing}
            aria-label="Dismiss nudges"
            className="h-9 w-9 shrink-0 -mr-1"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
