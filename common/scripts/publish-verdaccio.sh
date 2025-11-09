#!/usr/bin/env bash
set -Eeuo pipefail

# --------------------------------------------------------------------
# Local publish to Verdaccio (no Git pushes, no Rush publish workflow)
#
# What it does:
#   - Verifies Verdaccio reachability.
#   - Ensures NPM_TOKEN for //localhost:4873/.
#   - Optionally bumps versions via "rush version".
#   - Publishes @quojs/* packages to Verdaccio only if the EXACT version
#     does not already exist (skips duplicates to avoid 409).
#       --registry <verdaccio>
#       --access public (scoped)
#       --ignore-scripts (avoid husky & prepack mishaps)
#
# Usage:
#   common/scripts/publish-verdaccio.sh [--registry URL]
#                                       [--skip-bump] [--skip-tests]
#
# Examples:
#   common/scripts/publish-verdaccio.sh
#   common/scripts/publish-verdaccio.sh --registry http://localhost:4873/
# --------------------------------------------------------------------

SCRIPT_DIR="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
cd "$REPO_ROOT"

REGISTRY="http://localhost:4873"
SKIP_BUMP="true"
SKIP_TESTS="false"

log()  { printf "\033[1;34m[publish-verdaccio]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*"; }
die()  { printf "\033[1;31m[error]\033[0m %s\n" "$*"; exit 1; }
need() { command -v "$1" >/dev/null || die "Missing dependency: $1"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --registry)   REGISTRY="${2%/}/"; shift 2 ;;
    --skip-bump)  SKIP_BUMP="true"; shift ;;
    --skip-tests) SKIP_TESTS="true"; shift ;;
    -h|--help)
      cat <<EOF
Usage: common/scripts/publish-verdaccio.sh [--registry URL] [--skip-bump] [--skip-tests]
Defaults: --registry http://localhost:4873/
EOF
      exit 0 ;;
    *) die "Unknown arg: $1" ;;
  esac
done

need curl
need node
need pnpm
need rush

log "Repo root: $REPO_ROOT"
log "Registry:  $REGISTRY"

# 1) Reachability
if ! curl -fsS "${REGISTRY%-/}/-/ping" >/dev/null 2>&1; then
  die "Verdaccio not reachable at ${REGISTRY}. Start it first (e.g., docker compose -f ops/verdaccio/docker-compose.yml up -d)"
fi
log "Verdaccio ping OK."

# 2) Token
HOST="$(printf "%s" "$REGISTRY" | sed -E 's|^https?://||; s|/.*$||')"
if [[ -z "${NPM_TOKEN:-}" ]]; then
  if [[ -f "$HOME/.npmrc" ]]; then
    TOKEN="$(awk -v h="$HOST" 'match($0, "^//"h"/:_authToken=(.+)$", a){print a[1]}' "$HOME/.npmrc" | tail -n1 || true)"
    [[ -n "$TOKEN" ]] && export NPM_TOKEN="$TOKEN"
  fi
fi
[[ -n "${NPM_TOKEN:-}" ]] || die "NPM_TOKEN not set for //$HOST/. Run: npm adduser --registry ${REGISTRY}"

# 3) Optional bump
if [[ "$SKIP_BUMP" != "true" ]]; then
  log "Generating change files…"
  rush change -v || warn "No change files; proceeding"
  log "Applying version bump (rush version)…"
  rush version || warn "Version bump skipped or failed; proceeding"
else
  warn "Skipping version bump (--skip-bump)."
fi

# 4) Discover publish targets strictly under ./packages/*/package.json
log "Discovering @quojs/* publish targets…"

# Outputs lines: "<name>\t<version>\t<absPath>"
PUBLISH_LIST="$(
  find "$REPO_ROOT/packages" -mindepth 2 -maxdepth 2 -type f -name package.json -print0 \
    | xargs -0 -I{} bash -c '
        set -euo pipefail
        PKG_JSON="{}"
        DIR="$(dirname "$PKG_JSON")"

        # Read fields via Node; pass the path as argv[1] to avoid quoting issues
        name=$(node -p "(() => { try { const p = require(process.argv[1]); return p.name ?? \"\" } catch { return \"\" } })()" "$PKG_JSON")
        version=$(node -p "(() => { try { const p = require(process.argv[1]); return p.version ?? \"\" } catch { return \"\" } })()" "$PKG_JSON")
        is_private=$(node -p "(() => { try { const p = require(process.argv[1]); return p.private ? 1 : 0 } catch { return 0 } })()" "$PKG_JSON")

        # Filters: scoped, not private, has version; exclude meta/tools packages
        if [[ "$name" == @quojs/* && "$is_private" -eq 0 && -n "$version" ]]; then
          if [[ "$name" != "@quojs/repo-tools" && "$name" != "@quojs/quojs" ]]; then
            printf "%s\t%s\t%s\n" "$name" "$version" "$DIR"
          fi
        fi
      ' \
    | sort -u
)"

if [[ -z "$PUBLISH_LIST" ]]; then
  warn "No publishable @quojs/* packages found under ./packages."
fi

# 4b) Check registry and publish only missing versions (via pnpm)
if [[ -z "$PUBLISH_LIST" ]]; then
  warn "No publishable @quojs/* workspaces found."
else
  log "Checking which versions are missing on the registry…"
  MISSING=()
  while IFS=$'\t' read -r NAME VERSION PKG_DIR; do
    [[ -z "${NAME:-}" ]] && continue
    if pnpm view --registry "$REGISTRY" "$NAME@$VERSION" version >/dev/null 2>&1; then
      log "SKIP  $NAME@$VERSION (already on registry)"
    else
      log "NEEDS $NAME@$VERSION"
      MISSING+=("$NAME"$'\t'"$VERSION"$'\t'"$PKG_DIR")
    fi
  done <<< "$PUBLISH_LIST"

  if (( ${#MISSING[@]} == 0 )); then
    log "Nothing to publish. All versions already exist."
  else
    log "Publishing ${#MISSING[@]} package(s)…"
    for LINE in "${MISSING[@]}"; do
      NAME="${LINE%%$'\t'*}"
      REST="${LINE#*$'\t'}"; VERSION="${REST%%$'\t'*}"
      PKG_DIR="${LINE##*$'\t'}"

      log "Publishing $NAME@$VERSION from $PKG_DIR"
      (
        cd "$PKG_DIR"
        # pnpm publish to Verdaccio; ignore scripts; no provenance flag needed
        if ! pnpm publish \
              --registry "$REGISTRY" \
              --access public \
              --ignore-scripts \
              --no-git-checks; then
          code=$?
          warn "Publish failed for $NAME@$VERSION (exit $code). Checking if it’s just already published…"
          if pnpm view --registry "$REGISTRY" "$NAME@$VERSION" version >/dev/null 2>&1; then
            warn "It appears published now; continuing."
          else
            die "Hard failure publishing $NAME@$VERSION (exit $code)."
          fi
        fi
      )
    done
    log "Publish step completed."
  fi
fi

# 5) Optional example install/build smoke (against Verdaccio)
if [[ "$SKIP_TESTS" == "true" ]]; then
  warn "Skipping example smoke (--skip-tests)."
  exit 0
fi

log "Running example smoke against freshly published packages…"
if [[ -d "examples/quojs-in-react" ]]; then
  pushd "examples/quojs-in-react" >/dev/null
  npm_config_registry="$REGISTRY" pnpm install
  if npm pkg get scripts.build >/dev/null 2>&1; then pnpm build; fi
  popd >/dev/null
fi

log "Done."
