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

## Adding content

New lessons and stories are `.md` files in `src/content/`. No application code changes are required.

- [Adding lessons and stories](docs/adding-content.md)
- [AI prompt template](docs/prompt-add-content.md) (Russian)

## Project structure

```
src/
  content/
    lessons/     # lessons (*.md)
    stories/     # stories (*.md)
  pages/         # app screens
  features/      # progress, reader settings
docs/            # content documentation
```

## License

Private project (`private: true` in `package.json`).
