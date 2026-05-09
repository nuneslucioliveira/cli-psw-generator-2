# Implement Issue — Augmentation / Agency SOP

## Objective

Execute a complete implementation cycle for a specific task — either from a GitHub issue or a freeform task description. Success condition: all AC-derived tests pass (integration and unit), a security assessment has been conducted and addressed, QA evidence has been collected (including screenshots), a code review has passed, the full project test suite runs green, and the implementation is committed on the feature branch.

The Companion orchestrates this workflow across two modes. In **Augmentation** mode, the Companion collaborates with the human at each step boundary — presenting plans, evidence, and decisions for approval before proceeding. In **Agency** mode, the Companion executes the full cycle autonomously, halting only at hard stops (security findings requiring ADRs, high-severity findings, stagnation, GIT:ready gates). The active mode is inherited from the SKILL.md pipeline — the Companion must not ask.

The Companion never writes files directly, never runs commands directly, and never commits directly. All execution is delegated via Task. Every delegation prompt passes through `@promptmind` before being sent to the executing agent.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| Task context | Required — halt if absent | Either a GitHub issue link/number OR a freeform task description. |
| Mode | Inherited | Read from the active SKILL.md pipeline. Do not ask. |

Do not proceed past this point until all required inputs are confirmed. If task context is missing, state the requirement and wait.

---

## Sequential steps

### Step 0 — Read context

If input is a GitHub issue link/number: delegate a Task to read the issue via `gh issue view`. Extract: title, body, mapped ACs, assigned persona, dependencies, labels.

**Blocked issue check:** If the issue has label `blocked:needs-adr`:
1. Delegate a Task to read the issue comments via `gh issue view $ISSUE_NUMBER --comments`.
2. Search comments for a reference to an ADR (e.g. "ADR-NNN created" or a link to an ADR file).
3. If found: check the status of the referenced ADR.
   - If `accepted`: delegate a Task to remove the label (`gh issue edit $ISSUE_NUMBER --remove-label 'blocked:needs-adr'`) and add a comment confirming the block is resolved (`gh issue comment $ISSUE_NUMBER --body "Block resolved: ADR-NNN is accepted. Resuming implementation."`). Proceed.
   - If `proposed`: report to the human that the ADR exists but has not been accepted yet. Wait.
4. If not found: report to the human that the block persists with no ADR created. Wait.

If input is a freeform description: use as context directly.

Glob `.opencode/skills/` for skills pertinent to the task context. Read the description of each matched skill. List the relevant skills — these will be passed as context to executing agents throughout this workflow.
Do NOT load these skills yourself. Instead, include their names in every delegation prompt so the executing agent loads and applies them directly.

Select the appropriate development agent based on context:
- `engineering-frontend-developer` for UI/React/Next.js work
- `engineering-backend-architect` for API/NestJS work
- `engineering-senior-developer` for general or cross-cutting work

Document the selection in the delegation prompt. Do not pause for confirmation.

Delegate a Task to apply the in-progress label to the issue: `gh issue edit $ISSUE_NUMBER --remove-label 'status:todo' --add-label 'status:wip'`

**Design reference resolution:** If the issue references a REQ, resolve the design reference context using the following priority order:

1. Run `.opencode/skills/companion/scripts/extract-figma-links.js <req-file>`.
   - If `PASS`: Figma links are available (Designer has iterated on the feature). Parse the `FIGMA_LINKS` JSON array. Store as **design fidelity context** — a list of `{ label, url, fileKey, nodeId }` objects. This is the primary visual reference for Steps 3 and 4.
   - If `SKIP` or `FAIL`: no Figma reference available. Proceed to step 2.

2. If no Figma reference: read the REQ file and check for a `## UX Intent` section.
   - If present: extract its full content. Store as **UX Intent context** — the PM's behavioural intent for the interface (user goal, key behaviors, structural constraints, behavioral edge cases). This is the behavioural reference for Step 3.
   - If absent: no design reference available. Step 3 proceeds against ACs only.

