#!/usr/bin/env bash
# B-01: check-git-branch.sh
# Usage: bash check-git-branch.sh
# Checks that the current git branch is NOT 'main' or 'develop'.
# Rule: SCM hard-stops
# Exit 0 = PASS, Exit 1 = FAIL

set -euo pipefail

# ---------------------------------------------------------------------------
# Obtain the current branch name
# ---------------------------------------------------------------------------
current_branch=""

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  current_branch="$(git branch --show-current 2>/dev/null || true)"
fi

if [[ -z "${current_branch}" ]]; then
  # Could be a detached HEAD state — try symbolic-ref fallback
  current_branch="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
fi

if [[ -z "${current_branch}" ]]; then
  echo "FAIL"
  echo "- [git:0] Could not determine current branch (detached HEAD or not a git repository) (rule: SCM hard-stops)"
  exit 1
fi

# ---------------------------------------------------------------------------
# Check against forbidden branch names
# ---------------------------------------------------------------------------
if [[ "${current_branch}" == "main" || "${current_branch}" == "develop" ]]; then
  echo "FAIL"
  echo "- [git:0] Current branch is '${current_branch}' — commits must not be made directly to 'main' or 'develop'; create a feature branch first (rule: SCM hard-stops)"
  exit 1
fi

echo "PASS"
exit 0
