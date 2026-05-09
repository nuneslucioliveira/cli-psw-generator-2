# Security Gate (Ad-hoc / Code-Review Trigger) — Augmentation / Agency SOP

## Objective

Perform a standalone security scan of a provided code context (PR, branch, file list, or change description) and manage each finding to resolution by severity. Success condition: every finding has been classified, evaluated for architectural impact, and either fixed (with a dedicated commit and passing tests), escalated pending an ADR, or escalated for explicit human approval — and a findings summary has been delivered or returned to the caller.

This workflow is triggered in two scenarios:

- **Ad-hoc**: a human directly requests a security scan on existing code — a PR number or URL, a branch, a file list, or a freeform description of a change.
- **Code-review trigger**: invoked by `code-review.md` when the reviewer requests a dedicated security analysis beyond the Layer 2 checklist.

This workflow does not replace the inline security logic at Step 3.5 of `implement-issue.md`. It covers only the ad-hoc and code-review-triggered scenarios.

The active mode is inherited from the SKILL.md pipeline — the Companion must not ask. In **Augmentation** mode, the Companion presents each finding and its proposed disposition to the human for approval before acting. In **Agency** mode, the Companion executes dispositions autonomously, halting only at hard stops (structural findings requiring ADRs and high-severity findings).

The Companion never writes files directly. All file operations are delegated via Task.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| Scan context | Required — halt if absent | One of: PR number or URL, branch name, file list, or freeform description of the change to scan. If called from `code-review.md`: PR identifier and diff are passed directly by the caller — do not ask the human. |
| Caller | Optional | One of: `ad-hoc` (default if absent) or `code-review`. Determines notification behaviour at Step 4. |
| Mode | Inherited | Read from the active SKILL.md pipeline. Do not ask. |

Do not proceed past this point until scan context is confirmed. If scan context is absent, state the requirement and wait for explicit human input before proceeding.

---

## Sequential steps

### Step 0 — Context resolution

Resolve the scannable context:

- If a PR number or URL was provided: delegate a Task to fetch the PR diff via `gh pr diff <number>`. Extract the changed file list and the full diff. Record the PR identifier.
- If a branch name was provided: delegate a Task to produce the diff between the branch and its base via `git diff <base>..<branch>`. Extract the changed file list and the full diff.
- If a file list was provided: delegate a Task to read each file. Produce a combined content snapshot.
- If a freeform description was provided: use the description directly as scan context.
- If called from `code-review.md`: the PR identifier and diff are already resolved and passed by the caller. Use them directly. Do not re-fetch.

If none of the above yields a non-empty scannable context: halt. State that no scannable context could be resolved from the provided input. Wait for explicit human instruction before proceeding.

---

### Step 1 — Security scan

Construct a delegation prompt for the `engineering-security-engineer` agent: scan the resolved code context for security risks. For each finding, classify severity as `low`, `medium`, or `high`. Return the complete findings list, including: severity, affected file and line range (if determinable), a description of the risk, and the attack surface or vulnerability class. Pass the delegation prompt through `@promptmind` before sending. Delegate via Task.

When the agent returns:

- If the findings list is empty: proceed directly to Step 4. Do not execute Steps 2 or 3.
- If findings are present: proceed to Step 2 for each finding.

---

### Step 2 — Structural evaluation

**REANCHORING:** Re-read directly (do not delegate via Task): `SKILL.md` and `hard-stops.md`. Do not proceed until both files have been read in this session after the previous step completed.

For each finding returned in Step 1, regardless of severity:

Construct a delegation prompt for the `architect` agent: evaluate this finding and determine whether it represents a structural problem requiring a new ADR (an architectural gap not previously anticipated in any accepted ADR) or an implementation detail that is fixable within the current architecture without a new ADR. Return one of two classifications: `structural` or `implementation-detail`, with a one-paragraph justification. Pass through `@promptmind`. Delegate via Task.

Collect the architect's classification for every finding before proceeding to Step 3. Do not interleave Step 3 dispositions with Step 2 evaluations — complete all evaluations first.

---

### Step 3 — Finding disposition

Process each finding in order, applying the disposition logic below. Complete each finding's disposition fully before moving to the next finding.

#### Structural finding (ADR needed)

Halt immediately. Present the following to the human:

- The full finding from Step 1 (severity, description, affected location).
- The architect's classification and justification from Step 2.
- The explicit statement: "This finding requires a new ADR before it can be addressed. Open a new session and run `create-adr.md` to author the ADR. When the ADR reaches `status: accepted`, return to this session to continue."

