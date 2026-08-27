# Calea design QA

## Evidence

- Source visual truth: `C:\Users\alex_\Desktop\53a84a75-96c9-4567-8afa-04177d530720.png` (2048 × 1180 px montage of dashboard, lists, and readers).
- Source visual truth: `C:\Users\alex_\Desktop\59df3607-0b05-42d3-a77a-0f2e57e8ec73.png` (2048 × 1180 px montage of profile, statistics, settings, and reader preferences).
- Focused feedback reference: `C:\Users\alex_\AppData\Local\Temp\codex-clipboard-e8ca8e95-ab43-4956-9a06-28a81261a0fb.png` (1012 × 341 px crop of the profile progress card).
- Implementation dashboard: `qa-dashboard-final-390.png` (390 × 844 px, CSS viewport 390 × 844).
- Implementation desktop dashboard: `qa-dashboard-final-desktop.png` (1280 × 720 px, CSS viewport 1280 × 720; centered shell measured at 520 px).
- Implementation desktop lesson list: `qa-lessons-final-desktop.png` (1280 × 720 px, CSS viewport 1280 × 720; centered shell measured at 520 px).
- Implementation lesson reader: `qa-lesson-final-paper-390.png` (390 × 844 px, CSS viewport 390 × 844).
- Implementation story reader: `qa-story-final-390.png` (390 × 844 px, CSS viewport 390 × 844).
- Supporting implementation captures: `qa-profile-390.png`, `qa-stats-390.png`, `qa-reader-settings-390.png`, and `qa-reader-dark-390.png` (each 390 × 844 px).
- Focused corrected profile capture: `qa-profile-ring-corrected.png` (1280 × 720 px browser viewport; 0% label centered inside the ring).

The supplied references are multi-panel montages rather than single viewport captures, so the implementation was normalized by comparing the corresponding panel anatomy and focused regions (header, progress cards, list rows, reader typography, action bar) at the implementation CSS viewport. Full-view comparison was used for the dashboard and reader surfaces; focused-region comparison was used for the list/profile/statistics/settings panels. No external bitmap assets are present in the references; icons are rendered with the local Phosphor icon set.

## Findings and iteration history

1. Initial implementation established the dark navigation surfaces, warm paper reader, Lora headings/body, restrained borders, gold progress treatment, compact rows, and safe-area bottom navigation.
2. Reader scroll initially expanded the outer shell instead of producing an internal scroll region. The shell and reader were given fixed `100dvh`/desktop constrained heights, and scroll restoration was retested.
3. The first list comparison used the reader-width shell. The written brief requires dark screens near 520 px, so the lesson and story lists were tightened to the compact dark shell and rechecked at desktop width.
4. A stale profile icon import and a transient hook-order error were found during hot-module reload. A clean tab reload after the fixes produced no console errors or warnings.
5. Mobile review exposed a narrow horizontal overflow region in the scroll containers. Horizontal overflow is now clipped while vertical reader/list scrolling remains dedicated and responsive.
6. Profile review exposed a specificity conflict that forced the progress-ring percentage label out of its inner circle. The profile text selector is now scoped to the text column, restoring centered ring geometry at 0% and non-zero progress.

No remaining P0, P1, or P2 fidelity issues were found. Dashboard and reader captures use a fresh origin (0% progress); the focused profile capture retains local QA state so the corrected ring is also verified with non-zero progress. The references show illustrative seeded values for comparison. The MVP intentionally omits screenshot-only locked rows, account identity, language switching, export/import, and inactive settings controls per the implementation brief.

## Browser QA

- Preview: `http://localhost:4173/` (HashRouter routes).
- Viewports checked: 390 × 844 mobile and 1280 × 720 desktop; the desktop shell width is 520 px for dark screens and 760 px for readers.
- Routes smoke-tested: `/`, `/lessons`, `/lessons/:id`, `/stories`, `/stories/:id`, `/profile`, `/stats`, `/settings`, `/settings/reader`, an unknown route, and a missing story ID.
- Interactions tested: opening a lesson creates an in-progress record; lesson completion persists and updates dashboard/list/profile/statistics; story scrolling increases monotonic max progress and retains the latest resume position; reader theme changes persist; A+/A− changes persist across reload; manual story completion produces the completed state; reader settings save independently from progress; the reset action is confirmation-gated.
- A clean browser tab reported zero error or warning messages after the route and interaction smoke tests.

## Build QA

- `npm.cmd run typecheck` — passed.
- `npm.cmd run build` — passed; Vite emitted the client and Sites server artifacts. Vite reports only the existing bundle-size advisory.
- `npm.cmd run test:sites` — passed (4/4).
- `git diff --check` — unavailable because this starter workspace has no `.git` repository; no whitespace errors were observed in the generated source.

final result: passed
