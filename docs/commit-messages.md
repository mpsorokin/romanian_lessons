# Writing commit messages that bump the version

The app version updates **automatically on every commit**. The bump level is taken from the
commit message.

The version in `package.json` is what the app shows under **Settings → About → Version**.
You never edit it by hand.

## Overview

```
git commit -m "feat: dark theme"
        │
        ├──► hook .husky/post-commit
        │       └──► scripts/bump-version.mjs
        │
        └──► 1.2.3 ──► 1.3.0   (in package.json + package-lock.json,
                                inside that same commit)
```

## Message format

```
type(scope): short description

optional body
```

Only the first line matters. The scope in parentheses is optional and never affects the level.

## Bump levels

| Message starts with | Level | Example |
| --- | --- | --- |
| `major:` | major | `1.2.3` → `2.0.0` |
| `feat:` | minor | `1.2.3` → `1.3.0` |
| anything else | patch | `1.2.3` → `1.2.4` |

Only two prefixes are special: `major` and `feat`. Everything else — `fix:`, `chore:`, or plain
free text with no prefix at all — bumps the patch number. There is no wrong message: a prefix is
only needed when you want minor or major.

## Examples

### Major — breaking changes

```bash
git commit -m "major: new progress storage format"
git commit -m "major(progress): rename maxProgress"
```

`1.2.3` → `2.0.0`. Use this when existing users would lose data or when a saved format changes.

### Minor — new functionality

```bash
git commit -m "feat: stats screen"
git commit -m "feat(reader): lazy content loading"
```

`1.2.3` → `1.3.0`.

### Patch — fixes, content, chores

```bash
git commit -m "fix: scroll position restore"
git commit -m "docs: update the content guide"
git commit -m "chore: bump dependencies"
git commit -m "refactor: extract settings clamping"
git commit -m "perf: memoise MarkdownViewer"
git commit -m "added lesson 21"
```

All of these give `1.2.3` → `1.2.4`.

## Common types

| Type | Use for | Level |
| --- | --- | --- |
| `major` | breaking change | major |
| `feat` | new user-facing capability | minor |
| `fix` | bug fix | patch |
| `docs` | documentation only | patch |
| `style` | formatting, no logic change | patch |
| `refactor` | rework with no new features or fixes | patch |
| `perf` | performance work | patch |
| `test` | tests | patch |
| `chore` | build, dependencies, configuration | patch |

The list is open: any type other than `major` and `feat` counts as patch.

> A trailing `!` (`feat!:`) is accepted but carries no meaning here — `feat!:` is still a minor
> bump. Write `major:` to get a major bump.

## What happens to your files

The hook edits `version` in `package.json` and `package-lock.json` and folds those edits **into
the commit you just made** (via `git commit --amend`). No separate "bump version" commit appears:
one commit stays one version.

Because of the amend, the commit hash changes right after it is created. That is safe for local
work — the hook runs before anything is pushed.

After committing you will see a line like:

```
version: 1.2.3 -> 1.3.0 (minor)
```

## When the version is not bumped

The hook deliberately skips these cases:

| Situation | Printed line |
| --- | --- |
| Merge commit (`Merge branch ...`) | `version: skipped (merge commit)` |
| A merge is in progress | `version: skipped (merge in progress)` |
| A rebase is in progress | `version: skipped (rebase in progress)` |
| `git commit --amend` | `version: skipped (amend)` |
| Other files are left staged | `version: skipped (other changes are staged)` |

The last one happens with `git commit <path>`, when only some of the staged files are committed.
Amending there would sweep the rest into the commit, so the bump is skipped instead. Your next
normal commit will bump as usual.

## Skipping the bump on purpose

```bash
NO_VERSION_BUMP=1 git commit -m "chore: no version change"
```

Useful for edits that should not count as a release — a README typo right after a commit, say.

## Setting a specific version

The hook can only add one to a single number. To jump to an arbitrary version (`1.0.0` → `2.5.0`),
edit the files yourself and commit with the bump disabled:

```bash
NO_VERSION_BUMP=1 git commit -am "chore: set version 2.5.0"
```

In `package-lock.json` the `version` field appears **twice** — at the root and in `packages[""]`.
Update both.

## If the hook does not run

Hooks are installed by `npm install` through the `prepare` script. After a fresh clone:

```bash
npm install
```

To check the wiring:

```bash
git config core.hooksPath   # expected: .husky/_
cat .husky/post-commit      # expected: node scripts/bump-version.mjs
```

A failure inside the hook never fails the commit itself — the commit already exists at that point.
You would see `version: bump failed — ...` and can bump the version manually.

## See also

- [Adding lessons and stories](./adding-content.md)
