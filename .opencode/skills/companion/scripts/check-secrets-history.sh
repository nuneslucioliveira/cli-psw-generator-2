#!/usr/bin/env bash
# check-secrets-history.sh — scan git history for leaked secrets
# Used by companion during code review to scan the full branch history.
# Calls gitleaks directly.
#
# Usage: bash scripts/check-secrets-history.sh
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
  echo "- [environment] gitleaks not found in PATH (rule: secrets must be scanned in git history)"
  exit 1
fi

if [ ! -f "$GITLEAKS_CONFIG" ]; then
  echo "FAIL"
  echo "- [environment] gitleaks config not found at $GITLEAKS_CONFIG (rule: secrets must be scanned in git history)"
  exit 1
fi

if OUTPUT=$(gitleaks git \
  -c "$GITLEAKS_CONFIG" \
  -l error \
  --no-banner \
  --no-color \
  --redact=50 2>&1); then
  EXIT_CODE=0
else
  EXIT_CODE=$?
fi

if [ $EXIT_CODE -eq 0 ]; then
  echo "PASS"
  exit 0
else
  echo "FAIL"
  echo "- [git-history] gitleaks detected potential secrets in git history — review and remediate before merging (rule: SCM hard-stop, secrets must not persist in git history)"
  if [ -n "$OUTPUT" ]; then
    echo ""
    echo "gitleaks output:"
    echo "$OUTPUT"
  fi
  exit 1
fi
