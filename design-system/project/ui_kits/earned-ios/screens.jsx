// Earned — screen views (Today + Journal)

function TodayScreen({ habits, onToggle }) {
  const C = window.EARNED_COLORS;
  const FH = window.EARNED_FONT_HAND;
  const FS = window.EARNED_FONT_SANS;

  const earnedCount = habits.filter(h => h.state === 'checked' || h.state === 'star').length;
  const allDone = earnedCount === habits.length;

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <PaperBg />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', overflow: 'auto', paddingBottom: 110 }}>
        <PageHeader date="Wed, May 13" day={12} total={75} />

        {/* Streak chip + earned chip row */}
        <div style={{ display: 'flex', gap: 8, padding: '4px 22px 14px 56px', flexWrap: 'wrap' }}>
          <Chip tone="gold">
            <Star size={16} />
            <span style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>12</span>
            <span style={{ marginLeft: 2 }}>day streak</span>
          </Chip>
          <Chip tone="sky">
            <span style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{earnedCount}</span>
            <span> of {habits.length} done</span>
          </Chip>
        </div>

        {/* Sub-prompt */}
        <div style={{ padding: '0 22px 12px 56px' }}>
          <div style={{ fontFamily: FH, fontWeight: 500, fontSize: 22, color: 'rgba(31,31,29,0.65)', lineHeight: 1.25 }}>
            Today I'm showing up for —
          </div>
        </div>

        {/* Habit list */}
        <div style={{ padding: '4px 18px 12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {habits.map(h => (
            <HabitRow key={h.id} habit={h} onToggle={() => onToggle(h.id)} />
          ))}
        </div>

        {/* Add new habit */}
        <div style={{ padding: '8px 18px', display: 'flex', justifyContent: 'center' }}>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: FH, fontSize: 22, fontWeight: 600, color: C.skyDeep,
            textDecoration: `underline wavy ${C.sky}`, textUnderlineOffset: 6,
          }}>
            + add another habit
          </button>
        </div>

        {/* Footer note */}
        {allDone && (
          <div style={{ padding: '20px 56px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Star size={72} />
            </div>
            <div style={{ fontFamily: FH, fontWeight: 700, fontSize: 30, color: C.ink }}>
              Day {12} — earned.
            </div>
            <div style={{ fontFamily: FS, fontSize: 13, color: 'rgba(31,31,29,0.6)' }}>
              I showed up for everything today.
            </div>
          </div>
        )}

        {!allDone && (
          <div style={{ padding: '14px 56px 30px', borderTop: `1px dashed ${C.creamDark}`, marginTop: 8 }}>
            <div style={{ fontFamily: FH, fontWeight: 500, fontSize: 20, color: 'rgba(31,31,29,0.55)' }}>
              {habits.length - earnedCount} more to go.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Journal screen ───────────────────────────────────
function JournalScreen({ entry, setEntry }) {
  const C = window.EARNED_COLORS;
  const FH = window.EARNED_FONT_HAND;
  const FS = window.EARNED_FONT_SANS;
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <PaperBg margin={true} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', overflow: 'auto', paddingBottom: 110 }}>
        {/* Header */}
        <div style={{ padding: '64px 22px 4px 56px' }}>
          <div style={{ fontFamily: FS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(31,31,29,0.55)', fontWeight: 600 }}>
            Journal · Wed, May 13
          </div>
          <div style={{ fontFamily: FH, fontWeight: 700, fontSize: 40, lineHeight: 1, color: C.ink, marginTop: 6 }}>
            Today I…
          </div>
        </div>

        {/* Gold star sticker top right showing day earned */}
        <div style={{ position: 'absolute', top: 60, right: 22, zIndex: 3, transform: 'rotate(8deg)' }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <Star size={80} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FH, fontWeight: 700, fontSize: 22, color: C.ink, paddingTop: 4,
            }}>12</div>
          </div>
        </div>

        {/* Entry area */}
        <div style={{ padding: '6px 22px 0 56px' }}>
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="…sat with the book. Read about identity-based habits — keep it small, keep it me."
            style={{
              width: '100%', minHeight: 320, resize: 'none',
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: FH, fontWeight: 500, fontSize: 26, lineHeight: '32px',
              color: C.ink,
              caretColor: C.sky,
              padding: '6px 0 0',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Margin note doodle */}
        <div style={{ position: 'absolute', left: 4, top: 220, transform: 'rotate(-12deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Star size={28} color={C.goldLt} />
          <div style={{ fontFamily: FH, fontSize: 14, color: C.rose, fontWeight: 700 }}>!</div>
        </div>

        {/* Save row */}
        <div style={{ padding: '18px 22px 0 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Chip tone="cream" size="sm">📎 Atomic Habits, p.42</Chip>
            <Chip tone="cream" size="sm">2 min read</Chip>
          </div>
          <HandButton tone="sky" style={{ padding: '10px 18px', fontSize: 15 }}>
            Save page
          </HandButton>
        </div>
      </div>
    </div>
  );
}

// ─── Stars screen (stub — earned ledger) ─────────────
function StarsScreen() {
  const C = window.EARNED_COLORS;
  const FH = window.EARNED_FONT_HAND;
  const FS = window.EARNED_FONT_SANS;
  // 75-day grid with mixed states
  const states = [
    'star','star','star','star','star','rest','star',
    'star','star','missed','star','star','rest','today',
  ];
  const dayLabels = ['M','T','W','T','F','S','S'];
  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <PaperBg margin={false} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', overflow: 'auto', paddingBottom: 110, padding: '64px 22px 110px' }}>
        <div style={{ fontFamily: FS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(31,31,29,0.55)', fontWeight: 600 }}>
          Stars earned
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
          <div style={{ fontFamily: FH, fontWeight: 700, fontSize: 72, lineHeight: 1, color: C.ink }}>11</div>
          <div style={{ fontFamily: FH, fontWeight: 500, fontSize: 26, color: 'rgba(31,31,29,0.55)' }}>of 14 days</div>
        </div>
        <div style={{ fontFamily: FH, fontSize: 22, color: 'rgba(31,31,29,0.7)', marginTop: 4, marginBottom: 18 }}>
          Two weeks in. Most days, I showed up.
        </div>

        {/* day-of-week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 6 }}>
          {dayLabels.map((d, i) => (
            <div key={i} style={{ fontFamily: FS, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(31,31,29,0.55)', fontWeight: 600, textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {states.map((s, i) => (
            <div key={i} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FS, fontSize: 13, fontWeight: 600,
              border: `1.5px ${s === 'rest' ? 'dashed' : 'solid'} ${s === 'rest' ? C.sage : s === 'missed' ? C.rose : C.ink}`,
              background: s === 'star' ? C.gold : s === 'today' ? C.sky : 'transparent',
              color: s === 'today' ? C.creamLight : s === 'missed' ? C.rose : s === 'rest' ? C.sage : C.ink,
              boxShadow: s === 'today' ? `2px 2px 0 ${C.ink}` : 'none',
            }}>
              {s === 'star' ? '★' : s === 'rest' ? 'z' : s === 'missed' ? '·' : s === 'today' ? (i+1) : ''}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, fontFamily: FH, fontWeight: 500, fontSize: 22, color: 'rgba(31,31,29,0.55)' }}>
          61 pages to go.
        </div>
      </div>
    </div>
  );
}

// ─── Me screen (settings stub) ───────────────────────
function MeScreen() {
  const C = window.EARNED_COLORS;
  const FH = window.EARNED_FONT_HAND;
  const FS = window.EARNED_FONT_SANS;
  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <PaperBg margin={false} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', overflow: 'auto', padding: '64px 22px 110px' }}>
        <div style={{ fontFamily: FH, fontWeight: 700, fontSize: 40, color: C.ink }}>
          My notebook
        </div>
        <div style={{ fontFamily: FS, fontSize: 13, color: 'rgba(31,31,29,0.55)', marginTop: 4 }}>
          Started May 1, 2026
        </div>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { k: 'Paired book', v: 'Atomic Habits — James Clear' },
            { k: 'Daily check-in', v: '8:00pm reminder' },
            { k: 'Tone', v: 'Personal · journal-like' },
            { k: 'Weeks tracked', v: '2 / 11' },
            { k: 'Total stars', v: '11 ★' },
          ].map(({ k, v }) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: `1px dashed ${C.creamDark}`,
            }}>
              <span style={{ fontFamily: FS, fontSize: 13, color: 'rgba(31,31,29,0.6)' }}>{k}</span>
              <span style={{ fontFamily: FH, fontWeight: 600, fontSize: 20, color: C.ink }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TodayScreen, JournalScreen, StarsScreen, MeScreen });
