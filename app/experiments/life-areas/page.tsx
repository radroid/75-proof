"use client";

/*
 * EXPERIMENT — "Life Areas" prototype (Phase 0, throwaway).
 *
 * A self-contained, mock-data-only preview of the multi-domain idea captured in
 * docs/LIFE_AREAS_EXPLORATION.md. NO schema, NO Convex, NO prod flows touched —
 * everything here is local useState over hard-coded seed data. The point is to
 * FEEL the interaction (switch area → landing view; periodic tasks as a
 * to-do/habit blend; per-task notes + product log) before deciding on the real,
 * migration-heavy build.
 *
 * Styled with the extracted earned primitives so it reads as the real app. When
 * this graduates, none of this file survives — the real version lives on
 * `habitDefinitions` + new recurrence/notes/products tables.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Star, X } from "lucide-react";
import {
  EC,
  HAND,
  SANS,
  EarnedChip,
  EarnedPaperDefs,
  PaperSurface,
} from "@/components/earned/primitives";

type Cadence = "daily" | "weekly" | "monthly" | "every-6-months" | "yearly" | "once";

interface Product {
  name: string;
  kind: string;
  since: string;
  rating: number; // 1..5
  note?: string;
}

interface Task {
  id: string;
  name: string;
  cadence: Cadence;
  dueLabel: string;
  done: boolean;
  notes: string[];
  products: Product[];
}

interface Area {
  id: string;
  name: string;
  tint: string; // chip/accent tint from the earned palette
  tasks: Task[];
}

const CADENCE_LABEL: Record<Cadence, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  "every-6-months": "Every 6 months",
  yearly: "Yearly",
  once: "One-off",
};

// ---- Seed (mock) data --------------------------------------------------------

const SEED: Area[] = [
  {
    id: "self-care",
    name: "Self-care",
    tint: EC.rose,
    tasks: [
      {
        id: "skincare",
        name: "Skincare routine",
        cadence: "daily",
        dueLabel: "Tonight",
        done: false,
        notes: [
          "Order: cleanser → toner → serum → moisturizer → SPF (AM only).",
          "Retinol 2–3×/week at night; buffer with moisturizer to cut irritation.",
          "Don't mix retinol + strong AHA/BHA same night.",
        ],
        products: [
          { name: "CeraVe Hydrating Cleanser", kind: "cleanser", since: "Jan 2026", rating: 4 },
          { name: "The Ordinary Glycolic 7%", kind: "toner", since: "Mar 2026", rating: 3, note: "2×/wk, tingles" },
          { name: "La Roche-Posay B5", kind: "night cream", since: "Feb 2026", rating: 5, note: "current favourite" },
        ],
      },
      {
        id: "dental",
        name: "Dental checkup",
        cadence: "every-6-months",
        dueLabel: "Due Sep 2026",
        done: false,
        notes: ["Dr. Nguyen — booked 6 mo out at each visit.", "Ask about night-guard fit."],
        products: [],
      },
      {
        id: "derm",
        name: "Dermatologist visit",
        cadence: "yearly",
        dueLabel: "Due Dec 2026",
        done: false,
        notes: ["Annual mole check."],
        products: [],
      },
    ],
  },
  {
    id: "fitness",
    name: "Fitness",
    tint: EC.skyDeep,
    tasks: [
      {
        id: "workout",
        name: "Workout",
        cadence: "daily",
        dueLabel: "Today",
        done: true,
        notes: ["Push / pull / legs split.", "45 min minimum to count."],
        products: [{ name: "Nike Pegasus 41", kind: "running shoe", since: "May 2026", rating: 4 }],
      },
      {
        id: "gym-renew",
        name: "Renew gym membership",
        cadence: "yearly",
        dueLabel: "Due Aug 2026",
        done: false,
        notes: [],
        products: [],
      },
    ],
  },
  {
    id: "work",
    name: "Work",
    tint: EC.sage,
    tasks: [
      {
        id: "weekly-review",
        name: "Weekly review",
        cadence: "weekly",
        dueLabel: "Due Friday",
        done: false,
        notes: ["Inbox zero, next-week top 3, close stale threads."],
        products: [],
      },
      {
        id: "1-1s",
        name: "Prep 1:1 notes",
        cadence: "weekly",
        dueLabel: "Due Monday",
        done: false,
        notes: [],
        products: [],
      },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    tint: EC.gold,
    tasks: [
      {
        id: "cc",
        name: "Pay credit card",
        cadence: "monthly",
        dueLabel: "Due the 3rd",
        done: false,
        notes: ["Autopay set, but eyeball the statement for fraud."],
        products: [],
      },
      {
        id: "budget",
        name: "Review budget",
        cadence: "monthly",
        dueLabel: "Due month-end",
        done: false,
        notes: [],
        products: [],
      },
    ],
  },
];

// ---- UI ----------------------------------------------------------------------

export default function LifeAreasPrototype() {
  const [areas, setAreas] = useState<Area[]>(SEED);
  const [activeAreaId, setActiveAreaId] = useState(SEED[0].id);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const activeArea = areas.find((a) => a.id === activeAreaId)!;
  const openTask = useMemo(
    () => activeArea.tasks.find((t) => t.id === openTaskId) ?? null,
    [activeArea, openTaskId],
  );
  const doneCount = activeArea.tasks.filter((t) => t.done).length;

  const toggleDone = (taskId: string) =>
    setAreas((prev) =>
      prev.map((a) =>
        a.id !== activeAreaId
          ? a
          : {
              ...a,
              tasks: a.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t,
              ),
            },
      ),
    );

  const addNote = (taskId: string, body: string) =>
    setAreas((prev) =>
      prev.map((a) =>
        a.id !== activeAreaId
          ? a
          : {
              ...a,
              tasks: a.tasks.map((t) =>
                t.id === taskId ? { ...t, notes: [...t.notes, body] } : t,
              ),
            },
      ),
    );

  const addProduct = (taskId: string, p: Product) =>
    setAreas((prev) =>
      prev.map((a) =>
        a.id !== activeAreaId
          ? a
          : {
              ...a,
              tasks: a.tasks.map((t) =>
                t.id === taskId ? { ...t, products: [...t.products, p] } : t,
              ),
            },
      ),
    );

  return (
    <PaperSurface
      margin
      style={{ minHeight: "100dvh", padding: "28px 18px 96px 40px" }}
    >
      <EarnedPaperDefs />

      {/* Header */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: EC.rose, fontWeight: 700 }}>
          Experiment
        </div>
        <h1 style={{ fontFamily: HAND, fontWeight: 700, fontSize: 44, lineHeight: 1, color: EC.ink, marginTop: 4 }}>
          Life Areas
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: EC.inkSoft, marginTop: 8, maxWidth: 520 }}>
          Pick an area of your life — it becomes your landing view. Each area holds periodic tasks
          (daily to yearly), and every task carries its own notes and product log. Mock data;
          tap a task to open its detail.
        </p>

        {/* Area switcher */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          {areas.map((a) => {
            const active = a.id === activeAreaId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setActiveAreaId(a.id);
                  setOpenTaskId(null);
                }}
                className="earned-focusable"
                aria-pressed={active}
                style={{
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: `1.5px solid ${EC.ink}`,
                  cursor: "pointer",
                  color: active ? EC.creamLight : EC.ink,
                  background: active ? a.tint : EC.creamLight,
                  boxShadow: active ? `2px 2px 0 ${EC.ink}` : "none",
                  transition: "transform 120ms",
                }}
              >
                {a.name}
              </button>
            );
          })}
        </div>

        {/* Landing view: the active area's tasks */}
        <div style={{ marginTop: 26, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={{ fontFamily: HAND, fontWeight: 700, fontSize: 28, color: EC.ink }}>
            {activeArea.name}
          </h2>
          <span style={{ fontFamily: SANS, fontSize: 13, color: EC.inkSoft, fontVariantNumeric: "tabular-nums" }}>
            {doneCount} of {activeArea.tasks.length} done
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {activeArea.tasks.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: EC.creamLight,
                border: `1.5px solid ${EC.ink}`,
                borderRadius: 12,
                boxShadow: `2px 2px 0 ${EC.ink}`,
                padding: "12px 14px",
              }}
            >
              {/* checkbox */}
              <button
                type="button"
                onClick={() => toggleDone(t.id)}
                aria-label={t.done ? `Mark ${t.name} not done` : `Mark ${t.name} done`}
                aria-pressed={t.done}
                className="earned-focusable"
                style={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: 8,
                  border: `1.5px solid ${EC.ink}`,
                  background: t.done ? activeArea.tint : EC.creamLight,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  filter: "url(#earned-rough-soft)",
                }}
              >
                {t.done && <Check size={17} color={EC.creamLight} strokeWidth={3} />}
              </button>

              {/* name + due — tapping opens detail */}
              <button
                type="button"
                onClick={() => setOpenTaskId(t.id)}
                className="earned-focusable"
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: EC.ink, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.55 : 1 }}>
                  {t.name}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: EC.inkSoft, marginTop: 2 }}>
                  {t.dueLabel}
                  {(t.notes.length > 0 || t.products.length > 0) && (
                    <span style={{ color: EC.inkSoft }}>
                      {" · "}
                      {t.notes.length > 0 && `${t.notes.length} note${t.notes.length === 1 ? "" : "s"}`}
                      {t.notes.length > 0 && t.products.length > 0 && ", "}
                      {t.products.length > 0 && `${t.products.length} product${t.products.length === 1 ? "" : "s"}`}
                    </span>
                  )}
                </div>
              </button>

              <EarnedChip tone="cream" size="sm">
                {CADENCE_LABEL[t.cadence]}
              </EarnedChip>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: SANS, fontSize: 12, color: EC.inkSoft, marginTop: 24, opacity: 0.75 }}>
          Prototype only — see <code>docs/LIFE_AREAS_EXPLORATION.md</code>. Nothing here is saved.
        </p>
      </div>

      {/* Task detail sheet */}
      <AnimatePresence>
        {openTask && (
          <TaskDetail
            key={openTask.id}
            task={openTask}
            tint={activeArea.tint}
            onClose={() => setOpenTaskId(null)}
            onAddNote={(body) => addNote(openTask.id, body)}
            onAddProduct={(p) => addProduct(openTask.id, p)}
          />
        )}
      </AnimatePresence>
    </PaperSurface>
  );
}

