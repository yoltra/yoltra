#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const COMMIT_MSG_FILE = process.argv[2];
if (!COMMIT_MSG_FILE) process.exit(0);

let msg = fs.readFileSync(COMMIT_MSG_FILE, "utf8").trim();

// Skip merges, empty messages
if (/^Merge /.test(msg) || msg.length === 0) process.exit(0);

//1) Conventional Commits
const CC_RE =
  /^(revert:\s*)?(feat|fix|docs|style|refactor|perf|test|build|ci|chore|release|revert)(\([\w\-.:/]+\))?!?:\s.+/;

if (!CC_RE.test(msg)) {
  console.error(
    "\n❌ commit-msg: not a Conventional Commit.\n" +
      "Expected: <type>(scope?): <subject>\n" +
      "Types: feat|fix|docs|style|refactor|perf|test|build|ci|chore|release|revert\n" +
      "Example: feat(yoltra): add deep path subscriptions\n"
  );
  process.exit(1);
}

// 2) DCO: author must be signed off */
// Ensure DCO doc exists at repo root so policy is explicit
let gitRoot = "";
try {
  gitRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
} catch {
  // Repo root unknown — be strict anyway
}

const hasDco =
  gitRoot &&
  ["DCO", "DCO.md", "dco", "dco.md"].some((f) => fs.existsSync(path.join(gitRoot, f)));
if (!hasDco) {
  console.error(
    "\n❌ commit-msg: DCO policy is enabled, but no DCO file was found at the repo root.\n" +
      "Add a DCO document (e.g., `DCO` or `DCO.md`) to the root of the monorepo."
  );
  process.exit(1);
}

// Extract author from Git
function getAuthor() {
  try {
    const ident = execSync("git var GIT_AUTHOR_IDENT", { encoding: "utf8" }).trim();
    // Format: "Name <email> timestamp tz"
    const m = /^([^<]+)<([^>]+)>/.exec(ident);
    if (m) {
      return {
        name: m[1].trim().replace(/\s+/g, " "),
        email: m[2].trim().toLowerCase(),
      };
    }
  } catch {}
  return { name: "", email: "" };
}

const author = getAuthor();
if (!author.name || !author.email) {
  console.error(
    "\n❌ commit-msg: unable to determine commit author (GIT_AUTHOR_IDENT).\n" +
      "Ensure your Git author.name and author.email are configured."
  );
  process.exit(1);
}

// Find Signed-off-by trailers (case-insensitive label, strict content)
const SIGNOFF_LABEL_RE = /^signed-off-by:/i;
const SIGNOFF_LINE_RE =
  /^Signed-off-by:\s*([^<]+?)\s*<([^>\s@]+@[^>\s@]+\.[^>\s@]+)>\s*$/;

const lines = msg.split(/\r?\n/);
const signoffPeople = [];
let malformedSignoff = null;

for (const raw of lines) {
  const line = raw.trim();
  if (!SIGNOFF_LABEL_RE.test(line)) continue;
  const m = SIGNOFF_LINE_RE.exec(line);
  if (!m) {
    malformedSignoff = raw;
    break;
  }
  const name = m[1].trim().replace(/\s+/g, " ");
  const email = m[2].trim().toLowerCase();
  signoffPeople.push({ name, email });
}

if (malformedSignoff) {
  console.error(
    "\n❌ commit-msg: malformed DCO sign-off:\n" +
      `  ${malformedSignoff}\n` +
      "Expected exactly:\n" +
      "  Signed-off-by: Your Name <you@example.com>\n"
  );
  process.exit(1);
}

if (signoffPeople.length === 0) {
  console.error(
    "\n❌ commit-msg: missing DCO sign-off.\n" +
      "Add a trailer line to your commit message:\n" +
      "  Signed-off-by: Your Name <you@example.com>\n" +
      "Tip: use `git commit -s` to add it automatically.\n"
  );
  process.exit(1);
}

// Require that the author is among the sign-offs
const authorIsSigned =
  signoffPeople.find(
    (p) =>
      p.email.toLowerCase() === author.email.toLowerCase() &&
      p.name.toLowerCase() === author.name.toLowerCase()
  ) !== undefined;

if (!authorIsSigned) {
  console.error(
    "\n❌ commit-msg: author is not among the DCO sign-offs.\n" +
      `Author: ${author.name} <${author.email}>\n` +
      "Add a matching sign-off line, or use `git commit -s`.\n"
  );
  process.exit(1);
}

process.exit(0);
