#!/usr/bin/env bash
# B-04: check-no-shared-docs-staged.sh
# Usage: bash check-no-shared-docs-staged.sh
# Checks that no docs/shared/ files are staged together with non-docs/shared/ files.
# Rule: SCM hard-stops — docs/shared/ changes require a separate logically isolated PR
# Exit 0 = PASS, Exit 1 = FAIL

set -euo pipefail

# ---------------------------------------------------------------------------
# Verify we are inside a git repository
# ---------------------------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "FAIL"
  echo "- [git:0] Not inside a git repository — cannot check staged files (rule: SCM hard-stops)"
  exit 1
fi

# ---------------------------------------------------------------------------
# Collect staged files (index vs HEAD, or index vs empty-tree for new repos)
# ---------------------------------------------------------------------------
# Use --cached to list files in the index (staged area)
staged_files="$(git diff --cached --name-only 2>/dev/null || true)"

if [[ -z "${staged_files}" ]]; then
  # Nothing staged — nothing to check
  echo "PASS"
  exit 0
fi

# ---------------------------------------------------------------------------
# Classify staged files
# ---------------------------------------------------------------------------
shared_docs_files=()
other_files=()

while IFS= read -r file; do
  [[ -z "${file}" ]] && continue
  if [[ "${file}" == docs/shared/* ]]; then
    shared_docs_files+=("${file}")
  else
    other_files+=("${file}")
  fi
done <<< "${staged_files}"

# ---------------------------------------------------------------------------
# Evaluate
# ---------------------------------------------------------------------------
if [[ ${#shared_docs_files[@]} -gt 0 && ${#other_files[@]} -gt 0 ]]; then
  echo "FAIL"
  echo "- [git:0] docs/shared/ files are staged alongside application files — they should be committed in logically separated PRs (rule: SCM hard-stops)"
  echo "  docs/shared/ files staged:"
  for f in "${shared_docs_files[@]}"; do
    echo "    - ${f}"
  done
  echo "  Other files staged:"
  for f in "${other_files[@]}"; do
    echo "    - ${f}"
  done
  exit 1
fi

echo "PASS"
exit 0
