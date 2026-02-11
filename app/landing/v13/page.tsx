"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DISEASES = [
  "TYPE 2 DIABETES", "HEART DISEASE", "STROKE", "HYPERTENSION", "OBESITY",
  "DEPRESSION", "ANXIETY", "ALZHEIMERS", "DEMENTIA", "COLON CANCER",
  "BREAST CANCER", "OSTEOPOROSIS", "ARTHRITIS", "CHRONIC PAIN", "SLEEP APNEA",
  "METABOLIC SYNDROME", "FATTY LIVER", "KIDNEY DISEASE", "HEART FAILURE",
  "COPD", "SARCOPENIA", "INSULIN RESISTANCE", "INFLAMMATION", "GOUT",
  "FIBROMYALGIA", "CHRONIC FATIGUE", "COGNITIVE DECLINE", "PCOS",
  "GESTATIONAL DIABETES", "LUNG CANCER", "PANCREATIC CANCER",
  "ENDOMETRIAL CANCER", "GALLBLADDER DISEASE", "BLOOD CLOTS",
  "ARTERY DISEASE", "PREECLAMPSIA", "ERECTILE DYSFUNCTION",
  "VASCULAR DEMENTIA", "ASTHMA", "MUSCLE WASTING",
];

function ArcadeBlock({ children, color, className = "" }: { children: React.ReactNode; color: string; className?: string }) {
  return (
    <div
      className={`relative rounded-2xl p-6 ${className}`}
      style={{
        backgroundColor: color,
        boxShadow: `0 6px 0 ${color}99, 0 8px 20px ${color}40`,
      }}
    >
      {children}
    </div>
  );
}

function LevelBar({ level, maxLevel, label }: { level: number; maxLevel: number; label: string }) {
  const pct = (level / maxLevel) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-bold text-white/80" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          {label}
        </span>
        <span className="text-[11px] font-bold text-[#FFE66D]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          {level}/{maxLevel}
        </span>
      </div>
      <div className="h-5 bg-white/10 rounded-lg overflow-hidden border-2 border-white/10">
        <div
          className="h-full rounded-md transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #4ECDC4, #58D68D, #FFE66D)",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,0.3)",
          }}
        />
      </div>
    </div>
  );
}

