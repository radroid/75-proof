# Earned — iOS UI kit

A hi-fi click-thru recreation of the Earned habit-tracker app, iOS-first. Mobile-optimized; runs in an iPhone-sized device frame.

## What's here

- **`index.html`** — mounts the app inside an iOS device frame. Open this for a working preview.
- **`ios-frame.jsx`** — generic iOS device chrome (status bar, dynamic island, home indicator). Starter component, untouched.
- **`components.jsx`** — Earned-specific UI: `Star`, `Checkbox`, `PaperBg`, `Chip`, `HandButton`, `HabitRow`, `BottomNav`, `PageHeader`.
- **`screens.jsx`** — full-screen views: `TodayScreen`, `JournalScreen`, `StarsScreen`, `MeScreen`.

## Screens covered

| Screen | What it does |
|--------|--------------|
| **Today** | Daily check-in. Date header, day counter, streak chip, hand-drawn habit rows. Tap any checkbox to cycle empty → checked → ★ earned → empty. |
| **Journal** | First-person free-writing page. Red margin, ruled paper, big "Today I…" prompt, gold star sticker showing day number. |
| **Stars** | Earned-stars ledger. Two-week mini-calendar grid with earned / missed / rest / today states. |
| **Me** | Settings stub — paired book, daily check-in time, total stars. |

## Interactions

- Bottom-nav tabs switch screens.
- Habit checkboxes cycle through three "show up" states.
- Journal entry is a live `<textarea>`; type away.

## Design system this implements

Everything reads from `../../colors_and_type.css` and follows the conventions in the root `README.md`:
- **Poppins** for structure, **Caveat** for handwritten moments
- Cream ruled paper as the default surface
- "Ink sticker" shadow on lifted cards
- Brand star (gold, chunky, white shine) is the reward primitive — see `../../assets/star.svg`.

## Caveats

- The journal mock-keyboard isn't shown — assume the iOS system keyboard slides up on focus in production.
- Habit "duration" toggle (75 / 30 / 7 / ∞) is shown in the design-system preview but not in this kit's screens yet; add when the "create habit" screen is designed.
- No real onboarding / login flow — out of scope per the user's request.
