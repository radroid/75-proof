"use client";

import { useEffect } from "react";
import { ensureInstallPromptListener } from "./use-install-prompt";

/**
 * Mounts at the root layout so the `beforeinstallprompt` listener is alive
 * the moment any client code runs — not just when the dashboard layout
 * (and therefore `<InstallPromptGate />`) finally renders. Without this,
 * Chrome's one-shot install event fires on `/` or `/onboarding`, hits no
 * listener, and is gone — local-mode users in particular pass through
 * those routes too quickly to ever see a prompt.
 *
 * Side effect happens at module import time as well; this component just
 * keeps the import alive in the client bundle and gives the call site an
 * obvious place to point at when reading the layout.
 */
export function InstallPromptCapture() {
  useEffect(() => {
    ensureInstallPromptListener();
  }, []);
  return null;
}
