// Dev-only design-system browser. Per EARNED_TRANSITION.md Phase 10
// step "Create `/design-system` route in the app (dev-only or behind
// a flag) showing the preview cards from `design-system/project/preview/`
// — engineers can browse tokens in-app."
//
// Production safety: this page renders only when NODE_ENV === "development".
// Outside dev it returns 404 via `notFound()`. The route is also marked
// `dynamic = "force-dynamic"` so it's never prerendered at build time.

import { notFound } from "next/navigation";
import { ThemedIcon } from "@/components/earned/icons/themed-icon";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { EmptyState } from "@/components/ui/empty-state";
import { EarnedLoadingText } from "@/components/earned/loading-text";

export const dynamic = "force-dynamic";

// Earned brand tokens — keep in sync with the `[data-theme="earned"]`
// block in `app/globals.css`. Source of truth for design:
// `design-system/project/README.md` § Color.
const COLORS = [
  { name: "cream paper", value: "#F4ECD8", note: "default background" },
  { name: "cream light", value: "#F9F3E1", note: "cards / chips on cream" },
  { name: "cream dark", value: "#E8DEC4", note: "borders / dashed separators" },
  { name: "ink", value: "#1F1F1D", note: "primary text" },
  { name: "ink soft", value: "rgba(31,31,29,0.55)", note: "muted text" },
  { name: "star gold", value: "#D8A830", note: "accent — earned stars" },
  { name: "sky", value: "#0090D8", note: "info accent / links" },
  { name: "rose", value: "#C75F4A", note: "destructive / missed" },
  { name: "sage", value: "#7A8C6B", note: "success / sustained" },
] as const;

// Hand-drawn icon variants currently registered in `ThemedIcon`. Keep
// in sync with `components/earned/icons/themed-icon.tsx` — adding a
// variant there means adding a row here. PR #81 (still open, adds
// `check`) will need this list extended on its merge.
const ICON_NAMES = [
  "palette",
  "calendar-days",
  "calendar-clock",
  "bell",
  "shield",
  "alert-triangle",
  "infinity",
  "play",
  "settings",
  "smartphone",
  "monitor",
  "trash",
  "nudge",
  "rocket",
  "trophy",
  "flame",
  "rotate-cw",
  "plus",
  "close",
  "inbox",
  "send",
  "history",
  "note",
  "layout-dashboard",
  "x-circle",
] as const;

type IconName = (typeof ICON_NAMES)[number];

// The HTML preview cards shipped with the design-system bundle in
// `design-system/project/preview/`. These are static reference docs
// (not React components) — engineers can open them directly in a
// browser tab via the file:// path to compare against in-app
// implementations.
const PREVIEW_CARDS = [
  { file: "brand-logos.html", title: "Brand logos" },
  { file: "brand-wordmark-on-sky.html", title: "Wordmark on sky" },
  { file: "colors-foundation.html", title: "Colors — foundation" },
  { file: "colors-accent.html", title: "Colors — accents" },
  { file: "type-poppins.html", title: "Type — Poppins" },
  { file: "type-caveat.html", title: "Type — Caveat" },
  { file: "spacing-scale.html", title: "Spacing scale" },
  { file: "radii.html", title: "Radii" },
  { file: "shadows.html", title: "Shadows" },
  { file: "motion.html", title: "Motion" },
  { file: "surface-paper.html", title: "Surface — paper" },
  { file: "iconography.html", title: "Iconography" },
  { file: "components-buttons.html", title: "Buttons" },
  { file: "components-input.html", title: "Input" },
  { file: "components-checkboxes.html", title: "Checkboxes" },
  { file: "components-chips.html", title: "Chips" },
  { file: "components-habit-row.html", title: "Habit row" },
  { file: "components-calendar.html", title: "Calendar" },
  { file: "components-progress.html", title: "Progress" },
  { file: "components-stars.html", title: "Stars" },
] as const;

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div
      data-theme="earned"
      className="min-h-screen bg-background text-foreground"
    >
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Dev only · /design-system
          </p>
          <h1
            className="text-4xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Earned design system
          </h1>
          <p className="text-sm text-muted-foreground max-w-prose">
            Live in-app reference for Earned tokens + icons. Returns 404 outside{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              NODE_ENV=development
            </code>
            . For the full design source, see{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              design-system/project/README.md
            </code>
            .
          </p>
        </header>

        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Colors
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {COLORS.map((c) => (
              <div
                key={c.name}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <div
                  className="h-16 w-full border-b"
                  style={{ backgroundColor: c.value }}
                  aria-hidden
                />
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium leading-tight">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {c.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Icons ({ICON_NAMES.length})
          </h2>
          <p className="text-sm text-muted-foreground max-w-prose">
            Hand-drawn variants render under <code>data-theme=&quot;earned&quot;</code>;
            other themes fall through to the Lucide default. All variants
            registered in <code>components/earned/icons/themed-icon.tsx</code>.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {ICON_NAMES.map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4"
              >
                <ThemedIcon
                  name={name as IconName}
                  className="h-6 w-6 text-foreground"
                />
                <p className="text-xs text-muted-foreground font-mono text-center">
                  {name}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Components
          </h2>
          <p className="text-sm text-muted-foreground max-w-prose">
            Live React renders of the Earned UI primitives. These are the
            actual components shipped to users — not visual reproductions.
          </p>

          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Button — variants
            </h3>
            <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-4">
              <Button variant="default">Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="success">Success</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Button — sizes
            </h3>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-4">
              <Button size="sm">sm</Button>
              <Button size="default">default</Button>
              <Button size="lg">lg</Button>
              <Button size="xl">xl</Button>
              <Button size="icon" aria-label="Icon button">
                <ThemedIcon name="plus" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Button — loading state
            </h3>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-4">
              <Button loading>Saving</Button>
              <Button variant="outline" loading>Loading</Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Chat bubble — user + assistant
            </h3>
            <div className="space-y-2 rounded-xl border bg-card p-4">
              <ChatBubble
                role="user"
                content="What habit should I start with?"
              />
              <ChatBubble
                role="assistant"
                content="Pick one you can do every day in under five minutes. The point isn't the habit yet — it's showing up."
              />
              <ChatBubble role="assistant" content="" pending />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Empty state
            </h3>
            <div className="rounded-xl border bg-card p-4">
              <EmptyState
                icon={<ThemedIcon name="inbox" className="h-10 w-10" />}
                title="Nothing here yet"
                description="When something lands, you'll see it on this page."
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Loading text
            </h3>
            <div className="flex flex-wrap items-center gap-6 rounded-xl border bg-card p-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">
                  default
                </p>
                <EarnedLoadingText label="thinking" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">
                  dotsOnly
                </p>
                <EarnedLoadingText dotsOnly label="loading" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Preview cards
          </h2>
          <p className="text-sm text-muted-foreground max-w-prose">
            Static HTML reference cards shipped with the design-system bundle.
            Open directly in a browser tab — they live at{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              design-system/project/preview/
            </code>
            .
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PREVIEW_CARDS.map((p) => (
              <li
                key={p.file}
                className="rounded-lg border bg-card p-3 text-sm"
              >
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {p.file}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
