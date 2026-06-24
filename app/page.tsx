"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { sharedUserProfileProps } from "@/lib/clerk-appearance";
import { useGuest } from "@/components/guest-provider";

/*
 * The landing page is the brand's marketing surface, so it is intentionally
 * "brand-locked": it always renders the earned identity (cream paper, ink,
 * sky, gold star) regardless of the visitor's chosen in-app theme. The
 * earned colors are inlined here on purpose — they are NOT theme-token
 * violations. App surfaces (dashboard, settings, etc.) use the theme tokens.
 */
const C = {
  cream: "#F4ECD8",
  creamLight: "#F9F3E1",
  creamDark: "#E8DEC4",
  ink: "#1F1F1D",
  inkSoft: "#3A3A36",
  sky: "#0085D4",
  skyDeep: "#006BA8",
  gold: "#D8A830",
} as const;

const SANS = "'Poppins', system-ui, -apple-system, sans-serif";
const HAND = "'Caveat', 'Poppins', cursive";

// Ruled-notebook paper surface: faint horizontal rules + a warm margin line.
const PAPER_BG = `
  repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 31px,
    rgba(31, 31, 29, 0.06) 31px,
    rgba(31, 31, 29, 0.06) 32px
  )
`;

/** Canonical gold star reward mark (served from /star.svg). */
function Star({ size = 24, className }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/star.svg"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ display: "block" }}
      aria-hidden
    />
  );
}

/** A small sky check inside a square sticker box — the "showed up" mark. */
function CheckBox({ state }: { state: "done" | "star" | "empty" }) {
  const base =
    "flex items-center justify-center w-7 h-7 shrink-0 rounded-[6px] border-2";
  if (state === "star") {
    return (
      <span
        className={base}
        style={{ borderColor: C.gold, backgroundColor: "#FBF1D6" }}
      >
        <Star size={18} />
      </span>
    );
  }
  if (state === "done") {
    return (
      <span
        className={base}
        style={{ borderColor: C.sky, backgroundColor: C.sky }}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
          <path
            d="M5 12.5 L10 17.5 L19 6.5"
            fill="none"
            stroke={C.creamLight}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span
      className={base}
      style={{ borderColor: "rgba(31,31,29,0.28)", backgroundColor: "transparent" }}
    />
  );
}

function HabitRow({
  label,
  state,
  reward,
}: {
  label: string;
  state: "done" | "star" | "empty";
  reward?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-[8px]"
      style={{
        backgroundColor: state === "empty" ? "transparent" : "rgba(255,255,255,0.45)",
      }}
    >
      <CheckBox state={state} />
      <span
        className="text-[15px] flex-1"
        style={{
          fontFamily: SANS,
          fontWeight: 500,
          color: state === "empty" ? "rgba(31,31,29,0.55)" : C.ink,
          textDecoration: state === "done" ? "none" : "none",
        }}
      >
        {label}
      </span>
      {reward && <Star size={20} />}
    </div>
  );
}

function PreviewCard() {
  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-[14px] p-5 sm:p-6"
      style={{
        backgroundColor: C.creamLight,
        border: `1.5px solid ${C.ink}`,
        boxShadow: "4px 4px 0 rgba(31,31,29,0.9)",
        transform: "rotate(-1.4deg)",
      }}
    >
      {/* Header — handwritten weekday + big day number */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p
            className="leading-none"
            style={{ fontFamily: HAND, fontSize: 26, color: C.sky }}
          >
            Tuesday
          </p>
          <p
            className="leading-none -mt-1"
            style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: C.ink }}
          >
            24
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: "#FBF1D6",
            border: `1.5px solid ${C.gold}`,
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 13,
            color: "#7A5A12",
            boxShadow: "2px 2px 0 rgba(31,31,29,0.85)",
          }}
        >
          <Star size={15} />
          12 day streak
        </span>
      </div>

      <div className="space-y-1">
        <HabitRow label="Read 20 pages" state="star" reward />
        <HabitRow label="Move my body" state="done" />
        <HabitRow label="Lights out by 11" state="empty" />
      </div>

      <p
        className="mt-4 pt-3 text-center"
        style={{
          fontFamily: HAND,
          fontSize: 20,
          color: C.inkSoft,
          borderTop: "1.5px dashed rgba(31,31,29,0.18)",
        }}
      >
        two down, one to go
      </p>
    </div>
  );
}

function NavLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="earned" width={30} height={30} />
      <span
        className="text-[22px]"
        style={{ fontFamily: SANS, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}
      >
        earned
      </span>
    </Link>
  );
}

function PrimaryButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="earned-btn-primary w-full sm:w-auto px-7 py-4 min-h-[52px] text-base font-semibold rounded-[10px] transition-transform"
      style={{
        fontFamily: SANS,
        backgroundColor: C.skyDeep,
        color: C.creamLight,
        border: `2px solid ${C.ink}`,
        boxShadow: "3px 3px 0 " + C.ink,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="earned-btn-ghost w-full sm:w-auto px-7 py-4 min-h-[52px] text-base font-semibold rounded-[10px] transition-colors"
      style={{
        fontFamily: SANS,
        backgroundColor: "transparent",
        color: C.ink,
        border: `2px solid rgba(31,31,29,0.25)`,
      }}
    >
      {children}
    </button>
  );
}

function HowItWorks() {
  const beats = [
    {
      n: "1",
      title: "Name your habits",
      body: "Write down the few things you want to do every day. Small and specific beats big and vague.",
    },
    {
      n: "2",
      title: "Pair them with a book",
      body: "Tie your habits to the book you're reading. The ideas and the doing reinforce each other.",
    },
    {
      n: "3",
      title: "Earn a star",
      body: "Show up, check it off, and earn a gold star for the day. Watch the streak grow, one page at a time.",
    },
  ];
  return (
    <section className="px-4 sm:px-6 md:px-10 py-16 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-center mb-3"
          style={{ fontFamily: HAND, fontSize: 38, color: C.sky }}
        >
          how it works
        </h2>
        <p
          className="text-center mb-12 max-w-md mx-auto text-[15px]"
          style={{ fontFamily: SANS, fontWeight: 500, color: "rgba(31,31,29,0.6)" }}
        >
          A research-driven way to build habits you'll actually keep.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          {beats.map((b) => (
            <div
              key={b.n}
              className="rounded-[14px] p-6"
              style={{
                backgroundColor: C.creamLight,
                border: `1.5px solid rgba(31,31,29,0.2)`,
                boxShadow: "3px 3px 0 rgba(31,31,29,0.12)",
              }}
            >
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-[8px] mb-4"
                style={{
                  backgroundColor: C.skyDeep,
                  color: C.creamLight,
                  fontFamily: SANS,
                  fontWeight: 800,
                  fontSize: 18,
                  border: `2px solid ${C.ink}`,
                }}
              >
                {b.n}
              </span>
              <h3
                className="mb-2 text-[19px]"
                style={{ fontFamily: SANS, fontWeight: 700, color: C.ink }}
              >
                {b.title}
              </h3>
              <p
                className="text-[14px] leading-relaxed"
                style={{ fontFamily: SANS, fontWeight: 400, color: "rgba(31,31,29,0.62)" }}
              >
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
  const router = useRouter();
  const { enterLocalMode } = useGuest();

  return (
    <div
      className="min-h-dvh overflow-x-hidden"
      style={{ backgroundColor: C.cream, color: C.ink, backgroundImage: PAPER_BG }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .earned-btn-primary:hover {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #1F1F1D;
        }
        .earned-btn-primary:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0 #1F1F1D;
        }
        .earned-btn-ghost:hover {
          border-color: rgba(31, 31, 29, 0.45);
          background-color: rgba(31, 31, 29, 0.04);
        }
        .earned-btn-primary:focus-visible,
        .earned-btn-ghost:focus-visible {
          outline: 3px solid #0085D4;
          outline-offset: 3px;
        }
        /* Gold CTAs that sit on the dark ink band: cream hard-shadow so the
           sticker lift stays visible against #1F1F1D. */
        .earned-btn-onink:hover {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #F9F3E1;
        }
        .earned-btn-onink:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0 #F9F3E1;
        }
        .earned-btn-onink:focus-visible {
          outline: 3px solid #F9F3E1;
          outline-offset: 3px;
        }
      `,
        }}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 md:px-10 py-6">
        <NavLogo />
        <div className="flex items-center gap-2 sm:gap-3">
          <Authenticated>
            <button
              onClick={() => router.push("/dashboard")}
              className="earned-btn-primary text-[14px] font-semibold px-5 py-3 min-h-[44px] rounded-[10px] transition-transform"
              style={{
                fontFamily: SANS,
                backgroundColor: C.skyDeep,
                color: C.creamLight,
                border: `2px solid ${C.ink}`,
                boxShadow: "3px 3px 0 " + C.ink,
              }}
            >
              My dashboard →
            </button>
            <UserButton
              userProfileProps={sharedUserProfileProps}
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-foreground/10",
                },
              }}
            />
          </Authenticated>
          <Unauthenticated>
            <SignInButton mode="modal">
              <button
                className="earned-btn-ghost hidden sm:inline-block text-[14px] font-semibold px-5 py-3 min-h-[44px] rounded-[10px] transition-colors"
                style={{
                  fontFamily: SANS,
                  color: C.ink,
                  border: `2px solid rgba(31,31,29,0.25)`,
                  backgroundColor: "transparent",
                }}
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="earned-btn-primary text-[14px] font-semibold px-5 py-3 min-h-[44px] rounded-[10px] transition-transform"
                style={{
                  fontFamily: SANS,
                  backgroundColor: C.skyDeep,
                  color: C.creamLight,
                  border: `2px solid ${C.ink}`,
                  boxShadow: "3px 3px 0 " + C.ink,
                }}
              >
                Join free →
              </button>
            </SignUpButton>
          </Unauthenticated>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-6 md:px-10 pt-10 sm:pt-16 pb-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <p
              className="mb-2"
              style={{ fontFamily: HAND, fontSize: 30, color: C.sky }}
            >
              today I showed up
            </p>
            <h1
              className="text-[40px] min-[375px]:text-[46px] sm:text-6xl font-extrabold leading-[1.02] tracking-tight mb-5"
              style={{ fontFamily: SANS, color: C.ink, fontWeight: 800 }}
            >
              Earn a star for every day you show up.
            </h1>
            <p
              className="text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0 mb-8"
              style={{ fontFamily: SANS, fontWeight: 400, color: "rgba(31,31,29,0.65)" }}
            >
              earned is a habit tracker that feels like your own notebook. Name
              the habits you're building, pair them with the book you're reading,
              and check them off — one page a day.
            </p>

            <Unauthenticated>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <SignUpButton mode="modal">
                  <PrimaryButton>Start my first page →</PrimaryButton>
                </SignUpButton>
                <GhostButton onClick={enterLocalMode}>
                  Track on this device →
                </GhostButton>
              </div>
              <p
                className="text-[13px] mt-4"
                style={{ fontFamily: SANS, fontWeight: 400, color: "rgba(31,31,29,0.62)" }}
              >
                Track on this device: your data stays here. No account, no cloud.
              </p>
            </Unauthenticated>
            <Authenticated>
              <div className="flex justify-center lg:justify-start">
                <PrimaryButton onClick={() => router.push("/dashboard")}>
                  Go to my dashboard →
                </PrimaryButton>
              </div>
            </Authenticated>
          </div>

          {/* Product preview */}
          <div className="relative flex justify-center lg:justify-end">
            <PreviewCard />
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* Closing band */}
      <section className="px-4 sm:px-6 md:px-10 pb-20">
        <div
          className="max-w-3xl mx-auto rounded-[16px] px-6 py-12 text-center"
          style={{
            backgroundColor: C.ink,
            boxShadow: "5px 5px 0 rgba(31,31,29,0.18)",
          }}
        >
          <div className="flex justify-center mb-4">
            <Star size={40} />
          </div>
          <h2
            className="text-[28px] sm:text-[34px] font-extrabold mb-3"
            style={{ fontFamily: SANS, fontWeight: 800, color: C.creamLight }}
          >
            The streak is the reward.
          </h2>
          <p
            className="text-[15px] mb-7 max-w-md mx-auto"
            style={{ fontFamily: SANS, fontWeight: 400, color: "rgba(244,236,216,0.7)" }}
          >
            Start today. Earn your first star before you go to bed.
          </p>
          <Unauthenticated>
            <div className="flex justify-center">
              <SignUpButton mode="modal">
                <button
                  className="earned-btn-onink px-8 py-4 min-h-[52px] text-base font-semibold rounded-[10px] transition-transform"
                  style={{
                    fontFamily: SANS,
                    backgroundColor: C.gold,
                    color: C.ink,
                    border: `2px solid ${C.creamLight}`,
                    boxShadow: "3px 3px 0 " + C.creamLight,
                  }}
                >
                  Earn my first star →
                </button>
              </SignUpButton>
            </div>
          </Unauthenticated>
          <Authenticated>
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="earned-btn-onink px-8 py-4 min-h-[52px] text-base font-semibold rounded-[10px] transition-transform"
                style={{
                  fontFamily: SANS,
                  backgroundColor: C.gold,
                  color: C.ink,
                  border: `2px solid ${C.creamLight}`,
                  boxShadow: "3px 3px 0 " + C.creamLight,
                }}
              >
                Go to my dashboard →
              </button>
            </div>
          </Authenticated>
        </div>
      </section>

      <footer className="pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4 sm:px-6 text-center border-t" style={{ borderColor: "rgba(31,31,29,0.1)" }}>
        <span
          className="text-[13px]"
          style={{ fontFamily: SANS, fontWeight: 500, color: "rgba(31,31,29,0.55)" }}
        >
          earned · made for people who show up · © 2026
        </span>
      </footer>
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    document.documentElement.style.backgroundColor = C.cream;
    document.body.style.backgroundColor = C.cream;
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <>
      <AuthLoading>
        <div
          className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center"
          style={{ backgroundColor: C.cream }}
        >
          <div
            className="animate-pulse"
            style={{ fontFamily: HAND, fontSize: 26, color: "rgba(31,31,29,0.45)" }}
          >
            opening your notebook…
          </div>
        </div>
      </AuthLoading>

      <LandingPage />
    </>
  );
}
