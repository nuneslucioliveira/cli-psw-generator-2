# Code Review — Agency SOP

## Objective

Perform a structured review of a Pull Request across two analysis layers: a boolean checklist (pass/fail per item) and an interpretive analysis (architectural consistency, REQ alignment, and reasoning quality). Success condition: a structured report has been delivered to the human reviewer and the human has made an explicit decision about what to do with the findings.

## Required inputs

- **PR identifier** (number or URL) — required; halt if absent
- **PR type** (one of: `code-implementation`, `documentation`, `mixed`) — required; halt if absent
- **Related ADRs** (if applicable) — conditional; collect if the PR description or linked REQ references any ADR
- **Related REQ** (if applicable) — conditional; collect if the PR description references a REQ
- **.github/PULL_REQUEST_TEMPLATE.md** from the repository — conditional; fetch if it exists; fall back to minimum criteria from `docs/shared/architecture/scm.md` if it does not

Do not proceed past this point until all required inputs are confirmed. If a required input is missing, state which one is missing and wait.

## Sequential steps

### Layer 1 — Boolean checklist

**Step 1.** Fetch the PR description and the repository's `.github/PULL_REQUEST_TEMPLATE.md`. If the template does not exist, load the minimum PR criteria from `docs/shared/architecture/scm.md`.

**Step 2.** For each item in the template (or minimum criteria), record one of: `PASS`, `BLOCKER`, `RECOMMENDATION`, or `N/A`.

- Mark `BLOCKER` when: the item is required by the template or scm.md and is absent or incomplete.
- Mark `RECOMMENDATION` when: the item is desirable but not required, and is absent or incomplete.
- Mark `N/A` when: the item does not apply to this PR type.

**Step 3.** Apply the criteria below regardless of PR type:

**Security gate — execute before any checklist evaluation:**

Run `.opencode/skills/companion/scripts/check-secrets-history.sh` to scan the git history for secrets using the project's gitleaks configuration.

If the script returns FAIL:
- Set VERDICT to `BLOCKED` immediately.
- Do not proceed to further checklist evaluation or Layer 2.
- Include the gitleaks output in the FINDINGS BY PRIORITY section.
- Surface the findings to the human and wait for instruction.

If the script returns PASS: proceed with the checklist table below.

| Criterion | Absent = |
|---|---|
| PR description covers: what changed, why it was necessary, expected impact | BLOCKER |
| Two reviewers assigned (one human + one agent) | BLOCKER |
| Commits follow Conventional Commits | BLOCKER |
| Branch is not `main` or `develop` | BLOCKER |

**Step 4.** Apply additional criteria based on the declared PR type:

- **code-implementation**: for each `AC-NNN` in the linked REQ, verify a corresponding test exists in the PR diff — absent AC coverage is a BLOCKER; check for circular references between modules; confirm codebase patterns are respected; confirm all `related-adrs` referenced in the linked REQ were consulted.
- **documentation**: verify status fields are correct and not set autonomously; verify IDs are unique and not renumbered (gaps are valid); verify index files were updated in the same PR; verify zero `TBD`, `TO-DO`, or `[to be defined]` in any document with `status: accepted`, `implemented`, or `delivered`.
- **mixed**: apply both sets above.

**Step 5.** Record every item with its result. Do not summarise at this stage — produce the full list. This list is the input to the expected output section.

Layer 1 is now complete. Proceed to Layer 2.

---

### Layer 2 — Interpretive analysis

**Step 6.** Evaluate architectural consistency.

- Determine whether the change is consistent with all ADRs in `status: accepted` that govern the affected service.
- Determine whether the change introduces new patterns, dependencies, or cross-service contracts that would require a new ADR.
- Identify any undocumented cross-service impact.

Record findings. If none: record "no issues identified".

**Step 7.** Evaluate REQ alignment.

- If a REQ is related: verify the implementation covers all `AC-NNN` items from that REQ. Flag each uncovered AC.
- Identify any scope creep — functionality present in the PR that is not covered by any AC in the linked REQ.
- Identify any ACs that appear uncovered by the diff.

If no REQ is related: record "n/a — no related REQ".

**Step 8.** Evaluate reasoning quality.

- Determine whether the PR description explains the *why* of decisions, not only the *what*.
- Identify any implicit decisions that should be made explicit — patterns introduced without explanation, trade-offs not acknowledged, architectural choices that look like implementation convenience.

Record findings. If none: record "adequate".

Layer 2 is now complete. Compose and deliver the report.

## Expected output

Produce the structured report in exactly this format. Do not omit any section. Do not add sections not listed here.

```
VERDICT: APPROVE | APPROVE WITH COMMENTS | REQUEST CHANGES | BLOCKED

LAYER 1 — CHECKLIST
[list of items: each on its own line — item description: PASS / BLOCKER / RECOMMENDATION / N/A]

LAYER 2 — INTERPRETIVE ANALYSIS
Architectural consistency: [findings or "no issues identified"]
REQ alignment: [findings or "n/a — no related REQ"]
Reasoning quality: [findings or "adequate"]

FINDINGS BY PRIORITY
[numbered list, most critical first; each entry includes: file/line if applicable, description, severity (BLOCKER / RECOMMENDATION)]

SUGGESTED NEXT STEPS
[what the author should do — the decision belongs to the human reviewer]

---
*Posted with AI assistance — companion*
```

> **Note:** This signature must appear as the last line of every comment posted to GitHub by this workflow.

Verdict rules:
- `BLOCKED` — one or more BLOCKERs in Layer 1 that prevent any further review from being meaningful (e.g., no PR description)
- `REQUEST CHANGES` — one or more BLOCKERs found across either layer
- `APPROVE WITH COMMENTS` — no BLOCKERs, one or more RECOMMENDATIONs
- `APPROVE` — all items PASS or N/A, no findings in Layer 2

## D4 gate

Hand the findings to the human for a decision.

When presenting each finding, be warm and encouraging without flattering; raise the point, do not resolve it. Keep responses short — expand only when the complexity of the finding genuinely justifies it; aim for two to five sentences per finding. Close each finding with an open question that invites the reviewer to think about the point — vary the phrasing across findings, do not repeat the same question formula. The Companion's role here is to open a conversation, not to close one.

This is not a script. The analysis is done — that was the Companion's part of the work, and it is complete. What happens next belongs entirely to the human: whether to comment on the PR, request changes, block the merge, approve, or something else. The Companion is ready to act on whatever the human decides, but will not move until that decision arrives.

Before anything else happens, ask the human what they want to do next. Surface the available options naturally — comment on the PR, request changes, approve, implement a fix, discard the findings, or something else entirely. Do not frame this as a menu. Do not suggest a default. Wait for an explicit decision before taking any action.

## Exceptions

- **PR without a description**: mark the PR description criterion as BLOCKER immediately; set VERDICT to BLOCKED; do not proceed to Layer 2. State the BLOCKED verdict and wait for human instruction.
- **PR targeting `main` or `develop`**: alert the user before any analysis — state the branch name and that this is an SCM violation per `docs/shared/architecture/scm.md`; ask whether to proceed anyway. Do not proceed until the human explicitly confirms.
- **Related ADR with `status: proposed`**: flag as a risk at the start of Layer 2 — state the ADR identifier and that its proposed status means the architectural decision it governs is not yet stable; include this as a BLOCKER in the findings.
- **Repository access unavailable**: report which resource could not be accessed, state that the review cannot proceed without it, and wait for the human to resolve the access issue or provide the content directly.