This resolution runs once at Step 0. The result — design fidelity context, UX Intent context, or none — is passed forward to Steps 3 and 4.

Read related ADR Implementation Notes if the issue references ADRs — extract mandatory patterns and known failure modes.

**Dev Mode Annotations:** If a Figma reference was resolved (design fidelity context set above): for each `{ fileKey, nodeId }` in the design fidelity context, call `get_design_context(fileKey, nodeId)` and inspect the returned code for elements containing `data-development-annotations` attributes. If any are found: extract their content and store as **design annotations context** — a list of `{ nodeId, annotation }` objects. These annotations contain implementation requirements specified by the Designer (e.g. animation assets, interaction details, accessibility notes) and MUST be treated as mandatory implementation constraints — not optional metadata. Include design annotations context in all delegation prompts for Steps 3 and 4.

### Step 1 — BDD: Write integration test

Derive integration test scenarios from the ACs (if issue) or from the task description.
Integration tests MUST verify observable runtime behaviour — HTTP responses, rendered output, CLI exit codes, or function return values against a running application. Tests that only verify file existence or file content are NOT integration tests and MUST be rejected. If the AC cannot be verified without the application running, the test must start the application before asserting.

Construct a delegation prompt for the `testing-api-tester` agent: write the integration/component test that validates the acceptance criteria. Include the relevant skills identified in Step 0 as context. Pass through `@promptmind`. Delegate via Task.

When the agent returns: delegate a Task to run the test. Expect it to fail (red). If it passes unexpectedly: flag to the human — the test may not be testing what it should.

### Step 2 — TDD: Write unit tests

Construct a delegation prompt for the selected development agent: write unit tests that cover the implementation-level contracts needed to satisfy the integration test. Include relevant skills and ADR Implementation Notes as context. Pass through `@promptmind`. Delegate via Task.

When the agent returns: delegate a Task to run the unit tests. Expect them to fail (red). If they pass unexpectedly: flag to the human.

### Step 3 — Implementation

**Delegation process (mandatory, all branches):** Before constructing the delegation prompt, the Companion MUST follow this numbered sequence:
1. Read the GitHub issue directly: confirm title, DoD items, AC identifiers, persona, dependencies, and any skill references.
2. If a Figma reference is available (design fidelity context set in Step 0): the Companion MUST call `get_design_context(fileKey, nodeId)` AND `get_screenshot(fileKey, nodeId)` directly (these are read-only queries — permitted per operating-context.md) for each referenced node BEFORE constructing the delegation prompt. Store both results as delegation context. Do NOT delegate these calls to the Dev — the Companion retrieves the design context and passes it as structured data in the prompt.
3. If no Figma reference is available but a UX Intent is available (set in Step 0): load the UX Intent content as delegation context.
4. Identify the relevant skills for this task from the list compiled in Step 0.
5. Construct the delegation prompt using the context gathered in steps 1–4. The prompt MUST reference the GitHub issue by URL or number. The prompt MUST include the relevant skill names so the executing agent loads and applies them. The prompt MUST NOT include file content, implementation code, solution specifications, directory structures, or any prescriptive instructions about how to implement inline. The prompt MUST NOT contain markdown code blocks (triple backticks) — if the Dev needs implementation details, the related ADRs are listed in the issue body and the Dev reads them directly. The executing agent reads the issue and the Figma/UX context directly — it does not need the Companion to transcribe or summarise them.
   **Post-construction verification:** Before sending the prompt to the rewriter, scan it for markdown code blocks (triple backticks). If any code blocks are found that contain implementation code, file structures, or solution prescriptions: remove them and replace with a reference to the source (ADR number, issue body section, or Figma node). Code blocks containing only CLI commands (gh issue edit, git commit messages) or structured data references are acceptable.
