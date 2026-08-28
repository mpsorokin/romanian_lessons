# Calea

A small reading studio for learning Romanian: lessons and stories with in-browser progress.

## Features

- Lessons and stories in Markdown with YAML frontmatter
- Reader with font and text size settings
- Local reading progress (saved in `localStorage`)
- Stats and profile
- Installable web app (manifest; online-only, no offline cache)

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4.3 (design tokens + utilities; Preflight is deliberately not used)
- React Router (`HashRouter`)
- Content: Markdown in `src/content/`

## Local development

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173/`.

### Build and preview

```bash
npm run build
npm run preview
```

Build outputs the client to `dist/client` (and optional OpenAI Sites artifacts under `dist/`).

### Checks

```bash
npm run typecheck
npm run test:sites
```

## Versioning

The version shown in **Settings -> About -> Version** comes from `package.json`. Vite injects it at
build time (`__APP_VERSION__`), so there is nothing to keep in sync by hand.

A husky `post-commit` hook bumps that version automatically, based on the prefix of the message:

| Commit message | Bump | Example |
| --- | --- | --- |
| `major: ...` | major | `1.2.3` -> `2.0.0` |
| `feat: ...` | minor | `1.2.3` -> `1.3.0` |
| anything else (`fix:`, `chore:`, free text) | patch | `1.2.3` -> `1.2.4` |

The bump edits `package.json` and `package-lock.json` and folds them into the commit you just made,
so one commit still equals one version. Hooks are installed by `npm install` (the `prepare` script).

The bump is skipped for merge commits, during a rebase, when you run `git commit --amend`, and when
other changes are left staged (`git commit <path>`). To skip it once:

```bash
NO_VERSION_BUMP=1 git commit -m "chore: no bump"
```

Full guide: [Writing commit messages](docs/commit-messages.md).

## Adding content

New lessons and stories are `.md` files in `src/content/`. No application code changes are required.

- [Adding lessons and stories](docs/adding-content.md)
- [AI prompt template](docs/prompt-add-content.md) (Russian)

## Project structure

```
src/
  app/                 # App (route table) and Providers
  components/
    layout/            # AppShell, ReaderShell, BottomNav
    ui/                # ProgressBar, ProgressRing, BackButton
    feedback/          # ErrorBoundary, NotFound
  features/
    reading/           # lesson/story progress, metrics, their pages
    cards/             # flashcard decks, progress, their pages
    reader/            # reader settings, markdown viewer, scroll handling
  pages/               # screens that read from several features
  lib/                 # content index
  generated/           # cards.generated.ts (written by generate:cards)
  styles/              # theme tokens, base reset, per-area component CSS
  content/
    lessons/           # lessons (*.md)
    stories/           # stories (*.md)
docs/                  # content documentation
```

Modules are imported through the `@/` alias (`@/features/cards/cards`), configured in
`tsconfig.json` and `vite.config.ts`.

## Styling

Tailwind v4 provides the design tokens and utility classes. `src/styles/theme.css` is the single
source of colour, font and shadow tokens; because they use Tailwind's namespaces, each token also
yields a utility (`--color-surface` gives `bg-surface`).

Tailwind's Preflight is **not** imported — it would strip markdown list markers, turn icons into
block elements and reset heading sizes. `src/styles/base.css` is the reset instead. Existing
screens keep their semantic classes (`.content-row`, `.study-card`), split by area under
`src/styles/components/`; new work should prefer utilities.

## License

Private project (`private: true` in `package.json`).