Wait for explicit human confirmation that the ADR has been accepted and the human is ready to resume before proceeding.

On return: construct a delegation prompt for the `architect` agent — validate that the accepted ADR governs the finding and that its Implementation Notes are sufficient to guide a fix. Pass through `@promptmind`. Delegate via Task. If the architect confirms the ADR is sufficient: continue to the next finding. If not: surface the gap to the human and wait for explicit instruction.

#### Implementation detail — Low or Medium severity

Construct a delegation prompt for the `architect` agent: propose a concrete fix for this finding that is consistent with the current architecture and all accepted ADRs. Pass through `@promptmind`. Delegate via Task.

When the architect returns the proposed fix:

Run a mini-TDD cycle:

1. Delegate a Task to write a test that verifies the fix (the test must fail before the fix is applied).
2. Delegate a Task to implement the fix.
3. Delegate a Task to run the test suite. Expect the new test to pass green.
4. If the test is red: delegate a correction Task. Loop until green or until 5 iterations are reached without progress — at which point signal stagnation, present the failing test output and the last correction attempted, and wait for explicit human instruction before continuing.

When tests are green: delegate a Task to commit the fix with the message `fix(security): <description>` where `<description>` is a one-line summary of what was fixed. This must be a dedicated commit — do not bundle it with other changes.

#### Implementation detail — High severity

Construct a delegation prompt for the `architect` agent: design a complete solution for this finding. The design must include: the root cause, the proposed fix at the code level, and the ADRs or architectural patterns it relies on. Pass through `@promptmind`. Delegate via Task.

When the architect returns the proposed solution:

Present the following to the human:

- The full finding (severity, description, affected location).
- The architect's complete proposed solution.
- The explicit statement: "High severity findings require explicit approval before implementation. Review the proposed solution and confirm whether to proceed as described, propose a modification, or escalate further."

Halt and wait for explicit human approval of the approach before taking any implementation action.

On approval: run the same mini-TDD cycle described in the low/medium path. Apply the same stagnation rule (5 iterations). Commit with `fix(security): <description>` as a dedicated commit.

---

### Step 4 — Notification

Compose the findings summary:

- Total number of findings.
- Count per severity: `low`, `medium`, `high`.
- For each finding: severity, description, disposition taken — one of: `fixed (commit: <hash>)`, `pending ADR`, `escalated (awaiting human approval)`.

If called from `code-review.md` (`caller: code-review`): return the findings summary directly to the calling workflow.

---

## Expected output

1. **Findings list** — every finding from Step 1, with severity, affected location, and description.
2. **Architect evaluations** — one classification (`structural` or `implementation-detail`) with justification per finding.
3. **Fixes committed** (if any) — one dedicated `fix(security):` commit per fixed finding, with the commit hash recorded.
4. **Escalation record** (if any) — for each structural finding: ADR title and status; for each high-severity finding awaiting human approval: finding description and current disposition.
5. **Notification sent** (if ad-hoc) or **findings summary returned** (if called from `code-review.md`).

---

## D4 gate

After Step 4 completes, present the findings summary to the human. State explicitly which findings were fixed, which are pending ADRs, and which are awaiting human approval.

Ask the human what to do next. Do not suggest a default. Do not move. Wait for an explicit decision before taking any action.

---

## Exceptions

| Condition | Response |
|---|---|
| No scannable context provided or resolved | Halt at Step 0; state the requirement; wait for explicit human input before proceeding |
| No findings returned by Step 1 | Proceed directly to Step 4; do not execute Steps 2 or 3; notify with "no security findings identified" |
| Structural finding requiring ADR | Halt at Step 3; present finding and architect's assessment; instruct human to open new session and run `create-adr.md`; wait for return with confirmed accepted ADR before resuming |
| High-severity finding | Halt at Step 3; present finding and architect's proposed solution; wait for explicit human approval of the approach before any implementation begins |
| Mini-TDD stagnation (5 iterations without progress on a single finding) | Signal stagnation; present the failing test output and last correction attempted; wait for explicit human instruction — do not attempt further corrections autonomously |
| ADR validation after return: architect finds the accepted ADR insufficient | Surface the gap to the human; describe what the ADR is missing relative to the finding; wait for explicit human instruction before continuing |
| Called from `code-review.md` — notification path | Return the findings summary directly to the calling workflow |
| PR diff fetch fails (Step 0) | Report the error verbatim; wait for the human to provide an alternative scannable context (file list or freeform description) before proceeding |
| All findings are structural (no implementation path reached) | Complete Step 3 halts for all structural findings; proceed to Step 4 with disposition `pending ADR` for each; continue normally |
