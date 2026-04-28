"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Brain, Download, History, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

const ACTION_LABELS: Record<string, string> = {
  memory_write: "Memory updated",
  memory_purge_manual: "Memory purged",
  memory_purge_ttl: "TTL purge",
  memory_settings_changed: "Settings changed",
  thread_create: "Thread created",
  thread_delete: "Thread deleted",
  forget_me: "Forget me",
  export: "Bundle exported",
};

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/**
 * Coach memory + threads + export controls. Gated by `enabled`: when
 * memory is off (the default for new users), only the toggle and the
 * forget-me + export buttons render.
 */
export function CoachPrivacySettings() {
  const memory = useQuery(api.coach.getMemory, {});
  const audit = useQuery(api.coach.listAuditLog, { limit: 20 });
  const updateSettings = useMutation(api.coach.updateMemorySettings);
  const forgetMe = useMutation(api.coach.forgetMe);

  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const expiresLabel = useMemo(() => {
    if (!memory?.updatedAt || memory.ttlOptOut) return null;
    const expires = memory.updatedAt + memory.ttlDays * 24 * 60 * 60 * 1000;
    return new Date(expires).toLocaleDateString();
  }, [memory]);

  const handleToggle = async (next: boolean) => {
    setBusy(true);
    try {
      await updateSettings({ enabled: next });
      toast.success(next ? "Coach memory enabled" : "Coach memory disabled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  const handleTtlOptOut = async (next: boolean) => {
    setBusy(true);
    try {
      await updateSettings({ ttlOptOut: next });
      toast.success(next ? "TTL purges paused" : "TTL purges enabled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  const handleForget = async () => {
    setBusy(true);
    try {
      await forgetMe({});
      toast.success("Memory and threads cleared");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/coach/export");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `75proof-coach-context-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Coach context downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const enabled = memory?.enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Coach memory & history</CardTitle>
        </div>
        <CardDescription>
          The AI coach can remember durable facts about you across sessions.
          Off by default — you control what's stored, when it expires, and you
          can wipe it any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="coach-memory-enabled" className="text-sm font-medium">
              Remember me across sessions
            </Label>
            <p className="text-xs text-muted-foreground">
              Stores up to ~2KB of distilled facts (goals, schedule, what's worked).
              Display name, email, and other identifiers are excluded.
            </p>
          </div>
          <Switch
            id="coach-memory-enabled"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={busy || memory === undefined}
          />
        </div>

        {enabled && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="coach-memory-ttl-optout" className="text-sm font-medium">
                  Pause auto-expiry
                </Label>
                <p className="text-xs text-muted-foreground">
                  Memory and threads default to a {memory?.ttlDays ?? 90}-day TTL.
                  Pause to keep them indefinitely.
                  {expiresLabel && !memory?.ttlOptOut
                    ? ` Currently scheduled to purge on ${expiresLabel}.`
                    : ""}
                </p>
              </div>
              <Switch
                id="coach-memory-ttl-optout"
                checked={memory?.ttlOptOut ?? false}
                onCheckedChange={handleTtlOptOut}
                disabled={busy}
              />
            </div>

            {memory && memory.facts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Currently remembered</p>
                <ul className="rounded-md border bg-muted/30 p-3 space-y-1.5 text-xs">
                  {memory.facts.map((fact, i) => (
                    <li key={i} className="leading-snug">
                      • {fact}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No facts stored yet — chat with the coach to build memory.
              </p>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-1.5">Download my coach data</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={busy}>
                <Trash2 className="h-4 w-4" />
                <span className="ml-1.5">Forget me</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wipe coach memory and threads?</AlertDialogTitle>
                <AlertDialogDescription>
                  Clears every stored fact and deletes every saved coach
                  conversation. The audit log of these actions stays so you
                  can verify the wipe happened. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleForget}>
                  Yes, forget me
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {audit && audit.length > 0 && (
          <details className="pt-2">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Recent activity ({audit.length})
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground border-l pl-3">
              {audit.map((a) => (
                <li key={a._id}>
                  <span className="font-medium text-foreground">
                    {ACTION_LABELS[a.action] ?? a.action}
                  </span>{" "}
                  · {formatRelative(a.createdAt)}
                  {a.detail ? <span className="opacity-70"> — {a.detail}</span> : null}
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