6. Pass the prompt through `@promptmind`. Delegate via Task.

This sequence is the best path for delegation. Following it maximises the quality of the executing agent's output because the agent receives structured context from authoritative sources rather than prescriptive instructions from the Companion.

**Branch A — Figma reference available (design fidelity context set in Step 0):**
Load the `figma-implement-design` skill. The delegation prompt MUST instruct the agent to follow the `figma-implement-design` workflow explicitly. The prompt must specify:
1. For each `{ fileKey, nodeId }` in the design fidelity context: call `get_design_context(fileKey, nodeId)` to retrieve layout, typography, colors, and component structure; call `get_screenshot(fileKey, nodeId)` to obtain the visual reference; download any assets returned by the MCP server.
2. Translate the Figma output into the project's framework, styles, and conventions — never copy verbatim. Reuse existing components, map design tokens to project tokens.
3. Achieve 1:1 visual parity with the Figma screenshot before marking complete.
4. Validate against the checklist in `figma-implement-design`.
5. Return the final implementation screenshot alongside the Figma reference screenshot as evidence for Step 4.
The delegation prompt MUST reference the GitHub issue by URL or number and MUST NOT include file content or solution specifications inline.

**Branch B — UX Intent available, no Figma (UX Intent context set in Step 0):**
Construct a delegation prompt for the selected development agent: write the implementation code that makes the unit tests pass, using the UX Intent as the behavioural guide for the interface. The prompt MUST include the full UX Intent content extracted in Step 0 and instruct the agent to:
1. Respect the user goal, key behaviors, and structural constraints defined in the UX Intent.
2. Implement the behavioral edge cases described in the UX Intent.
3. Return a screenshot of the implemented interface as evidence for Step 4.
The delegation prompt MUST reference the GitHub issue by URL or number and MUST NOT include file content or solution specifications inline.

**Branch C — No design reference (neither Figma nor UX Intent available):**
Construct the delegation prompt following the mandatory process above. Additionally instruct the development agent to:
1. Read the GitHub issue first.
2. Deliver clean, committable code: update .gitignore to cover any new framework-specific artefact categories (dependency directories, build output, environment files, generated code) introduced by this implementation. The working tree after implementation must contain no untracked dependency directories or build output.

The delegation process above (steps 1–6) governs prompt construction for all three branches — do not repeat the process here.

When the agent returns:
1. Run unit tests → expect green. If red: delegate a correction Task. Loop until green.
2. Run integration test → expect green. If red: delegate a correction Task. Loop until green.

Continue iterating until all tests pass.

Track the iteration count per failing test. On iteration 2: notify the human with a direct message — do not halt, do not wait for a response. The message must include:
1. Which test is failing.
2. The error output from the last run.
3. What the last correction attempted was.
Continue the loop.

From iteration 3 onward: before delegating each correction Task, build an accumulated context summary and include it in the delegation prompt. The summary must contain:
1. What approaches have been tried in previous iterations.
2. What error each approach produced.
3. What was explicitly discarded and why.
Pass this summary to the executing agent so it does not repeat failed approaches.

After 5 iterations without progress on any single test: signal stagnation and escalate to the human with the full accumulated context summary.

### Step 3.5 — Security assessment

**Pre-security gate checks:** Before delegating the security assessment, run:
- `.opencode/skills/companion/scripts/check-git-branch.sh` — FAIL means stop and instruct the human to switch to a feature branch.
- `.opencode/skills/companion/scripts/check-no-shared-docs-staged.sh` — FAIL means stop and instruct the human to unstage shared-docs changes before continuing.
- `.opencode/skills/companion/scripts/check-secrets-staged.sh` — FAIL means stop immediately and surface the gitleaks findings to the human before any commit is delegated.

Construct a delegation prompt for the `engineering-security-engineer` agent: review the implementation for security risks. Classify each finding by severity: low, medium, high. Pass through `@promptmind`. Delegate via Task.

