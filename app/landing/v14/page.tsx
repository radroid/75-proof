"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DISEASES = [
  "Type 2 Diabetes", "Heart Disease", "Stroke", "Hypertension", "Obesity",
  "Depression", "Anxiety", "Alzheimer's", "Dementia", "Colon Cancer",
  "Breast Cancer", "Osteoporosis", "Arthritis", "Chronic Pain", "Sleep Apnea",
  "Metabolic Syndrome", "Fatty Liver", "Kidney Disease", "Heart Failure",
  "COPD", "Sarcopenia", "Insulin Resistance", "Inflammation", "Gout",
  "Fibromyalgia", "Chronic Fatigue", "Cognitive Decline", "PCOS",
  "Gestational Diabetes", "Lung Cancer", "Pancreatic Cancer",
  "Endometrial Cancer", "Gallbladder Disease", "Blood Clots",
  "Artery Disease", "Preeclampsia", "Erectile Dysfunction",
  "Vascular Dementia", "Asthma", "Muscle Wasting",
];

function TiltCard({ children, className = "", rotate = "2deg" }: { children: React.ReactNode; className?: string; rotate?: string }) {
  return (
    <div
      className={`relative transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ transform: `rotate(${rotate})` }}
    >
      {children}
    </div>
  );
}

function StickerTag({ text, color, className = "" }: { text: string; color: string; className?: string }) {
  return (
    <span
      className={`inline-block px-4 py-1.5 rounded-full text-[13px] font-bold ${className}`}
      style={{ backgroundColor: color, fontFamily: "'Space Mono', monospace" }}
    >
      {text}
    </span>
  );
}

function NewspaperClipping() {
  return (
    <div
      className="bg-[#f4efe6] text-[#1a1410] p-8 md:p-10 border border-[#1a1410]/15"
      style={{ transform: "rotate(-0.5deg)", boxShadow: "4px 4px 0 rgba(0,0,0,0.1)" }}
    >
      {/* Masthead */}
      <div className="border-b-2 border-[#1a1410] pb-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-wider text-[#1a1410]/40" style={{ fontFamily: "'Space Mono', monospace" }}>
            HEALTH DESK
          </span>
          <span className="text-[10px] tracking-wider text-[#1a1410]/40" style={{ fontFamily: "'Space Mono', monospace" }}>
            SPECIAL REPORT
          </span>
        </div>
        <h3
          className="text-3xl md:text-4xl font-bold text-center mt-2 tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          THE EXERCISE EFFECT
        </h3>
        <div className="flex items-center justify-center gap-3 mt-1">
          <div className="h-px flex-1 bg-[#1a1410]/20" />
          <span className="text-[9px] tracking-widest uppercase text-[#1a1410]/40" style={{ fontFamily: "'Space Mono', monospace" }}>
            40 Diseases · 30 Minutes · 1 Decision
          </span>
          <div className="h-px flex-1 bg-[#1a1410]/20" />
        </div>
      </div>

      {/* Two column newspaper content */}
      <div className="columns-1 md:columns-2 gap-8 mb-6">
        <p
          className="text-[14px] leading-[1.85] text-[#1a1410]/65 mb-4"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
        >
          <span className="text-4xl font-bold float-left mr-2 mt-1 leading-none text-[#1a1410]"
            style={{ fontFamily: "'Playfair Display', serif" }}>R</span>
          esearch across hundreds of peer-reviewed studies confirms what doctors have known
          for decades: just 30 minutes of moderate exercise per day dramatically reduces
          the risk of the most prevalent chronic diseases of our time.
        </p>
        <p
          className="text-[14px] leading-[1.85] text-[#1a1410]/65 mb-4"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
        >
          From cardiovascular disease and Type 2 diabetes to depression, Alzheimer&apos;s,
          and multiple forms of cancer, the protective effect of regular movement is
          robust, dose-dependent, and accessible to people of every age and fitness level.
        </p>
        <p
          className="text-[14px] leading-[1.85] text-[#1a1410]/65"
          style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
        >
          The 75 HARD protocol requires 90 minutes of daily exercise — triple the
          minimum effective dose. Participants are essentially administering a
          pharmaceutical-grade intervention through movement alone.
        </p>
      </div>

      {/* Disease list in newspaper style */}
      <div className="border-t border-[#1a1410]/15 pt-4">
        <span className="text-[9px] tracking-widest uppercase text-[#1a1410]/30 block mb-3"
          style={{ fontFamily: "'Space Mono', monospace" }}>
          CONDITIONS WITH REDUCED RISK FROM DAILY EXERCISE
        </span>
        <div className="flex flex-wrap gap-1.5">
          {DISEASES.map((d, i) => (
            <span
              key={d}
              className="text-[11px] text-[#1a1410]/50 leading-tight"
              style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
            >
              {d}{i < DISEASES.length - 1 ? " · " : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingV14() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen overflow-x-hidden selection:bg-[#FF6154]/20"
      style={{ backgroundColor: "#FFFBF0", color: "#1a1a1a" }}
    >
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700;800;900&family=Caveat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

        @keyframes tape-wiggle {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(1deg); }
        }
      `}</style>

      {/* Scotch tape nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-6">
        <span className="flex items-center gap-2 text-xl font-black" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <img src="/logo.svg" alt="75 Proof" width={28} height={28} />
          75 Proof
        </span>
        <button
          onClick={() => router.push("/sign-up")}
          className="text-[13px] font-bold px-6 py-3 bg-[#FF6154] text-white rounded-none hover:bg-[#e5534b] transition-all"
          style={{
            fontFamily: "'Space Mono', monospace",
            transform: "rotate(1deg)",
          }}
        >
          JOIN FREE →
        </button>
      </nav>

      {/* Hero — collage style */}
      <section className="relative z-10 px-6 md:px-10 pt-10 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Sticker tags scattered */}
          <div className="flex flex-wrap gap-3 mb-8">
            <StickerTag text="FREE!" color="#FFE66D" className="text-[#1a1a1a]" />
            <StickerTag text="PRIVATE" color="#4ECDC4" className="text-white" />
            <StickerTag text="NO ADS" color="#FF6154" className="text-white" />
            <StickerTag text="YOUR DATA" color="#A78BFA" className="text-white" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <h1
                className="text-6xl sm:text-7xl md:text-8xl font-black leading-[0.95] tracking-tight mb-6"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Do Hard
                <br />
                <span className="text-[#FF6154]">Stuff.</span>
                <br />
                Feel{" "}
                <span
                  className="relative inline-block"
                  style={{ transform: "rotate(-3deg)" }}
                >
                  <span className="relative z-10 text-[#4ECDC4]">Amazing.</span>
                  <span
                    className="absolute bottom-1 left-0 right-0 h-4 bg-[#4ECDC4]/20 -z-0"
                    style={{ transform: "rotate(1deg)" }}
                  />
                </span>
              </h1>

              <p
                className="text-lg text-[#1a1a1a]/55 leading-relaxed max-w-lg mb-10"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
              >
                The 75 HARD challenge is intense. But it&apos;s also the most rewarding thing
                you&apos;ll ever do. Track every win with 75 Proof — the free app that
                celebrates your commitment without spying on your data.
              </p>

              <button
                onClick={() => router.push("/sign-up")}
                className="px-10 py-5 bg-[#1a1a1a] text-white text-lg font-black hover:bg-[#FF6154] transition-all duration-300"
                style={{ fontFamily: "'DM Sans', sans-serif", transform: "rotate(-1deg)" }}
              >
                Let&apos;s DO This →
              </button>
            </div>

            {/* Tilted cards on right */}
            <div className="lg:col-span-5 space-y-4 pt-4">
              <TiltCard rotate="-2deg">
                <div className="bg-[#FF6154] text-white p-6 rounded-sm">
                  <span className="text-4xl font-black block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>75</span>
                  <span className="text-[14px] font-bold opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
                    days of proving yourself
                  </span>
                </div>
              </TiltCard>
              <TiltCard rotate="1.5deg">
                <div className="bg-[#4ECDC4] text-white p-6 rounded-sm">
                  <span className="text-4xl font-black block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>6</span>
                  <span className="text-[14px] font-bold opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
                    tasks every single day
                  </span>
                </div>
              </TiltCard>
              <TiltCard rotate="-1deg">
                <div className="bg-[#FFE66D] text-[#1a1a1a] p-6 rounded-sm">
                  <span className="text-4xl font-black block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>$0</span>
                  <span className="text-[14px] font-bold opacity-60" style={{ fontFamily: "'Space Mono', monospace" }}>
                    free forever, no catches
                  </span>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* The Daily Six — zine layout */}
      <section className="relative z-10 py-20 px-6 md:px-10 bg-[#1a1a1a] text-white" style={{ transform: "rotate(-0.3deg)" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-4xl md:text-6xl font-black mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            THE DAILY SIX
          </h2>
          <div
            className="text-lg text-white/40 mb-12"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 600 }}
          >
            ← every single day, no exceptions, for 75 days →
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10">
            {[
              { num: "01", title: "TWO WORKOUTS", desc: "45 min each. One outdoors. Yes, even in the rain.", accent: "#FF6154" },
              { num: "02", title: "FOLLOW A DIET", desc: "You choose. No alcohol. No cheat meals. Commit.", accent: "#4ECDC4" },
              { num: "03", title: "DRINK 128 OZ", desc: "One gallon of water. Every. Single. Day.", accent: "#FFE66D" },
              { num: "04", title: "READ 10 PAGES", desc: "Non-fiction. No audiobooks. Old school brain food.", accent: "#A78BFA" },
              { num: "05", title: "PROGRESS PHOTO", desc: "Snap it. Document the journey. Future you will cry.", accent: "#FF6B9D" },
              { num: "06", title: "NO MISSES", desc: "Skip one task? Day 1. Again. That's the whole point.", accent: "#ef4444" },
            ].map((task) => (
              <div
                key={task.num}
                className="p-6 border border-white/5 hover:bg-white/5 transition-colors group"
              >
                <span
                  className="text-[11px] font-bold block mb-3"
                  style={{ fontFamily: "'Space Mono', monospace", color: task.accent }}
                >
                  {task.num}
                </span>
                <h3
                  className="text-lg font-black mb-2"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {task.title}
                </h3>
                <p
                  className="text-[14px] text-white/45 leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
                >
                  {task.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AMCC Section — handwritten energy */}
      <section className="relative z-10 py-20 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div>
              <StickerTag text="BRAIN SCIENCE" color="#A78BFA" className="text-white mb-6 inline-block" />
              <h2
                className="text-4xl md:text-5xl font-black leading-[1.1] mb-8"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Your willpower is a{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-[#FF6154]">muscle</span>
                  <span className="absolute bottom-0 left-0 right-0 h-3 bg-[#FF6154]/15 -z-0" style={{ transform: "rotate(1deg)" }} />
                </span>
                .
                <br />
                <span
                  className="text-[#1a1a1a]/40"
                  style={{ fontFamily: "'Caveat', cursive", fontWeight: 600 }}
                >
                  (literally, though!)
                </span>
              </h2>

              <div
                className="text-[17px] text-[#1a1a1a]/55 leading-[1.85] space-y-5"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
              >
                <p>
                  Neuroscientist <strong className="text-[#1a1a1a]">Dr. Andrew Huberman</strong> from Stanford
                  found that your brain&apos;s{" "}
                  <strong className="text-[#1a1a1a]">Anterior Mid-Cingulate Cortex (AMCC)</strong>{" "}
                  grows when you do difficult things on purpose.
                </p>
                <p>
                  Not metaphorically. <strong className="text-[#1a1a1a]">Physically grows.</strong>{" "}
                  Like a muscle after a workout. Every time you push through something you wanted to quit,
                  your AMCC builds new neural tissue.
                </p>
                <p>
                  And people with the biggest AMCCs? They&apos;re called &ldquo;super-agers&rdquo; — they live
                  the longest and stay the sharpest. It&apos;s the{" "}
                  <strong className="text-[#1a1a1a]">only brain region</strong> consistently linked to
                  longevity + cognitive health.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <TiltCard rotate="1deg">
                <div className="bg-[#FFE66D] p-6 rounded-sm">
                  <p
                    className="text-[18px] text-[#1a1a1a]/70 italic leading-[1.7] mb-3"
                    style={{ fontFamily: "'Caveat', cursive", fontWeight: 600, fontSize: "22px" }}
                  >
                    &ldquo;The AMCC grows when we do things we don&apos;t want to do.
                    It&apos;s larger in people who live longest.&rdquo;
                  </p>
                  <span className="text-[12px] font-bold text-[#1a1a1a]/40" style={{ fontFamily: "'Space Mono', monospace" }}>
                    — Dr. Andrew Huberman, Stanford
                  </span>
                </div>
              </TiltCard>

              <TiltCard rotate="-1.5deg">
                <div className="bg-[#4ECDC4] text-white p-6 rounded-sm">
                  <span className="text-4xl font-black block mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>75 HARD</span>
                  <span className="text-[14px] font-bold opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
                    = 75-day AMCC training program
                  </span>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* Newspaper clipping section */}
      <section className="relative z-10 py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div
            className="text-center mb-8"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 600 }}
          >
            <span className="text-xl text-[#1a1a1a]/40">↓ ripped straight from the research ↓</span>
          </div>
          <NewspaperClipping />
        </div>
      </section>

      {/* Why 75 Proof */}
      <section className="relative z-10 py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center mb-14"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Why You&apos;ll
            <span className="relative inline-block mx-2">
              <span className="relative z-10 text-[#FF6154]">love</span>
              <span className="absolute bottom-0 left-0 right-0 h-3 bg-[#FF6154]/15 -z-0" style={{ transform: "rotate(-1deg)" }} />
            </span>
            this app
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { color: "#FF6154", title: "Free means free", body: "No trials. No premium. No \"just $9.99/month.\" We built this for the community. It costs you nothing.", text: "white" },
              { color: "#FFFBF0", title: "Your data stays put", body: "We don't sell your habits or your progress photos. Your information is yours. Period. Full stop.", text: "#1a1a1a", border: true },
              { color: "#4ECDC4", title: "Stupidly simple", body: "Open. Tap what you did. Done. No tutorials, no onboarding flows, no \"engagement\" tricks. Just tracking.", text: "white" },
            ].map((card) => (
              <TiltCard key={card.title} rotate={`${(Math.random() - 0.5) * 4}deg`}>
                <div
                  className="p-7 rounded-sm"
                  style={{
                    backgroundColor: card.color,
                    color: card.text,
                    border: card.border ? "2px solid #1a1a1a15" : "none",
                  }}
                >
                  <h3
                    className="text-xl font-black mb-3"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-[15px] leading-relaxed opacity-70"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
                  >
                    {card.body}
                  </p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6 md:px-10 text-center">
        <h2
          className="text-5xl md:text-7xl font-black leading-[0.95] mb-6"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Stop
          <br />
          <span className="text-[#4ECDC4]">overthinking</span>
          <br />
          it.
        </h2>
        <p
          className="text-lg text-[#1a1a1a]/40 mb-10"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
        >
          Day 1 starts when you decide it does.
        </p>
        <button
          onClick={() => router.push("/sign-up")}
          className="px-14 py-6 bg-[#FF6154] text-white text-xl font-black hover:scale-105 active:scale-95 transition-all"
          style={{ fontFamily: "'DM Sans', sans-serif", transform: "rotate(-1deg)" }}
        >
          START NOW — FREE
        </button>
      </section>

      <footer className="border-t border-[#1a1a1a]/8 py-6 px-6 text-center">
        <span className="text-[13px] text-[#1a1a1a]/25 font-bold" style={{ fontFamily: "'Space Mono', monospace" }}>
          75 Proof © 2025 — Cut out, tape up, get to work
        </span>
      </footer>
    </div>
  );
}
