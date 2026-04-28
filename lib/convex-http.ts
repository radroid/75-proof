// Server-only Convex HTTP client. Used by Next.js Route Handlers that run
// on Cloudflare Workers via @opennextjs/cloudflare, where `convex/browser`'s
// ConvexHttpClient is unsafe — it transitively pulls in `ws`, `bufferutil`,
// and `node-gyp-build`, which fail to load on workerd and break the entire
// route module ("ComponentMod.handler is not a function").
//
// Hits Convex's HTTP API (`/api/query`, `/api/mutation`, `/api/action`)
// directly. Forwards a Clerk-issued JWT as a Bearer token when present
// so server-side queries/actions resolve identity; passes the call through
// unauthenticated otherwise, which is fine for endpoints that allow guests.

import "server-only";

export type ConvexFunctionKind = "query" | "mutation" | "action";

export type RunConvexOptions = {
  timeoutMs: number;
  /** Clerk-issued Convex JWT, or null/undefined for guest calls. */
  token?: string | null;
};

export async function runConvex<T>(
  baseUrl: string,
  kind: ConvexFunctionKind,
  path: string,
  args: Record<string, unknown>,
  opts: RunConvexOptions,
): Promise<T> {
  // AbortController so the outbound fetch is actually cancelled on timeout —
  // a Promise.race-style local timeout would let the request keep running on
  // workerd, racking up CPU time and load on Convex.
  const controller = new AbortController();
  const timer = setTimeout(
    () =>
      controller.abort(
        new Error(`Convex ${kind} ${path} timed out after ${opts.timeoutMs}ms`),
      ),
    opts.timeoutMs,
  );
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/${kind}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ path, args, format: "json" }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(
        `Convex ${kind} ${path} failed: HTTP ${res.status} ${await res.text().catch(() => "")}`.trim(),
      );
    }
    const body = (await res.json()) as
      | { status: "success"; value: T }
      | { status: "error"; errorMessage: string; errorData?: unknown };
    if (body.status === "error") {
      throw new Error(`Convex ${kind} ${path} returned error: ${body.errorMessage}`);
    }
    return body.value;
  } finally {
    clearTimeout(timer);
  }
}