function DiseaseGrid() {
  const [defeated, setDefeated] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {DISEASES.map((disease, i) => {
        const isDefeated = defeated.has(i);
        const colors = ["#FF6B9D", "#4ECDC4", "#FFE66D", "#A78BFA", "#FF8A5C", "#58D68D"];
        const color = colors[i % colors.length];
        return (
          <button
            key={disease}
            onClick={() => setDefeated(prev => new Set(prev).add(i))}
            className={`
              relative px-2 py-3 rounded-xl text-[10px] font-bold text-center transition-all duration-300 cursor-pointer
              ${isDefeated
                ? "bg-[#58D68D]/20 text-[#58D68D] scale-95"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:scale-105 border border-white/5"
              }
            `}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              opacity: visible ? 1 : 0,
              transitionDelay: `${i * 20}ms`,
            }}
          >
            {isDefeated && (
              <span className="absolute -top-1 -right-1 text-sm">💥</span>
            )}
            <span className="block text-[8px] leading-tight">{disease}</span>
            {!isDefeated && (
              <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "100%", backgroundColor: color, opacity: 0.5 }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function LandingV13() {
  const router = useRouter();
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScore(prev => {
        if (prev >= 7500) { clearInterval(interval); return 7500; }
        return prev + Math.floor(Math.random() * 150) + 50;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1035] text-white overflow-x-hidden selection:bg-[#A78BFA]/30">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rubik:wght@400;500;600;700;800;900&display=swap');

        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes pixel-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes score-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Pixel grid bg */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(167,139,250,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167,139,250,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-[#FFE66D]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            75PROOF
          </span>
          <span className="text-[9px] text-white/30" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            v1.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-[9px] text-[#4ECDC4]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            FREE PLAY
          </span>
          <button
            onClick={() => router.push("/sign-up")}
            className="text-[10px] font-bold px-5 py-3 bg-[#FF6B9D] text-white rounded-xl hover:bg-[#e85a8a] transition-all"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: "0 4px 0 #c44b78",
            }}
          >
            PLAY
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-16 pb-24 px-6 md:px-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Score counter */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 mb-8">
            <span className="text-[9px] text-white/40" style={{ fontFamily: "'Press Start 2P', monospace" }}>SCORE</span>
            <span
              className="text-[14px] text-[#FFE66D] font-bold tabular-nums"
              style={{ fontFamily: "'Press Start 2P', monospace", animation: "score-pop 0.5s ease-out" }}
            >
              {score.toLocaleString()}
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6"
            style={{ fontFamily: "'Rubik', sans-serif" }}
          >
            Level Up Your
            <br />
            <span className="text-[#FFE66D]">Real</span>{" "}
            <span className="text-[#4ECDC4]">Life</span>
          </h1>

          <p
            className="text-[16px] text-white/50 max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 400 }}
          >
            75 HARD is the ultimate IRL challenge. Six daily quests. 75 days.
            No save points. Track your run with 75 Proof — free, private, and fun.
          </p>

          <button
            onClick={() => router.push("/sign-up")}
            className="px-10 py-5 bg-[#4ECDC4] text-[#1a1035] text-[12px] font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: "0 6px 0 #3ba9a2, 0 8px 20px rgba(78,205,196,0.3)",
            }}
          >
            ▶ START GAME
          </button>

          {/* Level bars preview */}
          <div className="max-w-md mx-auto mt-16 space-y-4" style={{ animation: "float-slow 6s ease-in-out infinite" }}>
            <ArcadeBlock color="#2a1f4e" className="border border-white/5">
              <div className="space-y-4">
                <LevelBar level={37} maxLevel={75} label="DAY" />
                <LevelBar level={4} maxLevel={6} label="TASKS" />
                <LevelBar level={96} maxLevel={128} label="WATER" />
              </div>
            </ArcadeBlock>
          </div>
        </div>
      </section>

      {/* Daily Quests */}
      <section className="relative z-10 py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] text-[#FFE66D] block mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              DAILY QUESTS
            </span>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Complete All 6 to <span className="text-[#4ECDC4]">Level Up</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "⚔️", title: "WORKOUT x2", desc: "45 min each. One outdoor. Boss-level commitment.", xp: "+300 XP", color: "#FF6B9D" },
              { icon: "🍎", title: "DIET MODE", desc: "No alcohol. No cheats. Pure fuel for the grind.", xp: "+200 XP", color: "#FF8A5C" },
              { icon: "💧", title: "HYDRA FILL", desc: "128 oz of water. Stay hydrated, stay powerful.", xp: "+150 XP", color: "#4ECDC4" },
              { icon: "📖", title: "KNOWLEDGE", desc: "10 pages non-fiction. Upgrade your mind stats.", xp: "+100 XP", color: "#A78BFA" },
              { icon: "📸", title: "SNAPSHOT", desc: "Daily progress photo. Evidence of transformation.", xp: "+50 XP", color: "#FFE66D" },
              { icon: "🔥", title: "NO FAILS", desc: "Miss one? Game over. Start from Level 1.", xp: "CRITICAL", color: "#ef4444" },
            ].map((quest) => (
              <div
                key={quest.title}
                className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-white/15 hover:bg-white/8 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{quest.icon}</span>
                  <span
                    className="text-[8px] font-bold px-2 py-1 rounded-md"
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      backgroundColor: `${quest.color}20`,
                      color: quest.color,
                    }}
                  >
                    {quest.xp}
                  </span>
                </div>
                <h3
                  className="text-[11px] font-bold text-white mb-2"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  {quest.title}
                </h3>
                <p
                  className="text-[14px] text-white/50 leading-relaxed"
                  style={{ fontFamily: "'Rubik', sans-serif" }}
                >
                  {quest.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AMCC Boss Battle */}
      <section className="relative z-10 py-20 px-6 md:px-10 bg-gradient-to-b from-transparent via-[#2a1f4e]/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[10px] text-[#FF6B9D] block mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              🧠 SECRET BOSS
            </span>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Your Brain&apos;s <span className="text-[#FFE66D]">Hidden Power-Up</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div
              className="text-[16px] text-white/60 leading-[1.85] space-y-5"
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              <p>
                Stanford neuroscientist <strong className="text-white">Dr. Andrew Huberman</strong> discovered
                something wild: your brain has a region called the{" "}
                <strong className="text-[#FFE66D]">AMCC (Anterior Mid-Cingulate Cortex)</strong>{" "}
                that&apos;s basically your willpower stat.
              </p>
              <p>
                Every time you complete a quest you didn&apos;t want to do, your AMCC{" "}
                <strong className="text-[#4ECDC4]">literally levels up</strong> — it grows physically larger.
                More neural connections. More willpower capacity. Like grinding XP, but for your actual brain.
              </p>
              <p>
                The ultimate flex? People with the biggest AMCCs are{" "}
                <strong className="text-[#FFE66D]">&ldquo;super-agers&rdquo;</strong> who stay sharp into
                their 80s and 90s. It&apos;s the only brain stat linked to both longevity and peak cognition.
              </p>
            </div>

            <div className="space-y-3">
              <ArcadeBlock color="#1a1035" className="border border-[#A78BFA]/20">
                <div className="text-center">
                  <span className="text-[9px] text-[#A78BFA] block mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                    AMCC STATS
                  </span>
                  <div className="space-y-3">
                    <LevelBar level={1} maxLevel={10} label="DAY 1" />
                    <LevelBar level={5} maxLevel={10} label="DAY 30" />
                    <LevelBar level={10} maxLevel={10} label="DAY 75" />
                  </div>
                </div>
              </ArcadeBlock>

              <div className="bg-[#FFE66D]/10 border border-[#FFE66D]/20 rounded-2xl p-5">
                <p className="text-[14px] text-[#FFE66D]/80 italic leading-relaxed" style={{ fontFamily: "'Rubik', sans-serif" }}>
                  &ldquo;The AMCC grows when we do things we don&apos;t want to do. It&apos;s larger in people
                  who live longest.&rdquo;
                </p>
                <span className="text-[10px] text-white/30 mt-2 block font-bold" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                  DR. HUBERMAN
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disease defeat grid */}
      <section className="relative z-10 py-20 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[10px] text-[#4ECDC4] block mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              ENEMY ROSTER
            </span>
            <h2
              className="text-3xl md:text-4xl font-black mb-3"
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Defeat <span className="text-[#FF6B9D]">40 Diseases</span> With Movement
            </h2>
            <p
              className="text-[15px] text-white/40 max-w-lg mx-auto"
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              30 min/day of exercise reduces risk of these conditions. Tap to defeat them.
              You&apos;re doing 90 minutes — triple damage!
            </p>
          </div>
          <DiseaseGrid />
        </div>
      </section>

      {/* Power-ups / Why section */}
      <section className="relative z-10 py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[10px] text-[#FFE66D] block mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              POWER-UPS
            </span>
            <h2 className="text-3xl font-black" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Why <span className="text-[#4ECDC4]">75 Proof</span> Hits Different
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🆓", title: "FREE PLAY", desc: "No coins. No gems. No premium. Actually free, forever. We promise.", color: "#4ECDC4" },
              { icon: "🛡️", title: "STEALTH MODE", desc: "Your data is invisible to us. No tracking, no selling. Total privacy.", color: "#A78BFA" },
              { icon: "✨", title: "EASY CONTROLS", desc: "Tap. Done. No complex menus. No tutorial needed. Just play.", color: "#FFE66D" },
            ].map((p) => (
              <ArcadeBlock key={p.title} color="#2a1f4e" className="border border-white/5 hover:border-white/15 transition-all">
                <span className="text-3xl block mb-3">{p.icon}</span>
                <h3
                  className="text-[10px] font-bold mb-2"
                  style={{ fontFamily: "'Press Start 2P', monospace", color: p.color }}
                >
                  {p.title}
                </h3>
                <p className="text-[14px] text-white/50 leading-relaxed" style={{ fontFamily: "'Rubik', sans-serif" }}>
                  {p.desc}
                </p>
              </ArcadeBlock>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6 md:px-10 text-center">
        <h2
          className="text-4xl md:text-5xl font-black mb-5"
          style={{ fontFamily: "'Rubik', sans-serif" }}
        >
          Ready to <span className="text-[#FFE66D]">Press Start</span>?
        </h2>
        <p className="text-[15px] text-white/40 mb-10" style={{ fontFamily: "'Rubik', sans-serif" }}>
          75 levels. Free play. No continues needed.
        </p>
        <button
          onClick={() => router.push("/sign-up")}
          className="px-12 py-5 bg-[#FFE66D] text-[#1a1035] text-[12px] font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            boxShadow: "0 6px 0 #d4b84d, 0 8px 20px rgba(255,230,109,0.3)",
          }}
        >
          ▶ INSERT COIN ($0)
        </button>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-6 px-6 text-center">
        <span className="text-[8px] text-white/20" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          © 2025 75 PROOF — GAME OVER IS NOT AN OPTION
        </span>
      </footer>
    </div>
  );
}
