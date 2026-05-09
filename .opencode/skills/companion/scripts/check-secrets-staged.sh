#!/usr/bin/env bash
# check-secrets-staged.sh — scan staged files for secrets before delegating a commit
# Used by companion before delegating any git commit via Task.
# Calls gitleaks directly.
# Compatible with gitleaks 8.x (uses --pipe instead of removed --staged flag)
#
# Usage: bash scripts/check-secrets-staged.sh
# Output: PASS or FAIL with findings
# Exit code: 0 for PASS, 1 for FAIL
#
# Requires: gitleaks in PATH, run from any directory (paths are resolved relative to script location)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
GITLEAKS_CONFIG="$WORKSPACE_ROOT/.gitleaks.toml"

cd "$WORKSPACE_ROOT"

if ! command -v gitleaks &>/dev/null; then
  echo "FAIL"
  echo "- [environment] gitleaks not found in PATH (rule: secrets must be scanned before commit)"
  exit 1
fi

if [ ! -f "$GITLEAKS_CONFIG" ]; then
  echo "FAIL"
  echo "- [environment] gitleaks config not found at $GITLEAKS_CONFIG (rule: secrets must be scanned before commit)"
  exit 1
fi

# gitleaks 8.x: --staged removed, use git diff --staged piped to gitleaks detect --pipe
DIFF=$(git diff --staged 2>&1)

if [ -z "$DIFF" ]; then
  echo "PASS"
  echo "# NOTE: no staged files found — nothing to scan"
  exit 0
fi

if OUTPUT=$(echo "$DIFF" | gitleaks detect \
  --pipe \
  -c "$GITLEAKS_CONFIG" \
  --redact \
  --no-banner \
  --no-color \
  --exit-code 1 2>&1); then
  EXIT_CODE=0
else
  EXIT_CODE=$?
fi

if [ $EXIT_CODE -eq 0 ]; then
  echo "PASS"
  exit 0
else
  echo "FAIL"
  echo "- [staged-files] gitleaks detected potential secrets in staged files — do not commit (rule: SCM hard-stop, secrets must not enter git history)"
  if [ -n "$OUTPUT" ]; then
    echo ""
    echo "gitleaks output:"
    echo "$OUTPUT"
  fi
  exit 1
fi
