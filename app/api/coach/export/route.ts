import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SNAPSHOT_TIMEOUT_MS = 30_000;

// See app/api/coach/chat/route.ts for the rationale: `convex/browser` pulls
// in `ws` / `bufferutil` / `node-gyp-build`, none of which load on Cloudflare
// Workers. We hit Convex's HTTP API directly with the Clerk-issued JWT.
async function runConvexAction<T>(
  baseUrl: string,
  path: string,
  args: Record<string, unknown>,
  token: string,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`Convex action ${path} timed out after ${timeoutMs}ms`)),
    timeoutMs,
  );
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ path, args, format: "json" }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(
        `Convex action ${path} failed: HTTP ${res.status} ${await res.text().catch(() => "")}`.trim(),
      );
    }
    const body = (await res.json()) as
      | { status: "success"; value: T }
      | { status: "error"; errorMessage: string; errorData?: unknown };
    if (body.status === "error") {
      throw new Error(`Convex action ${path} returned error: ${body.errorMessage}`);
    }
    return body.value;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * C-5: Downloadable coach context bundle.
 *
 * Returns the user's persisted coach memory, all threads + messages,
 * and the audit log as a single JSON document with a README explaining
 * the schema. The export action itself is logged to the audit trail
 * (the export counts as a consent event per the BACKLOG spec).
 *
 * Auth-required. Returns 401 for guests.
 */
export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: "Convex URL not configured" },
      { status: 500 },
    );
  }

  const { getToken, userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Convex token unavailable" }, { status: 500 });
  }

  let snapshot: {
    memory: unknown;
    threads: unknown;
    audit: unknown;
    truncation: unknown;
  };
  try {
    snapshot = await runConvexAction<{
      memory: unknown;
      threads: unknown;
      audit: unknown;
      truncation: unknown;
    }>(convexUrl, "coach:exportSnapshot", {}, token, SNAPSHOT_TIMEOUT_MS);
  } catch (err) {
    console.error("[coach/export] snapshot failed", err);
    return NextResponse.json(
      { error: "Failed to build export bundle" },
      { status: 500 },
    );
  }

  const bundle = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    readme: README_TEXT,
    memory: snapshot.memory,
    threads: snapshot.threads,
    audit: snapshot.audit,
    truncation: snapshot.truncation,
  };

  const json = JSON.stringify(bundle, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="75proof-coach-context-${
        new Date().toISOString().split("T")[0]
      }.json"`,
      // Don't let CDNs cache user-specific data.
      "Cache-Control": "private, no-store",
    },
  });
}

const README_TEXT = `# 75 Proof — Coach Context Bundle

This file is your full coach context, exported on request. It contains:

- **memory**: durable facts the coach learned about you (CLAUDE.md-style summary).
  Capped at ~2KB. May be null if you never opted in.
- **threads**: every coach chat you saved, with full transcripts.
- **audit**: an append-only log of every memory write, purge, thread delete,
  and export so you can verify what was stored and when.
- **truncation**: flags any place where the export hit a server-side cap so
  you can tell if the bundle is complete. Re-export to pick up newer rows;
  if you ever see flags set we recommend filing an issue so we can raise
  the limits for your account.

## Schema

\`\`\`
{
  schemaVersion: 1,
  exportedAt: ISO8601 timestamp,
  memory: {
    enabled: boolean,
    ttlDays: number,
    ttlOptOut: boolean,
    facts: string[],
    updatedAt: epoch ms
  } | null,
  threads: Array<{
    title: string,
    source: "onboarding" | "coach" | "imported",
    createdAt: epoch ms,
    updatedAt: epoch ms,
    messages: Array<{
      role: "user" | "assistant",
      content: string,
      createdAt: epoch ms
    }>
  }>,
  audit: Array<{
    action: "memory_write" | "memory_purge_manual" | "memory_purge_ttl"
          | "memory_settings_changed" | "thread_delete" | "thread_create"
          | "forget_me" | "export",
    detail: string,
    createdAt: epoch ms
  }>,
  truncation: {
    threads: boolean,        // true if more threads than were returned
    audit: boolean,          // true if more audit rows than were returned
    anyMessages: boolean,    // true if any thread.truncated is true
    limits: { maxThreads, maxMessagesPerThread, maxAudit }
  }
}
\`\`\`

## Using this elsewhere

Paste the \`memory.facts\` array as a system message preamble into ChatGPT,
Claude, or any other LLM to give them the same context the 75 Proof coach has.
The threads are full chat transcripts — feed them in if you want a new model
to pick up where the coach left off.

## Privacy

This file lives on your machine the moment you download it. 75 Proof keeps the
same data on its servers (subject to the TTL you've configured); use the
"Forget me" button in settings to purge it server-side.
`;
