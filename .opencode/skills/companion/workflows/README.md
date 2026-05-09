# companion / workflows

## Purpose

This directory contains workflows written for the Companion to execute, not for humans to read directly.

## Difference from docs/shared/workflows/

- **docs/shared/workflows/** — human-readable process guides, narrative style, owned by the methodology documentation
- **.opencode/skills/companion/workflows/** — machine-executable SOPs, structured format, consumed by the Companion in Agency mode

## SOP structure every workflow in this directory must follow

1. **Objective** — what the workflow accomplishes and its success condition
2. **Required inputs** — every piece of information the Companion must have before starting; execution must halt if any required input is missing
3. **Sequential steps** — numbered, imperative steps; each step produces a verifiable intermediate state
4. **Expected output** — the exact format and content of the final deliverable, including any fixed template the output must follow
5. **Exceptions** — explicit conditions that deviate from the normal flow, with the required action for each


