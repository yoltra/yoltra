/**
 * commitlint config for the Yoltra monorepo — Conventional Commits.
 *
 * Enforced by common/git-hooks/commit-msg via the rush-commitlint autoinstaller.
 * After editing this autoinstaller's dependencies, run:
 *   rush update-autoinstaller --name rush-commitlint
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allowed commit types.
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"],
    ],
    // Do not fight long, wrapped bodies/footers — our release notes get detailed.
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
    // Subjects may contain proper nouns / code identifiers in any case.
    "subject-case": [0],
  },
};