When the agent returns: post all findings as a comment on the SI issue.

If no findings: proceed to Step 4.

For each finding, apply the following triage policy:

**LOW severity:**
Post the finding as a comment on the SI issue. Proceed to Step 4.

**MEDIUM severity:**
Delegate to `architect` agent to propose a fix. Apply TDD cycle: write test for the fix → implement fix → tests green. Commit as a separate dedicated commit: `fix(security): <description>`. Post the finding and fix as a comment on the SI issue. Proceed to Step 4.

**HIGH severity:**
1. Delegate to `architect` agent: evaluate whether this finding is a structural problem requiring a new ADR, or an implementation detail fixable within the current architecture.
2. If **implementation detail**: inform the human of the finding and the architect's proposed solution. Implement fix (TDD cycle), commit separately: `fix(security): <description>`. Post the finding and fix as a comment on the SI issue. Proceed.
3. If **requires new ADR**:
   a. The ADR need will be documented as a comment on the SI issue in step (b) below.
   b. Delegate a Task to add a comment to the SI issue: `gh issue comment $ISSUE_NUMBER --body "Security finding (HIGH): <description>\n\nArchitect assessment: <assessment>\n\nADR needed: <proposed scope>. Implementation continues — the ADR will be authored separately.\n\n---\n*Posted with AI assistance — companion*"`
   c. Delegate a Task to add label `blocked:adr-needed` to the REQ tracking issue (not just the SI): `gh issue edit $TRACKING_ISSUE_NUMBER --add-label 'blocked:adr-needed'` — do NOT remove `req:implementing`.
   d. Continue implementation. The ADR need is documented but does not block the current SI or any subsequent SI. The ADR will be authored in a separate session.

### Step 4 — QA validation

Construct a delegation prompt for `testing-reality-checker` + `testing-evidence-collector` agents: validate the implementation against the ACs. Collect evidence: test results, screenshots via Chrome DevTools MCP (the application is already running from the BDD tests). Pass through `@promptmind`. Delegate via Task.

**If design fidelity context exists** (set in Step 0): the QA delegation prompt MUST additionally instruct the agents to perform visual comparison for each entry in the design fidelity context:

1. For each `{ fileKey, nodeId }` in the design fidelity context: call `get_screenshot(fileKey, nodeId)` to retrieve the Designer's reference screenshot.
2. Capture the equivalent screen from the running implementation via Chrome DevTools MCP.
3. Produce a side-by-side comparison: Figma reference (left) vs. implementation (right). Flag any visible discrepancies in: layout/spacing, typography, colours, interactive states, and component variants.
4. Include both screenshots — Figma reference and implementation — as part of the QA evidence payload returned to the Companion.

   The QA prompt MUST explicitly include the Figma screenshot URL obtained in Step 3 so the QA agent can retrieve it for side-by-side comparison. Do not assume the QA agent has access to the Figma context — pass it in the prompt. The QA agent MUST return screenshots of the implementation alongside the Figma reference for evidence posting.

The QA evidence for design-fidelity issues must include an explicit verdict per screen: **MATCH** (no visible discrepancies) or **MISMATCH** (list of discrepancies). A MISMATCH verdict is treated as a failing QA check — delegate a correction Task to the development agent and repeat until all screens return MATCH.

Additionally: delegate a Task to run the full project test suite (not just the new tests). This detects regressions introduced by the implementation. If any existing test fails: report the failure. Delegate a correction Task to the development agent. Loop until the full suite passes.

When the agents return, apply the following triage:

**AC failure — test correct:** if a test fails and it correctly derives from an AC, delegate a correction Task to the development agent with the failing AC as context. Return to Step 3. Loop until passing.

**AC failure — test possibly invalid:** if a test fails and its validity against the AC is unclear, halt. Present the dilemma to the human: "This test is failing — is the test correctly deriving from the AC, or is the test itself wrong? The test is only invalid if the AC changed or the approach was fundamentally wrong." Wait for explicit decision. Never decide autonomously that a test is invalid.

