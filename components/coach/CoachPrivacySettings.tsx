"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Brain, Download, History, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { MEMORY_BIO_CHAR_CAP } from "@/convex/lib/coachConstants";

const ACTION_LABELS: Record<string, string> = {
  memory_write: "Memory updated",
  memory_edit_manual: "Bio edited",
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
  const updateBio = useMutation(api.coach.updateBio);

  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Seed the draft only on the transition into edit mode. We deliberately
  // don't depend on memory?.bio — if the writer fires from another tab
  // while the user is mid-edit, Convex would revalidate and clobber
  // their unsaved changes. The trade-off: if the bio updates remotely
  // during an open edit, the user sees their own draft and Save will
  // overwrite the remote write. That's the right call for an inline edit.
  const wasEditingRef = useRef(false);
  useEffect(() => {
    if (editing && !wasEditingRef.current) {
      setDraft(memory?.bio ?? "");
    }
    wasEditingRef.current = editing;
  }, [editing, memory?.bio]);

  // Focus the textarea on the same transition. Split out so it doesn't
  // re-run if the dep array above flips for any other reason.
  useEffect(() => {
    if (!editing) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [editing]);

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

  const handleSaveBio = async () => {
    // Guard against a save racing with a global privacy action (e.g.
    // forgetMe) — without this, a save that started before the wipe
    // could land just after, repopulating the bio the user just cleared.
    if (busy) return;
    const next = draft.trim().slice(0, MEMORY_BIO_CHAR_CAP);
    setSaving(true);
    try {
      await updateBio({ bio: next });
      toast.success(next ? "Bio updated" : "Bio cleared");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save bio");
    } finally {
      setSaving(false);
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
  const firstName = memory?.firstName ?? "you";
  const bio = memory?.bio ?? "";
  const draftDirty = draft.trim() !== bio.trim();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Coach memory & history</CardTitle>
        </div>
        <CardDescription>
          The AI coach can remember a short bio about you across sessions.
          Off by default — you control what&apos;s stored, when it expires,
          and you can wipe it any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="coach-memory-enabled" className="text-sm font-medium">
              Remember me across sessions
            </Label>
            <p className="text-xs text-muted-foreground">
              Stores a short paragraph about you (≤ {MEMORY_BIO_CHAR_CAP} characters).
              The auto-writer skips identifiers like email, phone, and
              third-party names; anything you type yourself in the pencil
              edit is saved as-is.
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

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">About {firstName}</p>
                <div className="flex items-center gap-3">
                  {memory?.updatedAt && !editing ? (
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Updated {formatRelative(memory.updatedAt)}
                    </p>
                  ) : null}
                  {!editing && (
                    <button
                      type="button"
                      aria-label={bio ? "Edit bio" : "Write your bio"}
                      onClick={() => setEditing(true)}
                      disabled={busy}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {editing ? (
                <div className="space-y-2">
                  <Textarea
                    aria-label={`Bio for ${firstName}`}
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) =>
                      setDraft(e.target.value.slice(0, MEMORY_BIO_CHAR_CAP))
                    }
                    rows={5}
                    maxLength={MEMORY_BIO_CHAR_CAP}
                    placeholder={`Write a short paragraph about ${firstName} — goals, schedule, what's worked, what hasn't.`}
                    disabled={saving || busy}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {draft.length} / {MEMORY_BIO_CHAR_CAP}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(false)}
                        disabled={saving || busy}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveBio}
                        disabled={saving || busy || !draftDirty}
                      >
                        {saving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : bio ? (
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm leading-relaxed text-foreground">
                  {bio}
                </p>
              ) : (
                <p className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  Chat with the coach to start your bio — or click the pencil
                  to write one yourself.
                </p>
              )}
            </div>
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
                  Clears your bio and deletes every saved coach
                  conversation. The audit log of these actions stays so
                  you can verify the wipe happened. This can&apos;t be
                  undone.
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
