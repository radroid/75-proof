import type { Metadata } from "next";
import Link from "next/link";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700;800;900&family=Caveat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap";

const ABOUT_DESCRIPTION =
  "75 Proof is a free, open-source, privacy-first habit tracker. It started as a 75 HARD challenge tracker and grew into a general-purpose habit and routine tool, built by Create+ Club and the contributor community.";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About 75 Proof",
    description: ABOUT_DESCRIPTION,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About 75 Proof",
    description: ABOUT_DESCRIPTION,
  },
};

function StickerTag({
  text,
  bg,
  color,
}: {
  text: string;
  bg: string;
  color: string;
}) {
  return (
    <span
      className="inline-block px-4 py-1.5 rounded-full text-[13px] font-bold"
      style={{
        backgroundColor: bg,
        color,
        fontFamily: "'Space Mono', monospace",
      }}
    >
      {text}
    </span>
  );
}

function TiltCard({
  children,
  rotate,
  className = "",
}: {
  children: React.ReactNode;
  rotate: string;
  className?: string;
}) {
  return (
    <div
      className={`relative transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ transform: `rotate(${rotate})` }}
    >
      {children}
    </div>
  );
}

const MISSION_CARDS: Array<{
  color: string;
  title: string;
  body: string;
  textColor: string;
  bordered?: boolean;
  rotate: string;
}> = [
  {
    color: "#FF6154",
    title: "Free, forever",
    body: "No trials, no premium, no $9.99/month. We built this for the community. It costs you nothing — and it always will.",
    textColor: "white",
    rotate: "-1.5deg",
  },
  {
    color: "#FFFBF0",
    title: "Privacy first",
    body: "No ads. No third-party trackers. We don't sell your habits or your progress photos. Your data is yours — period.",
    textColor: "#1a1a1a",
    bordered: true,
    rotate: "1deg",
  },
  {
    color: "#4ECDC4",
    title: "Open source",
    body: "MIT-licensed. Read the code, fork it, run your own copy, send a PR. If it doesn't do what you want — make it do what you want.",
    textColor: "white",
    rotate: "-0.5deg",
  },
];

const EVOLUTION_BEATS: Array<{ tag: string; title: string; body: string }> = [
  {
    tag: "v1 — THE SEED",
    title: "A 75 HARD tracker",
    body: "75 Proof started as the cleanest, most opinionated 75 HARD app we could build. Six tasks a day, one reset rule, no excuses. Everything else flowed from that constraint.",
  },
  {
    tag: "v2 — IT GREW UP",
    title: "Any habit, any cadence",
    body: "Users wanted to keep using it after Day 75 — for daily reading, weekly long runs, monthly reviews, yearly goals. So we generalised the engine. The same checklist, streaks, friends, and AI coach now back any routine you can describe.",
  },
  {
    tag: "v3 — IT'S YOURS",
    title: "Open source habit OS",
    body: "Habit tracking apps used to be locked black boxes that monetised your discipline. We open-sourced 75 Proof so you can audit it, fork it, theme it, and bend it to whatever routine you're building — no permission required.",
  },
];

type RoadmapItem = { id: string; title: string; tier: "p1" | "p2" };

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: "H-5",
    title: "Habit cadence — weekly / monthly / yearly targets, not just daily",
    tier: "p1",
  },
  {
    id: "C-3",
    title: "Coach as central comms hub — AI-authored reminders & nudges",
    tier: "p1",
  },
  {
    id: "C-4",
    title: "Two-way coach chat — let the coach edit your routine for you",
    tier: "p1",
  },
  {
    id: "S-6",
    title: "Username system — replace name search with unique @usernames",
    tier: "p1",
  },
  {
    id: "H-2",
    title: "Edit your habits after onboarding (rename, swap, retarget)",
    tier: "p2",
  },
  {
    id: "S-4",
    title: "Milestone celebrations — confetti, badges, friend cheers",
    tier: "p2",
  },
  {
    id: "S-7",
    title: "Invite friends via shareable card (iMessage / WhatsApp)",
    tier: "p2",
  },
  {
    id: "P-2",
    title: "One-click account & data deletion",
    tier: "p2",
  },
  {
    id: "P-3",
    title: "Plain-english privacy policy",
    tier: "p2",
  },
];

const TIER_STYLE: Record<RoadmapItem["tier"], { label: string; bg: string; color: string }> = {
  p1: { label: "P1 · NEXT UP", bg: "#FF6154", color: "white" },
  p2: { label: "P2 · SOON-ISH", bg: "#FFE66D", color: "#1a1a1a" },
};

export default function AboutPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden selection:bg-[#FF6154]/20"
      style={{ backgroundColor: "#FFFBF0", color: "#1a1a1a" }}
    >
      <link rel="stylesheet" href={FONT_LINK} />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-black"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <img src="/logo.svg" alt="75 Proof" width={28} height={28} />
          75 Proof
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[13px] font-bold px-4 py-3 hidden sm:inline-block hover:underline"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ← BACK
          </Link>
          <Link
            href="/sign-up"
            className="text-[13px] font-bold px-6 py-3 bg-[#FF6154] text-white rounded-none hover:bg-[#e5534b] transition-all"
            style={{
              fontFamily: "'Space Mono', monospace",
              transform: "rotate(1deg)",
            }}
          >
            JOIN FREE →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-10 pt-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-3 mb-8">
            <StickerTag text="OPEN SOURCE" bg="#A78BFA" color="white" />
            <StickerTag text="PRIVATE BY DEFAULT" bg="#4ECDC4" color="white" />
            <StickerTag text="FREE FOREVER" bg="#FFE66D" color="#1a1a1a" />
          </div>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            About{" "}
            <span className="text-[#FF6154]">75 Proof</span>
            <span className="block">— the habit OS for hard things.</span>
          </h1>

          <p
            className="text-lg md:text-xl text-[#1a1a1a]/65 leading-relaxed max-w-2xl"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            We started by building the 75 HARD tracker we wished existed. We
            ended up with an open-source habit and routine engine that anyone
            can run, fork, and reshape into the tool they actually want.
          </p>
        </div>
      </section>

      {/* What is 75 Proof */}
      <section className="relative z-10 px-6 md:px-10 py-16 bg-[#1a1a1a] text-[#FFFBF0]">
        <div className="max-w-3xl mx-auto">
          <span
            className="text-[11px] tracking-[0.25em] uppercase opacity-50 block mb-4"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            What is 75 Proof
          </span>
          <h2
            className="text-3xl md:text-5xl font-black leading-tight mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            A habit tracker that actually has{" "}
            <span className="text-[#4ECDC4]">opinions</span>.
          </h2>
          <div
            className="space-y-5 text-[17px] leading-relaxed opacity-80"
            style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
            }}
          >
            <p>
              75 Proof is a free, open-source, privacy-first habit tracker
              built around the 75 HARD challenge — and any routine that looks
              like it. It&apos;s designed to help people build discipline and
              improve their health without exploiting their data, attention, or
              wallet.
            </p>
            <p>
              The whole product is shaped by one belief: discipline software
              should feel <em>fun, celebratory, and empowering</em> — never
              punitive, never manipulative. No streak-loss anxiety
              dark-patterns. No &ldquo;you missed a day, here&apos;s a sad email.&rdquo; No
              upsell screens between you and the thing you&apos;re trying to
              do.
            </p>
            <p>
              You log six tasks a day (or however many you set), you swipe
              through the past two days to clean up, and you let the app fade
              into the background. That&apos;s the whole loop.
            </p>
          </div>
        </div>
      </section>

      {/* What is 75 HARD */}
      <section className="relative z-10 px-6 md:px-10 py-20">
        <div className="max-w-3xl mx-auto">
          <span
            className="text-[11px] tracking-[0.25em] uppercase text-[#1a1a1a]/40 block mb-4"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            The challenge
          </span>
          <h2
            className="text-3xl md:text-5xl font-black leading-tight mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            What is{" "}
            <span className="text-[#FF6154]">75 HARD</span>?
          </h2>
          <p
            className="text-[17px] leading-relaxed text-[#1a1a1a]/70 mb-6"
            style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
          >
            75 HARD is a 75-day mental toughness program created by Andy
            Frisella. Every single day, you complete six tasks — no
            substitutions, no exceptions:
          </p>
          <ol
            className="space-y-2 mb-6 text-[17px] text-[#1a1a1a]/80"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            <li>1. Two 45-minute workouts (one of them must be outdoors)</li>
            <li>2. Follow a diet of your choice — no alcohol, no cheat meals</li>
            <li>3. Drink one gallon of water</li>
            <li>4. Read 10 pages of a non-fiction book</li>
            <li>5. Take a progress photo</li>
            <li>6. Repeat for 75 consecutive days</li>
          </ol>
          <p
            className="text-[17px] leading-relaxed text-[#1a1a1a]/70"
            style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
          >
            Miss any one task and you restart at Day 1. 75 Proof enforces this
            automatically — there&apos;s no way to skip or backfill. That&apos;s
            the whole point.
          </p>
        </div>
      </section>

      {/* Evolution */}
      <section
        className="relative z-10 px-6 md:px-10 py-20 bg-[#f4efe6]"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span
              className="text-[11px] tracking-[0.25em] uppercase text-[#1a1a1a]/40 block mb-3"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              How we got here
            </span>
            <h2
              className="text-4xl md:text-5xl font-black leading-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              From a single challenge
              <br />
              to a{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#FF6154]">habit OS</span>
                <span
                  className="absolute bottom-0 left-0 right-0 h-3 bg-[#FF6154]/15 -z-0"
                  style={{ transform: "rotate(-1deg)" }}
                />
              </span>
              .
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EVOLUTION_BEATS.map((beat, idx) => {
              const rotates = ["-1.5deg", "1deg", "-0.75deg"];
              return (
                <TiltCard key={beat.tag} rotate={rotates[idx] ?? "0deg"}>
                  <div
                    className="bg-white p-7 h-full"
                    style={{
                      border: "2px solid #1a1a1a",
                      boxShadow: "4px 4px 0 #1a1a1a",
                    }}
                  >
                    <span
                      className="text-[10px] tracking-[0.2em] uppercase text-[#FF6154] block mb-3"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {beat.tag}
                    </span>
                    <h3
                      className="text-xl font-black mb-3 leading-tight"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {beat.title}
                    </h3>
                    <p
                      className="text-[15px] leading-relaxed text-[#1a1a1a]/70"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {beat.body}
                    </p>
                  </div>
                </TiltCard>
              );
            })}
          </div>

          <p
            className="text-center text-[15px] text-[#1a1a1a]/50 mt-12 max-w-2xl mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            Most apps follow this arc — start narrow, generalise, eventually
            calcify into a SaaS. We chose to open source instead, so the
            generalisation belongs to everyone using it.
          </p>
        </div>
      </section>

      {/* Mission cards */}
      <section className="relative z-10 px-6 md:px-10 py-20">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl md:text-5xl font-black text-center leading-tight mb-12"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            What we{" "}
            <span className="relative inline-block mx-1">
              <span className="relative z-10 text-[#4ECDC4]">won&apos;t</span>
              <span
                className="absolute bottom-0 left-0 right-0 h-3 bg-[#4ECDC4]/15 -z-0"
                style={{ transform: "rotate(-1deg)" }}
              />
            </span>{" "}
            compromise on
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MISSION_CARDS.map((card) => (
              <TiltCard key={card.title} rotate={card.rotate}>
                <div
                  className="p-7 rounded-sm h-full"
                  style={{
                    backgroundColor: card.color,
                    color: card.textColor,
                    border: card.bordered ? "2px solid #1a1a1a15" : "none",
                  }}
                >
                  <h3
                    className="text-xl font-black mb-3"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-[15px] leading-relaxed opacity-80"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section
        className="relative z-10 px-6 md:px-10 py-20"
        style={{ backgroundColor: "#1a1a1a", color: "#FFFBF0" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span
              className="text-[11px] tracking-[0.25em] uppercase opacity-50 block mb-3"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              On the workbench
            </span>
            <h2
              className="text-4xl md:text-5xl font-black leading-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              What&apos;s{" "}
              <span className="text-[#FFE66D]">next</span>.
            </h2>
            <p
              className="mt-5 text-[16px] opacity-65 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
            >
              The full roadmap lives in{" "}
              <code
                className="px-1.5 py-0.5 bg-white/10 rounded text-[14px]"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                docs/BACKLOG.md
              </code>{" "}
              in the repo. Here&apos;s a slice of what&apos;s prioritised
              right now — pick one and ship it.
            </p>
          </div>

          <ul className="space-y-3">
            {ROADMAP_ITEMS.map((item) => {
              const tier = TIER_STYLE[item.tier];
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-4 border-b border-white/10 pb-3"
                >
                  <span
                    className="shrink-0 inline-block px-2.5 py-1 text-[10px] font-bold tracking-wider"
                    style={{
                      backgroundColor: tier.bg,
                      color: tier.color,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {tier.label}
                  </span>
                  <span className="flex-1">
                    <span
                      className="block text-[15px] md:text-[16px] font-semibold leading-snug"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="block text-[12px] opacity-50 mt-0.5"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {item.id}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="text-center mt-10">
            <a
              href="https://github.com/radroid/75-proof/blob/main/docs/BACKLOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-7 py-4 text-[14px] font-black tracking-wider bg-[#FFE66D] text-[#1a1a1a] hover:scale-105 active:scale-95 transition-all"
              style={{
                fontFamily: "'Space Mono', monospace",
                transform: "rotate(-1deg)",
              }}
            >
              READ THE FULL BACKLOG →
            </a>
          </div>
        </div>
      </section>

      {/* Built by */}
      <section className="relative z-10 px-6 md:px-10 py-20">
        <div className="max-w-3xl mx-auto">
          <span
            className="text-[11px] tracking-[0.25em] uppercase text-[#1a1a1a]/40 block mb-4"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Who builds this
          </span>
          <h2
            className="text-3xl md:text-5xl font-black leading-tight mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Built by{" "}
            <span className="text-[#A78BFA]">Create+ Club</span>
            <br />& contributors.
          </h2>
          <div
            className="space-y-5 text-[17px] leading-relaxed text-[#1a1a1a]/70"
            style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
          >
            <p>
              75 Proof is maintained by Create+ Club and a growing list of open
              source contributors. The repo is MIT-licensed — copyright belongs
              to &ldquo;75 Proof Contributors,&rdquo; not a company. If you ship a PR, your
              name is on the project. Permanently.
            </p>
            <p>
              We don&apos;t have a sales team, a growth org, or investors to
              answer to. The roadmap is whatever the community is willing to
              build, plus what Create+ Club has the time to maintain. That
              tradeoff is the whole reason this app stays free, ad-free, and
              honest.
            </p>
            <p>
              Want it to do something it doesn&apos;t do?{" "}
              <a
                href="https://github.com/radroid/75-proof"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#FF6154] decoration-2 underline-offset-4 hover:text-[#FF6154]"
              >
                Open the repo
              </a>
              , file an issue, send a PR — or fork it and run your own version
              with whatever rules you want. That&apos;s the deal.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6 md:px-10 text-center">
        <h2
          className="text-5xl md:text-7xl font-black leading-[0.95] mb-6"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Day 1
          <br />
          <span className="text-[#4ECDC4]">starts</span>
          <br />
          when you do.
        </h2>
        <p
          className="text-lg text-[#1a1a1a]/40 mb-10"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
        >
          Free. No catches. Quit any time, take your data with you.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="inline-block px-12 py-5 bg-[#FF6154] text-white text-lg font-black hover:scale-105 active:scale-95 transition-all"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              transform: "rotate(-1deg)",
            }}
          >
            START NOW — FREE
          </Link>
          <a
            href="https://github.com/radroid/75-proof"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-5 border-2 border-[#1a1a1a] text-[#1a1a1a] text-lg font-black hover:bg-[#1a1a1a] hover:text-[#FFFBF0] transition-all"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              transform: "rotate(1deg)",
            }}
          >
            STAR THE REPO ★
          </a>
        </div>
      </section>

      <footer className="border-t border-[#1a1a1a]/8 py-6 px-6 text-center">
        <span
          className="text-[13px] text-[#1a1a1a]/25 font-bold"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          75 Proof © 2026 — Cut out, tape up, get to work
        </span>
      </footer>
    </div>
  );
}