function TaskDetail({
  task,
  tint,
  onClose,
  onAddNote,
  onAddProduct,
}: {
  task: Task;
  tint: string;
  onClose: () => void;
  onAddNote: (body: string) => void;
  onAddProduct: (p: Product) => void;
}) {
  const [tab, setTab] = useState<"notes" | "products">("notes");
  const [draftNote, setDraftNote] = useState("");
  const [draftProduct, setDraftProduct] = useState("");

  return (
    <>
      {/* scrim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(31,31,29,0.35)", zIndex: 40 }}
      />
      {/* drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.24 }}
        role="dialog"
        aria-label={`${task.name} detail`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 92vw)",
          background: EC.cream,
          borderLeft: `1.5px solid ${EC.ink}`,
          boxShadow: `-6px 0 0 rgba(31,31,29,0.08)`,
          zIndex: 41,
          padding: "22px 20px",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: HAND, fontWeight: 700, fontSize: 30, lineHeight: 1, color: EC.ink }}>
              {task.name}
            </h3>
            <div style={{ marginTop: 8 }}>
              <EarnedChip tone="cream" size="sm">{CADENCE_LABEL[task.cadence]}</EarnedChip>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail"
            className="earned-focusable"
            style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${EC.ink}`, background: EC.creamLight, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <X size={18} color={EC.ink} />
          </button>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {(["notes", "products"] as const).map((k) => {
            const active = tab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                aria-pressed={active}
                className="earned-focusable"
                style={{
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "capitalize",
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: `1.5px solid ${EC.ink}`,
                  cursor: "pointer",
                  color: active ? EC.creamLight : EC.ink,
                  background: active ? tint : EC.creamLight,
                }}
              >
                {k === "notes" ? `Notes (${task.notes.length})` : `Products (${task.products.length})`}
              </button>
            );
          })}
        </div>

        {tab === "notes" ? (
          <div style={{ marginTop: 18 }}>
            {task.notes.length === 0 && (
              <p style={{ fontFamily: SANS, fontSize: 13, color: EC.inkSoft }}>
                No notes yet — this is where researched knowledge accretes over time.
              </p>
            )}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {task.notes.map((n, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: SANS,
                    fontSize: 14,
                    color: EC.ink,
                    background: EC.creamLight,
                    border: `1.5px solid ${EC.rule}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    lineHeight: 1.45,
                  }}
                >
                  {n}
                </li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = draftNote.trim();
                if (!v) return;
                onAddNote(v);
                setDraftNote("");
              }}
              style={{ display: "flex", gap: 8, marginTop: 14 }}
            >
              <input
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Add a note…"
                aria-label="Add a note"
                style={{ flex: 1, fontFamily: SANS, fontSize: 14, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${EC.ink}`, background: EC.creamLight, color: EC.ink }}
              />
              <button
                type="submit"
                aria-label="Save note"
                className="earned-focusable"
                style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${EC.ink}`, background: tint, color: EC.creamLight, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `2px 2px 0 ${EC.ink}` }}
              >
                <Plus size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div style={{ marginTop: 18 }}>
            {task.products.length === 0 && (
              <p style={{ fontFamily: SANS, fontSize: 13, color: EC.inkSoft }}>
                No products logged — track what you've tried (creams, toners, gear) and how they rated.
              </p>
            )}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {task.products.map((p, i) => (
                <li
                  key={i}
                  style={{ background: EC.creamLight, border: `1.5px solid ${EC.rule}`, borderRadius: 10, padding: "10px 12px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: EC.ink }}>{p.name}</span>
                    <span style={{ display: "inline-flex", gap: 1 }} aria-label={`${p.rating} of 5`}>
                      {Array.from({ length: 5 }, (_, s) => (
                        <Star key={s} size={13} color={EC.gold} fill={s < p.rating ? EC.gold : "transparent"} />
                      ))}
                    </span>
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: EC.inkSoft, marginTop: 2 }}>
                    {p.kind} · since {p.since}
                    {p.note ? ` · ${p.note}` : ""}
                  </div>
                </li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = draftProduct.trim();
                if (!v) return;
                onAddProduct({ name: v, kind: "product", since: "now", rating: 4 });
                setDraftProduct("");
              }}
              style={{ display: "flex", gap: 8, marginTop: 14 }}
            >
              <input
                value={draftProduct}
                onChange={(e) => setDraftProduct(e.target.value)}
                placeholder="Add a product…"
                aria-label="Add a product"
                style={{ flex: 1, fontFamily: SANS, fontSize: 14, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${EC.ink}`, background: EC.creamLight, color: EC.ink }}
              />
              <button
                type="submit"
                aria-label="Save product"
                className="earned-focusable"
                style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${EC.ink}`, background: tint, color: EC.creamLight, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `2px 2px 0 ${EC.ink}` }}
              >
                <Plus size={18} />
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </>
  );
}
