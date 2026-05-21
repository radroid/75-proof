"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useThemePersonality } from "@/components/theme-provider";
import { themeMetadata, type ThemePersonality } from "@/lib/themes";

function isThemePersonality(v: unknown): v is ThemePersonality {
  return typeof v === "string" && v in themeMetadata;
}

/**
 * Bridges the localStorage-only ThemeProvider with the user's Convex
 * preferences so theme choice survives across devices for authed users.
 *
 * First-paint still reads from localStorage (no flash-of-wrong-theme
 * server round-trip). After the user query resolves we hydrate from
 * Convex if there's a stored value, then subsequent personality changes
 * write back. Guests never get a `user` (Clerk identity is missing) so
 * the effects bail naturally — no `useGuest` dependency needed, which
 * also lets us mount this above GuestProvider in the layout tree.
 */
export function ThemeConvexSync() {
  const { personality, setPersonality } = useThemePersonality();
  const user = useQuery(api.users.getCurrentUser);
  const setThemePersonality = useMutation(api.users.setThemePersonality);

  // Tracks whether we've consumed the initial Convex value. Without this
  // the personality→Convex write effect below would echo the just-
  // hydrated value straight back as a no-op mutation on every reload.
  const hydratedRef = useRef(false);
  // Tracks the last personality we wrote to Convex so we don't refire
  // the mutation when the same personality re-arrives via the
  // useQuery subscription.
  const lastWrittenRef = useRef<ThemePersonality | null>(null);

  // One-way: Convex → local on first user load.
  useEffect(() => {
    if (!user) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = user.preferences?.themePersonality;
    if (isThemePersonality(stored)) {
      lastWrittenRef.current = stored;
      if (stored !== personality) {
        setPersonality(stored);
      }
    }
  }, [user, personality, setPersonality]);

  // One-way: local → Convex on personality change. Guarded behind the
  // hydration ref so the initial Convex read doesn't echo back.
  useEffect(() => {
    if (!user) return;
    if (!hydratedRef.current) return;
    if (lastWrittenRef.current === personality) return;
    lastWrittenRef.current = personality;
    setThemePersonality({ personality }).catch(() => {
      // Mutation has its own no-op short-circuit on the server. A network
      // failure is benign — localStorage still holds the user's choice
      // and the next reload will retry the sync.
    });
  }, [personality, user, setThemePersonality]);

  return null;
}
