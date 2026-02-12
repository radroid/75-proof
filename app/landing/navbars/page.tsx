"use client";

import { useState } from "react";

/* ============================================================
   NAVBAR V1 — "Glass Pill"
   Floating frosted-glass capsule, detached from edges.
   Active tab gets a soft filled circle. Apple Dynamic Island energy.
   ============================================================ */
function NavV1({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  const tabs = [
    { label: "Today", icon: (a: boolean) => <IconGrid a={a} /> },
    { label: "Progress", icon: (a: boolean) => <IconTrend a={a} /> },
    { label: "Friends", icon: (a: boolean) => <IconPeople a={a} /> },
    { label: "Settings", icon: (a: boolean) => <IconGear a={a} /> },
  ];
  return (
    <div className="absolute bottom-4 left-3 right-3">
      <nav
        className="flex justify-around items-center h-[58px] rounded-[22px]"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06)",
        }}
      >
        {tabs.map((tab, i) => {
          const isActive = active === i;
          return (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className="flex flex-col items-center justify-center gap-[3px] relative cursor-pointer transition-all duration-200"
              style={{ minWidth: 64, minHeight: 44 }}
            >
              {isActive && (
                <div
                  className="absolute inset-0 m-auto rounded-2xl transition-all duration-300"
                  style={{
                    width: 52,
                    height: 44,
                    background: "rgba(37,99,235,0.1)",
                  }}
                />
              )}
              <div className="relative z-10">{tab.icon(isActive)}</div>
              <span
                className="relative z-10 leading-none transition-colors duration-200"
                style={{
                  fontSize: 10,
                  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#2563eb" : "#9ca3af",
                  letterSpacing: "0.01em",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================================================
   NAVBAR V2 — "Ink & Paper"
   Zine/collage aesthetic matching v14. Cream bg, hand-stamped active
   state, Space Mono labels, slightly tilted elements. Raw, editorial.
   ============================================================ */
function NavV2({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  const tabs = [
    { label: "TODAY", icon: (a: boolean) => <IconGrid a={a} /> },
    { label: "STATS", icon: (a: boolean) => <IconTrend a={a} /> },
    { label: "CREW", icon: (a: boolean) => <IconPeople a={a} /> },
    { label: "PREFS", icon: (a: boolean) => <IconGear a={a} /> },
  ];
  const accents = ["#FF6154", "#4ECDC4", "#A78BFA", "#FFE66D"];
  return (
    <div className="absolute bottom-0 left-0 right-0">
      <nav
        className="flex justify-around items-end h-[62px] px-1"
        style={{
          background: "#FFFBF0",
          borderTop: "2px solid #1a1a1a",
        }}
      >
        {tabs.map((tab, i) => {
          const isActive = active === i;
          return (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className="flex flex-col items-center justify-center gap-[2px] relative cursor-pointer py-1.5"
              style={{
                minWidth: 64,
                minHeight: 44,
                transform: isActive ? `rotate(${i % 2 === 0 ? -2 : 2}deg)` : "none",
                transition: "transform 0.2s ease",
              }}
            >
              {isActive && (
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: `2.5px solid ${accents[i]}`,
                    background: `${accents[i]}15`,
                    transform: `rotate(${i % 2 === 0 ? 3 : -3}deg)`,
                  }}
                />
              )}
              <div className="relative z-10" style={{ color: isActive ? "#1a1a1a" : "#1a1a1a60" }}>
                {tab.icon(isActive)}
              </div>
              <span
                className="relative z-10"
                style={{
                  fontSize: 9,
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                  color: isActive ? "#1a1a1a" : "#1a1a1a40",
                  letterSpacing: "0.08em",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================================================
   NAVBAR V3 — "Neon Arcade"
   Dark theme, v13 arcade-inspired. Glowing underline on active tab,
   score counter in center, pixel energy.
   ============================================================ */
function NavV3({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  const tabs = [
    { label: "TODAY", icon: (a: boolean) => <IconGrid a={a} />, glow: "#4ade80" },
    { label: "STATS", icon: (a: boolean) => <IconTrend a={a} />, glow: "#facc15" },
    { label: "CREW", icon: (a: boolean) => <IconPeople a={a} />, glow: "#c084fc" },
    { label: "PREFS", icon: (a: boolean) => <IconGear a={a} />, glow: "#60a5fa" },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0">
      <nav
        className="flex justify-around items-center h-[60px] px-2"
        style={{
          background: "#0f0b1a",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {tabs.map((tab, i) => {
          const isActive = active === i;
          return (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className="flex flex-col items-center justify-center gap-1 relative cursor-pointer"
              style={{ minWidth: 64, minHeight: 44 }}
            >
              <div style={{ color: isActive ? tab.glow : "rgba(255,255,255,0.3)" }}>
                {tab.icon(isActive)}
              </div>
              <span
                style={{
                  fontSize: 8.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: isActive ? tab.glow : "rgba(255,255,255,0.25)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="absolute -bottom-0 left-1/2 -translate-x-1/2"
                  style={{
                    width: 24,
                    height: 3,
                    borderRadius: 2,
                    background: tab.glow,
                    boxShadow: `0 0 8px ${tab.glow}, 0 0 20px ${tab.glow}50`,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================================================
   NAVBAR V4 — "Whisper Dot"
   Ultra-minimal. White bg, barely-there top line. Only a tiny dot
   marks the active tab. No labels by default — label fades in on active.
   Elegant restraint.
   ============================================================ */
function NavV4({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  const tabs = [
    { label: "Today", icon: (a: boolean) => <IconGrid a={a} /> },
    { label: "Progress", icon: (a: boolean) => <IconTrend a={a} /> },
    { label: "Friends", icon: (a: boolean) => <IconPeople a={a} /> },
    { label: "Settings", icon: (a: boolean) => <IconGear a={a} /> },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0">
      <nav
        className="flex justify-around items-center h-[54px]"
        style={{
          background: "#ffffff",
          borderTop: "0.5px solid #e5e7eb",
        }}
      >
        {tabs.map((tab, i) => {
          const isActive = active === i;
          return (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className="flex flex-col items-center justify-center gap-1.5 relative cursor-pointer"
              style={{ minWidth: 64, minHeight: 44 }}
            >
              <div style={{ color: isActive ? "#111" : "#d1d5db" }}>
                {tab.icon(isActive)}
              </div>
              <div
                className="transition-all duration-300 overflow-hidden"
                style={{
                  maxHeight: isActive ? 12 : 0,
                  opacity: isActive ? 1 : 0,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    color: "#111",
                    letterSpacing: "0.02em",
                  }}
                >
                  {tab.label}
                </span>
              </div>
              {isActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#111",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================================================
   NAVBAR V5 — "Raised Center"
   Classic raised center-action pattern. The primary action (Today)
   is elevated with a gradient circle. Flanking tabs are standard.
   Bold, app-native, confident.
   ============================================================ */
function NavV5({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  const sideTabs = [
    { label: "Progress", icon: (a: boolean) => <IconTrend a={a} />, idx: 1 },
    { label: "Friends", icon: (a: boolean) => <IconPeople a={a} />, idx: 2 },
  ];
  const rightTabs = [
    { label: "Settings", icon: (a: boolean) => <IconGear a={a} />, idx: 3 },
  ];
  const isCenter = active === 0;

  return (
    <div className="absolute bottom-0 left-0 right-0">
      <nav
        className="flex justify-around items-end h-[62px] relative"
        style={{
          background: "#fafafa",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        {/* Left tabs */}
        {sideTabs.map((tab) => {
          const isActive = active === tab.idx;
          return (
            <button
              key={tab.label}
              onClick={() => setActive(tab.idx)}
              className="flex flex-col items-center justify-center gap-[3px] cursor-pointer pb-1.5"
              style={{ minWidth: 64, minHeight: 44 }}
            >
              <div style={{ color: isActive ? "#2563eb" : "#9ca3af" }}>
                {tab.icon(isActive)}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#2563eb" : "#9ca3af",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center raised button */}
        <button
          onClick={() => setActive(0)}
          className="flex flex-col items-center justify-center cursor-pointer relative -mt-5"
          style={{ minWidth: 64 }}
        >
          <div
            className="flex items-center justify-center transition-transform duration-200"
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: isCenter
                ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                : "linear-gradient(135deg, #e5e7eb, #d1d5db)",
              boxShadow: isCenter
                ? "0 4px 14px rgba(37,99,235,0.35), 0 0 0 4px #fafafa"
                : "0 2px 8px rgba(0,0,0,0.08), 0 0 0 4px #fafafa",
              transform: isCenter ? "scale(1)" : "scale(0.92)",
              color: isCenter ? "#fff" : "#9ca3af",
            }}
          >
            <IconGrid a={isCenter} />
          </div>
          <span
            className="mt-[3px]"
            style={{
              fontSize: 10,
              fontWeight: isCenter ? 600 : 500,
              color: isCenter ? "#2563eb" : "#9ca3af",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Today
          </span>
        </button>

        {/* Right tab */}
        {rightTabs.map((tab) => {
          const isActive = active === tab.idx;
          return (
            <button
              key={tab.label}
              onClick={() => setActive(tab.idx)}
              className="flex flex-col items-center justify-center gap-[3px] cursor-pointer pb-1.5"
              style={{ minWidth: 64, minHeight: 44 }}
            >
              <div style={{ color: isActive ? "#2563eb" : "#9ca3af" }}>
                {tab.icon(isActive)}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#2563eb" : "#9ca3af",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================================================
   ICON COMPONENTS — inline SVG, no external deps
   ============================================================ */
function IconGrid({ a }: { a: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconTrend({ a }: { a: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconPeople({ a }: { a: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconGear({ a }: { a: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ============================================================
   PHONE MOCKUP FRAME
   ============================================================ */
function PhoneMockup({
  children,
  label,
  sublabel,
  bg,
}: {
  children: React.ReactNode;
  label: string;
  sublabel: string;
  bg: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div>
        <h3 className="text-lg font-bold text-white">{label}</h3>
        <p className="text-sm text-white/50">{sublabel}</p>
      </div>
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          width: 280,
          height: 560,
          borderRadius: 36,
          border: "6px solid #2a2a2a",
          background: bg,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <span style={{ fontSize: 12, fontWeight: 600, color: bg === "#0f0b1a" ? "rgba(255,255,255,0.7)" : "#111" }}>
            9:41
          </span>
          <div className="flex items-center gap-1">
            <div style={{ width: 14, height: 10, borderRadius: 2, border: `1px solid ${bg === "#0f0b1a" ? "rgba(255,255,255,0.3)" : "#999"}` }}>
              <div style={{ width: 9, height: 6, borderRadius: 1, margin: "1px", background: bg === "#0f0b1a" ? "rgba(255,255,255,0.5)" : "#333" }} />
            </div>
          </div>
        </div>

        {/* Mock content area */}
        <div className="px-5 pt-4">
          <MockContent dark={bg === "#0f0b1a"} />
        </div>

        {/* Navbar */}
        {children}

        {/* Home indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2"
          style={{
            width: 100,
            height: 4,
            borderRadius: 2,
            background: bg === "#0f0b1a" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
          }}
        />
      </div>
    </div>
  );
}

function MockContent({ dark }: { dark: boolean }) {
  const fg = dark ? "rgba(255,255,255," : "rgba(0,0,0,";
  return (
    <>
      <div className="flex items-baseline gap-2 mb-4">
        <span style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: `${fg}0.9)`, fontFamily: "'DM Sans', sans-serif" }}>22</span>
        <span style={{ fontSize: 18, fontWeight: 400, color: `${fg}0.25)` }}>/75</span>
      </div>
      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 3, background: `${fg}0.06)`, marginBottom: 20 }}>
        <div style={{ width: "29%", height: "100%", borderRadius: 3, background: dark ? "#4ade80" : "#2563eb" }} />
      </div>
      {/* Task cards */}
      {[0.85, 0.7, 0.55, 0.4].map((o, i) => (
        <div
          key={i}
          className="mb-3"
          style={{
            height: 52,
            borderRadius: 10,
            background: `${fg}${dark ? "0.08" : "0.03"})`,
            border: `1px solid ${fg}0.06)`,
          }}
        />
      ))}
    </>
  );
}

/* ============================================================
   SHOWCASE PAGE
   ============================================================ */
export default function NavbarShowcase() {
  const [a1, sa1] = useState(0);
  const [a2, sa2] = useState(0);
  const [a3, sa3] = useState(0);
  const [a4, sa4] = useState(0);
  const [a5, sa5] = useState(0);

  return (
    <div
      className="min-h-screen px-6 py-16"
      style={{
        background: "linear-gradient(145deg, #0a0a0a 0%, #171717 50%, #0a0a0a 100%)",
      }}
    >
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1
            className="text-4xl md:text-5xl font-black text-white mb-3"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Mobile Navbar Designs
          </h1>
          <p className="text-white/40 text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Tap the icons to see active states in action
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10">
          <PhoneMockup label="V1 — Glass Pill" sublabel="Floating frosted capsule" bg="#f8f9fa">
            <NavV1 active={a1} setActive={sa1} />
          </PhoneMockup>

          <PhoneMockup label="V2 — Ink & Paper" sublabel="Zine / collage editorial" bg="#FFFBF0">
            <NavV2 active={a2} setActive={sa2} />
          </PhoneMockup>

          <PhoneMockup label="V3 — Neon Arcade" sublabel="Dark theme, glowing tabs" bg="#0f0b1a">
            <NavV3 active={a3} setActive={sa3} />
          </PhoneMockup>

          <PhoneMockup label="V4 — Whisper Dot" sublabel="Ultra-minimal, label reveals" bg="#ffffff">
            <NavV4 active={a4} setActive={sa4} />
          </PhoneMockup>

          <PhoneMockup label="V5 — Raised Center" sublabel="Elevated primary action" bg="#fafafa">
            <NavV5 active={a5} setActive={sa5} />
          </PhoneMockup>
        </div>
      </div>
    </div>
  );
}
