// Earned — shared UI components for the iOS app.
// Hand-drawn, paper-feel. All components read tokens from ../../colors_and_type.css.

const COLORS = {
  cream: '#F4ECD8',
  creamLight: '#F9F3E1',
  creamDark: '#E8DEC4',
  ink: '#1F1F1D',
  inkSoft: '#3A3A36',
  sky: '#0090D8',
  skyDeep: '#0B6FA3',
  gold: '#D8A830',
  goldLt: '#F2C94C',
  rose: '#C75F4A',
  sage: '#7A8C6B',
  ruleLine: 'rgba(78,60,28,0.18)',
  marginLine: 'rgba(199,95,74,0.45)',
};

const FONT_SANS = "'Poppins', system-ui, -apple-system, sans-serif";
const FONT_HAND = "'Caveat', 'Patrick Hand', cursive";

// ─── Star ───────────────────────────────────────────────
function Star({ size = 24, filled = true, color = COLORS.gold, stroke = COLORS.ink, sw = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path d="M12 2 L15 9 L22 10 L17 15 L18 22 L12 18 L6 22 L7 15 L2 10 L9 9 Z"
        fill={filled ? color : 'none'} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  );
}

// ─── Hand-drawn checkbox ───────────────────────────────
function Checkbox({ state = 'empty', size = 36, onClick }) {
  // state: 'empty' | 'checked' | 'star' | 'missed' | 'rest'
  const box = (
    <path d="M4 5 C 14 3, 28 4, 33 6 C 33.5 16, 33 26, 32 32 C 22 33, 10 33, 4 31 C 3 22, 3.5 12, 4 5 Z"
      fill={state === 'star' ? COLORS.gold : 'none'}
      stroke={state === 'rest' ? COLORS.sage : COLORS.ink}
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={state === 'rest' ? '3 3' : 'none'} />
  );
  const check = state === 'checked' ? (
    <path d="M8 18 C 11 22, 13 26, 16 28 C 22 22, 26 14, 32 6"
      fill="none" stroke={COLORS.sky} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  ) : null;
  const star = state === 'star' ? (
    <path d="M18 6 L21 14 L29 15 L23 20 L25 28 L18 24 L11 28 L13 20 L7 15 L15 14 Z" fill={COLORS.ink} />
  ) : null;
  const x = state === 'missed' ? (
    <g stroke={COLORS.rose} strokeWidth={2.5} strokeLinecap="round">
      <path d="M9 10 L28 27" /><path d="M28 10 L9 27" />
    </g>
  ) : null;
  return (
    <button onClick={onClick} aria-label="toggle"
      style={{ width: size, height: size, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer' }}>
      <svg viewBox="0 0 36 36" width={size} height={size} style={{ display: 'block' }}>
        {box}{check}{star}{x}
      </svg>
    </button>
  );
}

// ─── Paper background (ruled, with optional red margin) ───
function PaperBg({ margin = true, children, style = {} }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: COLORS.cream,
      backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 31px, ${COLORS.ruleLine} 31px, ${COLORS.ruleLine} 32px)`,
      backgroundPosition: '0 12px',
      ...style,
    }}>
      {margin && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 36,
          width: 1, background: COLORS.marginLine,
        }} />
      )}
      {children}
    </div>
  );
}

// ─── Handwritten chip (sticker shadow) ────────────────
function Chip({ children, tone = 'cream', size = 'md' }) {
  const palette = {
    cream: { bg: COLORS.creamLight, fg: COLORS.ink, sh: COLORS.ink },
    gold:  { bg: COLORS.gold,       fg: COLORS.ink, sh: COLORS.ink },
    sky:   { bg: COLORS.sky,        fg: COLORS.creamLight, sh: COLORS.ink },
    rose:  { bg: COLORS.creamLight, fg: COLORS.rose, sh: COLORS.rose },
  }[tone];
  const padY = size === 'sm' ? 4 : 6;
  const padX = size === 'sm' ? 10 : 14;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: palette.bg, color: palette.fg,
      border: `1.5px solid ${COLORS.ink}`,
      padding: `${padY}px ${padX}px`,
      borderRadius: 999,
      fontFamily: FONT_SANS, fontWeight: 600, fontSize: size === 'sm' ? 12 : 13,
      boxShadow: `2px 2px 0 ${palette.sh}`,
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

// ─── Hand-drawn primary button (wobbly border) ─────────
function HandButton({ children, onClick, tone = 'ink', style = {} }) {
  const bg = tone === 'sky' ? COLORS.sky : tone === 'gold' ? COLORS.gold : COLORS.ink;
  const fg = tone === 'gold' ? COLORS.ink : COLORS.creamLight;
  return (
    <button onClick={onClick} style={{
      position: 'relative', background: bg, color: fg,
      fontFamily: FONT_SANS, fontWeight: 600, fontSize: 16,
      padding: '14px 24px',
      border: `1.5px solid ${COLORS.ink}`,
      borderRadius: 12,
      boxShadow: `2px 2px 0 ${COLORS.ink}`,
      cursor: 'pointer',
      ...style,
    }}>{children}</button>
  );
}

// ─── Habit row (full-width card) ───────────────────────
function HabitRow({ habit, onToggle }) {
  const { name, note, streak, total, state } = habit;
  const checked = state === 'checked' || state === 'star';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      background: checked ? COLORS.creamLight : 'transparent',
      border: `1.5px ${checked ? 'solid' : 'dashed'} ${COLORS.ink}`,
      boxShadow: checked ? `2px 2px 0 ${COLORS.ink}` : 'none',
      borderRadius: 10,
    }}>
      <Checkbox state={state} onClick={onToggle} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONT_HAND, fontWeight: 600, fontSize: 24, lineHeight: 1.05,
          color: COLORS.ink,
          textDecoration: state === 'star' ? 'underline wavy ' + COLORS.gold : 'none',
          textUnderlineOffset: 6,
        }}>{name}</div>
        {note && (
          <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: 'rgba(31,31,29,0.55)', marginTop: 2 }}>
            {note}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
        <div style={{ fontFamily: FONT_HAND, fontSize: 22, lineHeight: 1, color: COLORS.ink }}>{streak}</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(31,31,29,0.55)', fontWeight: 600 }}>
          {total ? `/ ${total}` : 'days'}
        </div>
      </div>
    </div>
  );
}

// ─── Bottom nav — paper strip with torn top edge ──────
function BottomNav({ tab, onTab }) {
  const items = [
    { id: 'today',   label: 'Today',   icon: TodayIcon },
    { id: 'journal', label: 'Journal', icon: JournalIcon },
    { id: 'stars',   label: 'Stars',   icon: StarIcon },
    { id: 'me',      label: 'Me',      icon: MeIcon },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 92, zIndex: 30, pointerEvents: 'none' }}>
      {/* torn top edge */}
      <svg width="100%" height="14" viewBox="0 0 390 14" preserveAspectRatio="none" style={{ display: 'block' }}>
        <path d="M0 14 L0 6 L10 8 L22 4 L34 9 L46 5 L60 8 L74 4 L88 9 L100 6 L114 9 L128 5 L142 8 L156 4 L170 9 L184 5 L198 8 L212 4 L226 9 L240 6 L254 9 L268 5 L282 8 L296 4 L310 9 L324 5 L338 8 L352 4 L366 9 L378 6 L390 8 L390 14 Z"
          fill={COLORS.creamLight} stroke={COLORS.ink} strokeWidth="1" />
      </svg>
      <div style={{
        background: COLORS.creamLight, height: 78,
        borderTop: 'none',
        display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
        paddingTop: 8, paddingBottom: 24,
        pointerEvents: 'auto',
      }}>
        {items.map(({ id, label, icon: I }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => onTab(id)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: 4, color: active ? COLORS.ink : 'rgba(31,31,29,0.5)',
            }}>
              <I active={active} />
              <span style={{
                fontFamily: active ? FONT_HAND : FONT_SANS,
                fontWeight: active ? 700 : 500,
                fontSize: active ? 16 : 11,
                lineHeight: 1,
              }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Nav icons (hand-stroke) ───────────────────────────
function TodayIcon({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke={active ? COLORS.ink : 'rgba(31,31,29,0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11 L5 26 C 5 27, 6 28, 7 28 L25 28 C 26 28, 27 27, 27 26 L27 11" />
      <path d="M4 11 L28 11 L28 8 C 28 7, 27 6, 26 6 L6 6 C 5 6, 4 7, 4 8 Z" />
      <path d="M10 4 L10 9" /><path d="M22 4 L22 9" />
      {active && <path d="M11 19 C 14 21, 14 21, 16 18 C 19 13, 22 13, 24 14" stroke={COLORS.sky} strokeWidth="2" />}
    </svg>
  );
}
function JournalIcon({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke={active ? COLORS.ink : 'rgba(31,31,29,0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4 L24 4 C 25 4, 26 5, 26 6 L26 27 L8 28 C 7 28, 6 27, 6 26 Z" />
      <path d="M10 4 L10 28" />
      <path d="M14 11 L22 11" /><path d="M14 16 L22 16" /><path d="M14 21 L19 21" />
    </svg>
  );
}
function StarIcon({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill={active ? COLORS.gold : 'none'} stroke={active ? COLORS.ink : 'rgba(31,31,29,0.5)'} strokeWidth="2" strokeLinejoin="round">
      <path d="M16 4 L19 12 L28 13 L21 19 L23 28 L16 23 L9 28 L11 19 L4 13 L13 12 Z" />
    </svg>
  );
}
function MeIcon({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke={active ? COLORS.ink : 'rgba(31,31,29,0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="12" r="5" />
      <path d="M5 28 C 7 21, 13 19, 16 19 C 19 19, 25 21, 27 28" />
    </svg>
  );
}

// ─── Handwritten page header (date + day) ──────────────
function PageHeader({ date, day, total }) {
  return (
    <div style={{ padding: '64px 22px 8px 56px', position: 'relative' }}>
      <div style={{ fontFamily: FONT_HAND, fontWeight: 600, fontSize: 32, lineHeight: 1, color: COLORS.ink }}>
        {date}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(31,31,29,0.55)', fontWeight: 600 }}>Day</div>
        <div style={{ fontFamily: FONT_HAND, fontWeight: 700, fontSize: 56, lineHeight: 0.9, color: COLORS.ink }}>{day}</div>
        {total && (
          <div style={{ fontFamily: FONT_HAND, fontWeight: 500, fontSize: 26, color: 'rgba(31,31,29,0.55)' }}>
            of {total}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  EARNED_COLORS: COLORS, EARNED_FONT_SANS: FONT_SANS, EARNED_FONT_HAND: FONT_HAND,
  Star, Checkbox, PaperBg, Chip, HandButton, HabitRow, BottomNav, PageHeader,
});
