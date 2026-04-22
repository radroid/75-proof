import posthog from "posthog-js";

// Production-only: only initialize PostHog when NODE_ENV is production AND the token is set.
// Set NEXT_PUBLIC_POSTHOG_FORCE_ENABLE=1 to opt-in from a non-production environment (e.g. preview).
const shouldInit =
  !!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
  (process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_POSTHOG_FORCE_ENABLE === "1");

if (shouldInit) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
      blockSelector: "[data-ph-no-capture]",
    },
    autocapture: {
      dom_event_allowlist: ["click", "change", "submit"],
      css_selector_allowlist: ["[data-ph-capture]", "button", "a"],
    },
  });
}
