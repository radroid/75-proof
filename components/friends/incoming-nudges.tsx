"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { HandHeart } from "lucide-react";

export function IncomingNudges() {
  const nudges = useQuery(api.nudges.getIncomingNudges);

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

  return (
    <Card className="border-primary/30 bg-primary/5">
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
        </div>
      </CardContent>
    </Card>
  );
}
