"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DISEASES = [
  "Type 2 Diabetes", "Coronary Heart Disease", "Ischemic Stroke", "Hypertension",
  "Clinical Obesity", "Major Depressive Disorder", "Generalized Anxiety", "Alzheimer's Disease",
  "Vascular Dementia", "Colorectal Cancer", "Breast Cancer", "Lung Cancer",
  "Osteoporosis", "Rheumatoid Arthritis", "Chronic Lower Back Pain", "Obstructive Sleep Apnea",
  "Metabolic Syndrome", "Non-Alcoholic Fatty Liver", "Chronic Kidney Disease",
  "Peripheral Artery Disease", "Deep Vein Thrombosis", "Atrial Fibrillation",
  "Congestive Heart Failure", "COPD", "Exercise-Induced Asthma Reduction", "Sarcopenia",
  "Insulin Resistance", "Systemic Chronic Inflammation", "Endometrial Cancer",
  "Pancreatic Cancer", "Gallbladder Disease", "Gout", "Fibromyalgia",
  "Chronic Fatigue Syndrome", "Erectile Dysfunction", "PCOS",
  "Preeclampsia", "Gestational Diabetes", "Age-Related Cognitive Decline",
  "Lewy Body Dementia",
];

function VerticalDiseaseScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame: number;
    let pos = 0;
    const scroll = () => {
      pos += 0.5;
      if (pos >= el.scrollHeight / 2) pos = 0;
      el.scrollTop = pos;
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="h-[500px] overflow-hidden relative"
      style={{ maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)" }}
    >
      <div>
        {[...DISEASES, ...DISEASES].map((disease, i) => (
          <div
            key={i}
            className="py-2.5 border-b border-[#1a1410]/10 flex items-baseline justify-between px-1"
          >
            <span
              className="text-[11px] tracking-[0.15em] uppercase text-[#1a1410]/30"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {String(((i % DISEASES.length) + 1)).padStart(2, "0")}
            </span>
            <span
              className="text-[15px] text-[#1a1410]/70 italic"
              style={{ fontFamily: "'Freight Display Pro', 'Playfair Display', Georgia, serif" }}
            >
              {disease}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PullQuote({ children, author }: { children: React.ReactNode; author: string }) {
  return (
    <blockquote className="relative pl-8 border-l-2 border-[#8b0000]">
      <p
        className="text-2xl md:text-3xl italic leading-relaxed text-[#1a1410]/80"
        style={{ fontFamily: "'Freight Display Pro', 'Playfair Display', Georgia, serif" }}
      >
        {children}
      </p>
      <cite
        className="not-italic text-xs tracking-[0.3em] uppercase text-[#1a1410]/40 mt-4 block"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        — {author}
      </cite>
    </blockquote>
  );
}

export default function LandingV2() {
  const router = useRouter();
  const [currentDate] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  });

  return (
    <div
      className="min-h-screen selection:bg-[#8b0000]/20 selection:text-[#8b0000]"
      style={{
        backgroundColor: "#f4efe6",
        color: "#1a1410",
        fontFamily: "'Source Serif 4', 'Crimson Pro', Georgia, serif",
      }}
    >
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,700;1,900&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,300;1,8..60,400;1,8..60,500&family=IBM+Plex+Mono:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap');
      `}</style>

      {/* Masthead */}
      <header className="border-b-2 border-[#1a1410]">
        <div className="max-w-7xl mx-auto">
          {/* Top line */}
          <div className="flex items-center justify-between px-8 py-3 border-b border-[#1a1410]/20">
            <span
              className="text-[10px] tracking-[0.3em] uppercase text-[#1a1410]/50"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Est. 2025 — Free Edition
            </span>
            <span
              className="text-[10px] tracking-[0.3em] uppercase text-[#1a1410]/50"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {currentDate}
            </span>
            <button
              onClick={() => router.push("/sign-up")}
              className="text-[10px] tracking-[0.3em] uppercase text-[#8b0000] hover:text-[#1a1410] transition-colors"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Subscribe — Free →
            </button>
          </div>

          {/* Masthead title */}
          <div className="text-center py-6 px-8">
            <h1
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              THE HARD ISSUE
            </h1>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="h-px flex-1 bg-[#1a1410]/20" />
              <span
                className="text-[10px] tracking-[0.5em] uppercase text-[#1a1410]/50"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                75 Days That Change Everything
              </span>
              <div className="h-px flex-1 bg-[#1a1410]/20" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Editorial Grid */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Lead Story */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          {/* Main column */}
          <div className="lg:col-span-7">
            <div className="mb-6">
              <span
                className="text-[10px] tracking-[0.4em] uppercase text-[#8b0000] font-medium"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Lead Feature — Neuroscience
              </span>
            </div>

            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              The Brain Region That Grows When You <em>Suffer</em>
            </h2>

            <div className="w-full h-px bg-[#1a1410]/20 mb-8" />

            <div className="columns-1 md:columns-2 gap-8 text-[15px] leading-[1.8] text-[#1a1410]/70" style={{ fontFamily: "'Source Serif 4', serif" }}>
              <p className="mb-4">
                <span className="text-5xl font-bold float-left mr-3 mt-1 leading-none text-[#1a1410]" style={{ fontFamily: "'Playfair Display', serif" }}>T</span>
                he Anterior Mid-Cingulate Cortex, or AMCC, sits deep within your brain&apos;s medial surface. For decades, neuroscientists overlooked it. Then Dr. Andrew Huberman, professor of neurobiology at Stanford University, brought it into the mainstream conversation about human willpower.
              </p>
              <p className="mb-4">
                What Huberman revealed was startling: the AMCC doesn&apos;t just correlate with willpower — it <em>physically grows</em> when you deliberately do things you don&apos;t want to do. Cold showers when you&apos;d rather stay warm. Workouts when every fiber says stop. Reading when Netflix beckons.
              </p>
              <p className="mb-4">
                Perhaps most remarkably, brain imaging studies show the AMCC is <strong>significantly larger in &ldquo;super-agers&rdquo;</strong> — people who maintain exceptional cognitive function into their 80s and 90s. It is the only brain region consistently found to be larger in those who live the longest, healthiest lives.
              </p>
              <p className="mb-4">
                The implication is profound: by voluntarily engaging in difficult behaviors, you aren&apos;t just building character in some abstract sense. You are literally building brain tissue. The 75 HARD challenge, with its six daily non-negotiable tasks, is effectively a structured AMCC growth program.
              </p>
              <p>
                Every day you complete all six tasks despite not wanting to, your AMCC strengthens. After 75 days, the neurological architecture of your willpower has been physically transformed. This isn&apos;t motivation. It&apos;s neuroscience.
              </p>
            </div>
          </div>

          {/* Sidebar column */}
          <div className="lg:col-span-5 lg:border-l lg:border-[#1a1410]/20 lg:pl-12">
            <div className="mb-10">
              <PullQuote author="Dr. Andrew Huberman, Stanford Neuroscience">
                &ldquo;The anterior mid-cingulate cortex is the one brain area that&apos;s larger in people who live longest. And it grows when we do things we don&apos;t want to do.&rdquo;
              </PullQuote>
            </div>

            <div className="border-t border-[#1a1410]/20 pt-8 mb-10">
              <span
                className="text-[10px] tracking-[0.4em] uppercase text-[#8b0000] font-medium block mb-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                The Daily Protocol
              </span>
              {[
                "Two 45-minute workouts (one outdoor)",
                "Follow a structured diet — no cheats",
                "Zero alcohol consumption",
                "One gallon of water (128 oz)",
                "Read 10 pages of non-fiction",
                "Take a daily progress photo",
              ].map((task, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-[#1a1410]/10">
                  <span
                    className="text-[10px] tracking-wider text-[#8b0000]/60 mt-1 shrink-0"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[14px] text-[#1a1410]/70" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {task}
                  </span>
                </div>
              ))}
              <p className="mt-4 text-xs text-[#8b0000]/60 italic" style={{ fontFamily: "'Source Serif 4', serif" }}>
                Miss any single task and the challenge resets to Day 1.
              </p>
            </div>

            {/* CTA Box */}
            <div className="border-2 border-[#1a1410] p-8 text-center">
              <h3
                className="text-2xl font-bold mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Free. Forever.
              </h3>
              <p className="text-sm text-[#1a1410]/60 mb-6" style={{ fontFamily: "'Source Serif 4', serif" }}>
                No subscription. No premium tier.<br />
                Your data never leaves your control.
              </p>
              <button
                onClick={() => router.push("/sign-up")}
                className="w-full py-4 bg-[#1a1410] text-[#f4efe6] text-xs tracking-[0.3em] uppercase font-medium hover:bg-[#8b0000] transition-colors duration-300"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Begin Tracking — $0
              </button>
            </div>
          </div>
        </div>

        {/* Disease Prevention Section */}
        <section className="border-t-2 border-[#1a1410] pt-12 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <span
                className="text-[10px] tracking-[0.4em] uppercase text-[#8b0000] font-medium block mb-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Health Desk — Disease Index
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold leading-tight mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                40 Diseases You Can Fight With 30 Minutes
              </h2>
              <p className="text-[15px] text-[#1a1410]/60 leading-relaxed mb-6" style={{ fontFamily: "'Source Serif 4', serif" }}>
                Medical research consistently demonstrates that just 30 minutes of moderate daily exercise can significantly reduce the risk of the following conditions. The 75 HARD challenge demands 90 minutes — double the minimum dose.
              </p>
              <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#1a1410]/30" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <div className="w-2 h-2 rounded-full bg-[#8b0000]/40" />
                Auto-scrolling index — 40 conditions
              </div>
            </div>

            <div className="lg:col-span-8 lg:border-l lg:border-[#1a1410]/20 lg:pl-12">
              <VerticalDiseaseScroll />
            </div>
          </div>
        </section>

        {/* Why 75 Proof Strip */}
        <section className="border-t border-[#1a1410]/20 pt-12 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-[#1a1410]/20">
            {[
              {
                headline: "Your Data, Your Vault",
                body: "Every check-in, every photo, every stat lives on your terms. We don't sell. We don't share. We don't even peek.",
              },
              {
                headline: "Elegantly Simple",
                body: "Open. Tap what you've done. Close. That's it. No gamification bloat, no social pressure tactics. Just honest tracking.",
              },
              {
                headline: "Zero Cost, Zero Catch",
                body: "Free isn't a trial period. There is no premium version. 75 Proof is and will remain completely free.",
              },
            ].map((col, i) => (
              <div key={i} className="px-8 py-6 first:pl-0 last:pr-0">
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {col.headline}
                </h3>
                <p className="text-sm text-[#1a1410]/60 leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif" }}>
                  {col.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t-2 border-[#1a1410] pt-16 pb-12 text-center">
          <h2
            className="text-4xl md:text-6xl font-bold leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            The Hardest Part<br />
            Is <em>Starting</em>.
          </h2>
          <p className="text-lg text-[#1a1410]/50 mb-10" style={{ fontFamily: "'Source Serif 4', serif" }}>
            Everything else is just showing up.
          </p>
          <button
            onClick={() => router.push("/sign-up")}
            className="px-16 py-5 bg-[#1a1410] text-[#f4efe6] text-xs tracking-[0.3em] uppercase font-medium hover:bg-[#8b0000] transition-colors duration-300"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Start Day 1 — It&apos;s Free
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1410]/20 py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span
            className="text-[10px] tracking-[0.3em] uppercase text-[#1a1410]/30"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            75 Proof © 2025
          </span>
          <span
            className="text-[10px] tracking-[0.3em] uppercase text-[#1a1410]/30"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            All the news that&apos;s fit to track
          </span>
        </div>
      </footer>
    </div>
  );
}
