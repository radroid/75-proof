"use client";

import { LOCAL_DB_KEY, emptyDB, type LocalDB } from "./db";

/**
 * Singleton in-memory cache + localStorage backing.
 *
 * SSR-safe: during server render `read()` returns the empty DB. The first
 * mount on the client triggers a hydration read; subscribers then re-render
 * with whatever was persisted. Components must therefore tolerate "no user,
 * no challenges" for the brief pre-hydration window — same shape as the
 * "user hasn't onboarded yet" state.
 */

type Listener = () => void;

class LocalStore {
  private cache: LocalDB = emptyDB();
  private listeners = new Set<Listener>();
  private hydrated = false;
  /** Public-readable flag — flips to true once the first hydrate from
   *  localStorage has completed. Code that branches on "user has data
   *  vs not yet loaded" needs this signal because both states present
   *  as `user: null` on the snapshot. */
  hydrationComplete = false;

  /**
   * Lazy hydration. Called from useSyncExternalStore subscribe so SSR
   * never touches localStorage (which doesn't exist there). Also
   * registers a `storage` event listener so writes from other tabs
   * propagate — `useSyncExternalStore` only sees in-process notifies
   * by default, and last-writer-wins across tabs is a real footgun
   * when the user has the app open twice.
   */
  hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalDB;
        if (parsed && parsed.version === 1) {
          this.cache = parsed;
        }
      }
    } catch {
      // Corrupt or quota-restricted; keep empty DB.
    }
    this.hydrationComplete = true;
    this.notify();
    window.addEventListener("storage", (ev) => {
      if (ev.key !== LOCAL_DB_KEY) return;
      if (ev.newValue === null) {
        this.cache = emptyDB();
        this.notify();
        return;
      }
      try {
        const parsed = JSON.parse(ev.newValue) as LocalDB;
        if (parsed && parsed.version === 1) {
          this.cache = parsed;
          this.notify();
        }
      } catch {
        /* ignore malformed cross-tab payload */
      }
    });
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(this.cache));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[local-store] persist failed", err);
    }
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  subscribe(fn: Listener): () => void {
    this.hydrate();
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Snapshot used by useSyncExternalStore. Same reference until a write. */
  getSnapshot(): LocalDB {
    return this.cache;
  }

  /** SSR snapshot — never returns the cached client state. */
  getServerSnapshot(): LocalDB {
    return EMPTY_SNAPSHOT;
  }

  /**
   * Mutator — receives a draft, applies changes, replaces the cache with
   * a new top-level reference so React's identity check fires. We pass a
   * shallow clone so mutations on the draft don't mutate the live cache
   * before notify fires (callers can still freely mutate sub-arrays they
   * replace wholesale).
   */
  write(mutator: (draft: LocalDB) => void): void {
    this.hydrate();
    const next: LocalDB = {
      ...this.cache,
      challenges: [...this.cache.challenges],
      habitDefinitions: [...this.cache.habitDefinitions],
      habitEntries: [...this.cache.habitEntries],
      activityFeed: [...this.cache.activityFeed],
    };
    try {
      mutator(next);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[local-store] mutator threw, rolling back", err);
      return;
    }
    this.cache = next;
    this.persist();
    this.notify();
  }

  /** Reset everything — used by "delete local data" affordance and tests. */
  reset(): void {
    this.cache = emptyDB();
    this.persist();
    this.notify();
  }

  /** Generate the next ID for a given table. Persists alongside the write. */
  nextIdFor(table: string): string {
    // Caller is inside a write(); we only mutate the draft, never the cache
    // directly. Bump nextId on the draft.
    return `local_${table}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
}

const EMPTY_SNAPSHOT: LocalDB = Object.freeze(emptyDB()) as LocalDB;

export const localStore = new LocalStore();
