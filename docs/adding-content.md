# Adding Lessons and Stories

> Russian version: [dobavlenie-kontenta.md](./dobavlenie-kontenta.md)

This guide explains how to add new lessons and stories to the Romanian learning app. Content lives in Markdown files with YAML frontmatter — no application code changes are required.

## Overview

| Type | Folder | Route |
| --- | --- | --- |
| Lessons | `src/content/lessons/` | `/lessons/{id}` |
| Stories | `src/content/stories/` | `/stories/{id}` |

The app automatically discovers all `.md` files in these folders at build time and during dev. There is no separate registry or index file.

```
src/content/lessons/*.md  ──┐
                            ├──► content.ts ──► lists and readers
src/content/stories/*.md  ──┘
```

## Frontmatter schema

Every file starts with a YAML block between `---`:

```yaml
---
id: lesson-08
order: 8
title: Transportul
subtitle: Транспорт
level: A1
wordCount: 45
---
```

### Required fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Globally unique identifier across **all** lessons and stories |
| `order` | number | Display order in the list (sorted ascending) |
| `title` | string | Title in Romanian |

### Optional fields

| Field | Description |
| --- | --- |
| `subtitle` | Russian subtitle — shown in lists and the reader |
| `level` | CEFR level (`A1`, `A2`, etc.); defaults to `A1` in the UI if omitted |
| `wordCount` | Approximate word count — set manually, not calculated automatically |

## Naming conventions

These follow existing content conventions; the parser does not enforce them:

| Element | Format | Example |
| --- | --- | --- |
| Filename | `{NN}-{slug}.md` | `08-transport.md` |
| Lesson ID | `lesson-{NN}` | `lesson-08` |
| Story ID | `story-{NN}` | `story-06` |
| `order` | Integer in sequence | `8` |
| `title` | Romanian | `Transportul` |
| `subtitle` | Russian | `Транспорт` |

Filename and `id` do not have to match — only `id` and `order` in frontmatter affect routing and sorting.

**Current content:** 7 lessons (`lesson-01`…`lesson-07`), 5 stories (`story-01`…`story-05`).

## Adding a new lesson

1. Create `src/content/lessons/08-{slug}.md` (next number after the last lesson).
2. Add frontmatter with a unique `id: lesson-08` and `order: 8`.
3. Write the lesson body in Romanian using Markdown.
4. Set `wordCount` to an approximate word count.
5. Ensure `id` does not collide with any existing lesson or story.
6. Save the file — the dev server picks it up via HMR.
7. Check `/lessons` and `/lessons/lesson-08`.

## Adding a new story

1. Create `src/content/stories/06-{slug}.md`.
2. Add frontmatter with `id: story-06`, `order: 6`, and the remaining fields.
3. Write the story text in Romanian.
4. Set `wordCount` — reading progress in the UI depends on it.
5. Save and verify `/stories` and `/stories/story-06`.

## Markdown format

Text is rendered with `react-markdown` and the `remark-gfm` plugin. Supported elements:

- headings `#`, `##`, `###`
- **bold text** and bullet lists
- blockquotes `>`
- GFM tables
- horizontal rules `---`

### Lesson example

File: `src/content/lessons/01-salutari.md`

```markdown
---
id: lesson-01
order: 1
title: Salutări
subtitle: Приветствия
level: A1
wordCount: 20
---

# Salutări

**Bună ziua!** Eu sunt Ana din București. Tu ești student. Noi învățăm limba română împreună.

## Cuvinte noi

| Română | Русский |
| --- | --- |
| bună | привет |
| ziua | день |
| salut | здравствуй |
| mulțumesc | спасибо |

> Începe cu un zâmbet și cu un simplu „Bună!”.

### Expresii utile

- **Bună!** — Привет!
- **Bună ziua!** — Добрый день!
- **La revedere!** — До свидания!
```

### Story example

File: `src/content/stories/01-seara-bucuresti.md`

```markdown
---
id: story-01
order: 1
title: O seară în București
subtitle: Вечер в Бухаресте
level: A1
wordCount: 180
---

# O seară în București

Este vineri seara. Ana și prietenul ei, Mihai, merg pe jos prin centrul Bucureștiului. Străzile sunt aglomerate, dar atmosfera este calmă.

Se opresc lângă o librărie și privesc vitrinele. Ana găsește o carte despre istoria orașului. Mihai propune să bea o cafea într-un loc mic din apropiere.

> Bucureștiul este diferit în fiecare seară.
```

## How lessons and stories differ in the app

| | Lesson | Story |
| --- | --- | --- |
| Progress | Status: new / in progress / completed | Scroll percentage + "Read" |
| Completion | "Complete lesson" button | "Mark as read" button + auto progress on scroll |
| Reader header | "Lesson NN · A1" | "Story NN · A1" + progress bar |
| On open | Automatically marked in progress | Scroll position is saved |

## Common errors

If frontmatter is invalid, the app shows an error screen: "Check YAML frontmatter and Markdown in src/content."

| Error | Cause |
| --- | --- |
| `Missing YAML frontmatter` | No `---` block at the start of the file |
| `Invalid id/order/title` | Field missing or empty |
| `expected a number` | `order` or `wordCount` is not a number |
| `Duplicate content id` | Same `id` on two files (including lesson + story) |

## Verification

```bash
npm run dev
```

Open in the browser:

- `/lessons` — new lesson appears in the list
- `/lessons/{id}` — content and completion button
- `/stories` — new story appears in the list
- `/stories/{id}` — reading progress and "Mark as read" button

## What you do not need to do

- Do not edit `src/lib/content.ts`, routes, or components
- Do not add TypeScript imports for new content
- Do not create index or registry files

Adding a `.md` file to the correct folder with valid frontmatter is enough.
