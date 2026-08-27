#!/usr/bin/env node
/**
 * Bumps the package version from the Conventional Commits type of the commit
 * that was just created, then folds the change into that same commit.
 *
 *   major: ...     -> major
 *   feat: ...      -> minor
 *   anything else  -> patch
 *
 * Runs as a `post-commit` hook. Git snapshots the index before `commit-msg` and
 * `prepare-commit-msg`, so files staged from those hooks never reach the commit;
 * `pre-commit` is early enough but has no access to the message. Amending right
 * after the commit is therefore the only place where both are available.
 *
 * Skipped for merges, rebases, amends, when other changes are staged, and when
 * NO_VERSION_BUMP=1.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// A trailing "!" is tolerated but carries no meaning; the type alone decides the level.
const HEADER = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?!?:\s*\S/i;

function git(args, options = {}) {
  // `stdio: "ignore"` makes execFileSync return null rather than a string.
  return execFileSync("git", args, { encoding: "utf8", ...options })?.trim() ?? "";
}

function levelFor(message) {
  const header = message.trim().split(/\r?\n/, 1)[0] ?? "";

  if (/^Merge\b/.test(header)) return null;

  const match = header.match(HEADER);
  if (!match?.groups) return "patch";

  const type = match.groups.type.toLowerCase();
  if (type === "major") return "major";
  if (type === "feat") return "minor";
  return "patch";
}

function bump(version, level) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    throw new Error(`cannot bump non-semver version "${version}"`);
  }
  const [major, minor, patch] = parts;
  if (level === "major") return `${major + 1}.0.0`;
  if (level === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Rewrites only the top-level "version" value, so formatting stays untouched. */
function replaceVersion(source, next) {
  return source.replace(/^(\s*"version":\s*")[^"]*(")/m, `$1${next}$2`);
}

/** `GIT_REFLOG_ACTION` is not exported to `post-commit`, so read the reflog instead. */
function isAmend(root) {
  try {
    return git(["reflog", "-1", "--format=%gs"], { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).startsWith(
      "commit (amend)",
    );
  } catch {
    return false;
  }
}

function skipReason(root, gitDir) {
  if (process.env.NO_VERSION_BUMP === "1") return "disabled";
  if (existsSync(path.join(gitDir, "MERGE_HEAD"))) return "merge in progress";
  if (existsSync(path.join(gitDir, "rebase-merge")) || existsSync(path.join(gitDir, "rebase-apply"))) {
    return "rebase in progress";
  }
  if (isAmend(root)) return "amend";
  // `git commit <path>` leaves other changes staged; amending would sweep them in.
  if (git(["diff", "--cached", "--name-only"], { cwd: root })) return "other changes are staged";
  return null;
}

function main() {
  const root = git(["rev-parse", "--show-toplevel"]);
  const gitDir = path.resolve(root, git(["rev-parse", "--git-dir"], { cwd: root }));

  const skip = skipReason(root, gitDir);
  if (skip) {
    if (skip !== "disabled") console.log(`version: skipped (${skip})`);
    return;
  }

  const level = levelFor(git(["log", "-1", "--pretty=%B"], { cwd: root }));
  if (!level) {
    console.log("version: skipped (merge commit)");
    return;
  }

  const packagePath = path.join(root, "package.json");
  const packageSource = readFileSync(packagePath, "utf8");
  const current = JSON.parse(packageSource).version;
  const next = bump(current, level);

  writeFileSync(packagePath, replaceVersion(packageSource, next));

  const staged = [packagePath];
  const lockPath = path.join(root, "package-lock.json");
  if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    lock.version = next;
    if (lock.packages?.[""]) lock.packages[""].version = next;
    writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
    staged.push(lockPath);
  }

  git(["add", "--", ...staged], { cwd: root });
  // NO_VERSION_BUMP stops this hook from firing again for the amend it triggers.
  git(["commit", "--amend", "--no-edit", "--no-verify"], {
    cwd: root,
    env: { ...process.env, NO_VERSION_BUMP: "1" },
    stdio: "ignore",
  });

  console.log(`version: ${current} -> ${next} (${level})`);
}

try {
  main();
} catch (error) {
  // The commit already exists; a failed bump must not look like a failed commit.
  console.error(`version: bump failed — ${error instanceof Error ? error.message : String(error)}`);
}
