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
