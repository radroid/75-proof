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
    let parsed: LocalDB | null = null;
    try {
      const raw = window.localStorage.getItem(LOCAL_DB_KEY);
      if (raw) {
        const candidate = JSON.parse(raw) as LocalDB;
        if (candidate && candidate.version === 1) {
          parsed = candidate;
        }
      }
    } catch {
      // Corrupt or quota-restricted; keep empty DB.
    }
    // Always swap to a new cache reference so `useSyncExternalStore` sees a
    // changed snapshot identity. If we kept the field-init `emptyDB()` the
    // notify() below would not trigger re-renders for subscribers reading
    // `hydrationComplete` via `useLocalDB()` — Object.is would short-circuit.
    this.cache = parsed ?? emptyDB();
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

  /**
   * Returns true if the write reached localStorage (or we're in an SSR
   * context where there is nothing to persist to). Returning false lets
   * callers skip the cache swap so the in-memory state never drifts ahead
   * of what survives a reload.
   */
  private persist(db: LocalDB): boolean {
    if (typeof window === "undefined") return true;
    try {
      window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[local-store] persist failed", err);
      return false;
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
   * a new top-level reference so React's identity check fires. The draft
   * is a *deep* clone of the live cache: mutators are free to edit any
   * nested object/array on the draft without smearing writes onto the
   * live cache. If the mutator throws, the rollback leaves `this.cache`
   * untouched.
   */
  write(mutator: (draft: LocalDB) => void): void {
    this.hydrate();
    const next: LocalDB = structuredClone(this.cache);
    try {
      mutator(next);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[local-store] mutator threw, rolling back", err);
      return;
    }
    if (!this.persist(next)) return;
    this.cache = next;
    this.notify();
  }

  /** Reset everything — used by "delete local data" affordance and tests. */
  reset(): void {
    const next = emptyDB();
    if (!this.persist(next)) return;
    this.cache = next;
    this.notify();
  }
}

const EMPTY_SNAPSHOT: LocalDB = Object.freeze(emptyDB()) as LocalDB;

export const localStore = new LocalStore();
