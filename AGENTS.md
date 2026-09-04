# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Design tokens live in `src/styles/theme.css` and are the only place
colours, fonts and shadows are defined; prefer Tailwind utilities for new styles and keep the
existing semantic classes for the screens that already have them. Do not import Tailwind's
Preflight — `src/styles/base.css` is the reset, and Preflight would change the current design. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable Design Decisions

- Use the Calea app mark as a gold (`#E0BC79`) monoline "C" shaped like a path on a near-black (`#111210`) field.
- Keep the install experience manifest-based and online-only: no service worker, offline cache, or custom install prompt unless explicitly requested later.
- Keep Cards as a standalone fifth navigation area with Russian-to-Romanian active recall, immediate deck availability, and progress stored independently from lesson/story reading.
- Keep the app chrome bilingual (English and Russian) via i18next. Default interface language is English; the choice persists in `calea:locale`. Lesson, story, and grammar markdown in `src/content/` and card study content (Russian prompt → Romanian answer) stay independent of the UI language.
- Every new standalone Romanian noun card, including noun compounds, must include gender, plural form, and plural-form pronunciation verified online against normative references before it is added. Never infer these metadata values automatically from suffixes or other heuristics; phrases, sentences, chunks, and adjectives remain excluded.
- The Lessons Ref "Lesson words" table must use the same compact sans-serif grammar-table treatment, including shared header, spacing, borders, and horizontal scrolling.
- Cards use a local "Today" queue of up to 20 distinct cards, with no more than 5 new cards per day. Due cards are selected first from decks started by a first graded answer; all decks remain available for manual practice.
- Card scheduling uses the product's simple 1, 3, 7, 14, 30, and 60 day intervals. A new card needs three successful scheduled checks on separate days to become закреплено/known; an error resets it to one day and keeps it in the difficult-card list until a scheduled success.
- A saved Today session keeps its queue, position, reveal state, retry displays, and results across navigation, reloads, and day changes. Retry displays are capped at two per card in a session, and only the first answer contributes to the session's recall totals.