**Figma MISMATCH (Agency mode):** delegate a correction Task to the development agent with the specific discrepancies listed. Loop Steps 3 → 4 until MATCH. If no resolution after 3 iterations: escalate to human.

**Figma MISMATCH (Augmentation mode):** present the screenshot pair and discrepancy list to the human. Wait for decision: accept the divergence or correct. Do not proceed without explicit decision.

Present the full evidence to the human. If design fidelity context exists, the presentation MUST include the Figma vs. implementation screenshot pairs and the MATCH/MISMATCH verdicts.

### Step 5 — Code review

Construct a delegation prompt for the `engineering-code-reviewer` agent: review the implementation diff. Focus on: code quality, adherence to ADR patterns, test coverage of ACs, security (confirm Step 3.5 findings are addressed).

The code review prompt MUST include this verification item: check that no dependency directories, build output, or environment files are staged or present in the working tree that should be covered by .gitignore. If found, flag as a review finding.

Pass through `@promptmind`. Delegate via Task.

When the agent returns:

If APPROVE or APPROVE WITH COMMENTS: present findings to the human. Proceed to Step 6.

If REQUEST CHANGES or BLOCKED: for each finding, determine if it requires a code change. If yes:

IMPORTANT: All corrections derived from code review findings MUST be delegated to the development agent via Task — the Companion does not write, edit, or fix code directly under any circumstances.
Reason step by step:
1. Is this finding a cosmetic or localised correction (fix this line, rename this variable, add error handling here)? Or does it reject the overall approach or architecture of the implementation?
2. If cosmetic or localised: return to Step 3 with the specific correction needed.
3. If approach rejection: evaluate whether the tests written in Steps 1 and 2 were written to validate the rejected approach.
4. If the tests are still valid for the new direction: return to Step 3 with the correction context.
5. If the tests are no longer valid:
   - **Agency mode:** decide autonomously whether to revisit Steps 1/2 before returning to Step 3. If revisiting: re-derive tests from ACs with the new approach as context, replace the previous tests, then proceed to Step 3. Notify the human of the decision with a direct message stating: (1) which tests were invalidated, (2) what the new approach requires, (3) what was replaced.
   - **Augmentation mode:** present the evaluation to the human — state which tests are no longer valid and why, propose whether to revisit Steps 1/2, and wait for explicit confirmation before acting.
CRITICAL: Invalidating a test to make it pass is almost always wrong. Before deciding a test is invalid, verify: does the test correctly derive from the AC? If yes, the test is valid and the code must change — not the test. A test is only invalid if the AC itself changed or the approach was fundamentally wrong from the start — not because the implementation is difficult to achieve.

If the finding is about approach/architecture and does not require test revision: escalate to the human. Loop until the review passes.

### Step 6 — Commit and push

**Pre-commit gate — MUST NOT be skipped:**
Before proceeding to commit, verify that both of the following have been executed as independent Task delegations in this implementation cycle:
1. **Step 3.5 (Security assessment)** — the security engineer agent was delegated as a separate Task and returned findings (even if "no findings"). Performing security assessment inline or as part of another Task does not satisfy this gate. If not executed as a separate Task: halt. Execute Step 3.5 now as its own dedicated delegation and return here only after results are documented as a comment on the SI issue.
2. **Step 4 (QA validation)** — the QA agents were delegated as a separate Task and returned evidence (test results + screenshots if applicable). Performing QA inline or as part of another Task does not satisfy this gate. If not executed as a separate Task: halt. Execute Step 4 now as its own dedicated delegation and return here only after evidence is documented.
   **QA Task isolation rule:** The QA delegation MUST use a distinct `subagent_type` appropriate for testing (e.g., `general` with QA-specific prompt, or a dedicated QA agent). The QA prompt MUST NOT be appended to the Dev Task, the Security Task, or the Commit Task. One Task = one concern.

A commit that skips security assessment or QA — or that bundles them into another Task rather than executing them as independent delegations — is not a valid implementation output. This gate is non-negotiable.

GIT:ready is required. If locked: present the summary of what will be committed and wait for authorisation.

Delegate a Task to:
1. Stage the implementation files (not test infrastructure or unrelated changes).
2. Commit with Conventional Commits message. If a GitHub issue exists: include `closes #NNN`. If no issue: plain message.

> Every commit message generated by this workflow must include the following git trailer on its own line, after a blank line separating it from the commit body:
> `[AI-assisted: companion]`

3. Push to the current feature branch.

Report the commit hash to the human.

Delegate a Task to update the issue label to reflect implementation is complete: `gh issue edit $ISSUE_NUMBER --remove-label 'status:wip' --add-label 'status:implemented'`

Notify the human operator (direct message): summary — tests passing, evidence collected, commit hash, issue reference (if any).

---

## Expected output

1. **Integration test** — BDD test derived from ACs, passing.
2. **Unit tests** — TDD tests covering implementation contracts, passing.
3. **Implementation code** — code that makes all tests pass; if design fidelity context exists, visually matched to the Figma reference.
4. **Security assessment** — findings addressed (fixes committed separately) or escalated.
5. **QA evidence** — test results + screenshots; if design fidelity context exists, includes Figma vs. implementation screenshot pairs with MATCH/MISMATCH verdicts per screen.
6. **Regression check** — full project test suite passing.
7. **Code review** — approved.
8. **Commit** — on the feature branch with proper message and issue reference.

---

## D4 gate

After Step 6, return control to the caller. If called as a standalone workflow: ask the human what to do next — open a PR, implement another issue, or move to another task. If called as a sub-workflow (from `agentic-sdlc` or `respond-to-cr`): return the result (commit hash, test evidence, review status) to the calling workflow without prompting the human.

---

## Exceptions

| Condition | Response |
|---|---|
| Task context absent | Halt before Step 0; state requirement; wait |
| GitHub issue not found | Halt at Step 0; report the issue number and error; wait |
| No relevant skills found | Continue without skill context — not blocking |
| `extract-figma-links.js` returns FAIL (UX Spec present but no Figma links found) | Surface to human at Step 0; ask whether to continue without Figma reference or pause until links are added; wait for explicit decision |
| `get_design_context` or `get_screenshot` fails in Step 3 | Report the Figma MCP error; surface the fileKey and nodeId that failed; ask whether to continue without that screen's reference or halt; wait |
| QA returns MISMATCH for a screen | Delegate correction to development agent; loop Step 3 → Step 4 until MATCH; escalate to human after 3 correction iterations without resolution |
| Integration test passes unexpectedly (red expected) | Flag to human at Step 1; the test may not be testing the right thing; wait |
| Unit tests pass unexpectedly (red expected) | Flag to human at Step 2; wait |
| 5 iterations without progress on any test | Signal stagnation at Step 3; escalate with failing test output and last correction attempted |
| Security finding (HIGH) — implementation detail | Halt at Step 3.5; inform human of finding + architect's solution; implement fix after approval; commit separately |
| Security finding (HIGH) — requires new ADR | Halt at Step 3.5; apply `blocked:needs-adr` label; comment on issue with finding and ADR request; wait for ADR acceptance |
| Issue has `blocked:needs-adr` label | Halt at Step 0; check issue comments for ADR reference; if resolved proceed, if not report and wait |
| Full project test suite has regressions | Report at Step 4; delegate correction; loop until full suite passes |
| Code review returns BLOCKED | Present blockers to human; do not fix architectural blockers autonomously; wait |
| GIT locked at Step 6 | Present commit summary; inform human GIT:ready is required; wait |
| Commit or push fails | Report exact error; do not retry automatically; wait |