# Decompose REQ into GitHub Issues — Augmentation / Agency SOP

## Objective

Decompose an accepted REQ into trackable GitHub issues for implementation. Success condition: a tracking issue exists for the REQ, sub-issues cover every AC in the REQ with complexity estimates and persona assignments, the scope has been validated by PM and architect specialists, and the human (Augmentation) or Companion (Agency) has confirmed the breakdown.

The Companion orchestrates this workflow across two modes. In **Augmentation** mode, the Companion presents specialist outputs and discordances to the human, who mediates and decides. In **Agency** mode, the Companion mediates discordances autonomously, escalating to the human only when resolution requires judgment the Companion cannot make. The active mode is inherited from the SKILL.md pipeline — the Companion must not ask.

The Companion never writes files directly and never runs commands directly. All file operations and all `gh` CLI invocations are delegated via Task. Every delegation prompt passes through `@promptmind` before being sent to the executing agent.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| REQ identifier | Required — halt if absent | e.g. `REQ-001`. Used to locate the REQ file via `docs/shared/requirements/REQ-NNN-*.md`. |
| Mode | Inherited | Read from the active SKILL.md pipeline. Do not ask. Route to Pipeline A (Agency) or Pipeline B (Augmentation) based on this value. |

Do not proceed past this point until the REQ identifier is confirmed. If it is missing, state which input is missing and wait.

---

## Mode routing

Read the Mode input. If Agency → execute Pipeline A. If Augmentation → execute Pipeline B. Do not ask the human.

---

## Pipeline A — Agency

1. SDD gate check
   1.1. Read the REQ file. Extract from frontmatter: `status`, `related-adrs`, `blocked-by`, `requires`. If `ux-spec` is present, extract it as informational context — it carries no gate weight.
   1.2. Build a state record: map each field to its current value; for each ADR in `related-adrs` map its `status`; flag any ambiguous or missing field.
   1.3. Evaluate Gate 1 — `status` must be `accepted`. If not: halt. State current value. Explain: implementation planning cannot begin until the PM has accepted the REQ. Wait.
   1.4. Evaluate Gate 2 — for each ADR in `related-adrs`: read the file, check `status`. If `proposed`: halt, name the ADR, explain decision is not yet stable, wait. If `superseded by ADR-NNN`: follow the chain to the terminal ADR. If terminal is `proposed`: halt with full chain traced, wait. If `accepted`: continue.
   1.5. Evaluate Gate 3 — if `blocked-by` is populated: halt. Present blocker text verbatim. Do not interpret. Wait.
   1.6. Evaluate Gate 4 — for each REQ in `requires`: check its `status`. If any is `draft`: halt. Name the required REQ. Explain: must reach `accepted` first. Wait.

2. Tracking issue
   2.1. Delegate a Task to run `gh issue list --search "REQ-NNN"` and check for an existing tracking issue.
   2.2. If found and open: use as parent issue. Present issue number and title.
   2.3. If found but closed: report closed state. Ask the human whether to reopen or create new. Wait for explicit decision.
   2.4. If not found: delegate a Task to create it via `gh issue create` with title `REQ-NNN — <REQ title>` and body referencing the REQ file path. Present the created issue.
        After creating the tracking issue, apply the initial REQ label: `gh issue edit $TRACKING_ISSUE_NUMBER --add-label 'req:todo'`

3. Reanchoring and parallel specialist delegation
   3.1. Read directly (not via Task): `SKILL.md`, `hard-stops.md`, `docs/shared/architecture/tech-stack.md`, and the REQ file. Each file must be read in full — no `limit` parameter, no partial read. Anti-drift: reasoning must reflect files as they exist on disk now. The tech-stack.md read is mandatory — it defines the package manager and toolchain that must appear in all DoD items and delegation prompts.
   3.2. Construct Delegation 1 prompt — product-manager agent: read the REQ file; map all REQ-F-NNN, NFRs, and ACs; produce scope summary (what, for whom, constraints); flag any ambiguity or interpretation conflict. Pass through `@promptmind`.
   3.3. Construct Delegation 2 prompt — software-architect agent: read the REQ file and all ADRs in `related-adrs` following supersession chains to terminal ADRs; for each terminal ADR extract Decision Outcome, Implementation Notes, Consequences; identify mandatory patterns, known failure modes, and any area where the REQ implies a decision for which no governing ADR exists; additionally inspect the physical state of the repository and report explicitly: SCAFFOLD EXISTS (application present, can be iterated on) or BLANK SLATE (no deployable application found — foundation work required). Pass through `@promptmind`.
   3.4. Dev Mode Annotations: if any Figma reference is available (from the REQ's UX Spec or provided by the human), instruct the software-architect agent to additionally call `get_design_context(fileKey, nodeId)` for each referenced node and inspect the returned code for `data-development-annotations` attributes. Extract any annotations found and include them in the output as Designer implementation requirements that must be accounted for in the issue breakdown — these annotations contain implementation details (animation assets, interaction specifications, accessibility notes) that are not visible in the rendered design. This instruction is appended to the Delegation 2 prompt constructed in step 3.3 before it is passed through `@promptmind`.
   3.5. Delegate both prompts via Task simultaneously.
   3.6. When both return: list agreements. List every discordance — for each, quote specific text from each agent.
   3.7. For each discordance: reason through using visible chain-of-thought. Propose a resolution. Test: does this require a scope change, new ADR, or human judgment about product priorities? If yes: escalate immediately. If no: resolve and record.
   3.8. After 5 rounds on a single discordance without resolution: escalate to the human with full context — both positions, analysis, specific question. Wait.

4. Issue breakdown
   4.1. After consensus is confirmed: construct a delegation prompt for the senior-project-manager agent. The agent must break the REQ into sub-issues. Each sub-issue must specify:
        - Title: `REQ-NNN/SI-N: <concise action-oriented verb phrase>` (N is a sequential integer starting at 1; if a foundation issue was created as SI-0 in agentic-sdlc step 2, this sequence starts at SI-1)
        - AC identifier(s) covered (mapped directly to AC-NNN from the REQ)
         - Estimated complexity: S / M / L (XL is not permitted — see breakdown rules below)
         - Dependencies on other sub-issues (by SI-N identifier)
         - Persona or agent type responsible
         - Definition of done: observable, testable outcomes derived from covered ACs — each item verifiable by running a test or inspecting an artefact; do NOT specify file content or implementation instructions. Example: "GET /api/auth/callback/google returns 302 (not 404) when Google OAuth credentials are present"
         DoD items MUST describe observable, functional outcomes — not structural
         artefacts. A valid DoD item names a behaviour that can be verified by running
         the application or executing a test against it (e.g. 'GET /api/auth/session
         returns HTTP 200 on a running dev server'). An invalid DoD item names a file
         that must exist (e.g. 'src/lib/auth.ts exists'). If the sub-issue is a
         foundation/scaffold task (SI-0), the DoD MUST include at minimum one item that
          verifies the application starts successfully (e.g. 'running `npm run dev`
         or equivalent starts the application without errors').
         - Related ADRs: list each ADR from the REQ's `related-adrs` that governs this specific sub-issue's scope. Format: `- [ADR-NNN](docs/shared/architecture/adrs/NNN-title.md) — <one-line summary>`. The Dev reads these ADRs directly for Implementation Notes — the Companion does not transcribe them.
         **Breakdown rules — the SPM must follow these when producing sub-issues:**

         1. **Maximum complexity: L.** Each sub-issue must be estimated as S, M, or L. If a sub-issue would be XL, it must be subdivided until each part fits within L. Rationale: an XL sub-issue compromises the quality of the full implementation cycle (BDD → TDD → implementation → security → QA → code review).

         2. **Single responsibility.** Each sub-issue must have a single cohesive responsibility. If the scope of a sub-issue spans more than one concern — for example, infrastructure and business logic in the same sub-issue, or configuration and interface in the same sub-issue — it must be split. The test: if the DoD requires verifications of fundamentally different natures to be confirmed, the sub-issue likely contains more than one concern.

         3. **Project toolchain.** All commands in DoD items must use the package manager and toolchain defined in the project's tech-stack and ADRs. If the project uses pnpm, DoD commands use pnpm. If it uses turbo, builds use turbo. The SPM must not introduce alternative tooling in DoD items.

         4. **Number of sub-issues is the SPM's decision.** The Companion must trust the SPM's granularity as long as the delegation was done correctly — without imposing numerical limits. A high number of sub-issues is a sign of adequate granularity, not a problem.
   4.2. Pass through `@promptmind`. Delegate via Task.
   4.3. When the agent returns: read directly `SKILL.md` and the REQ file (completeness check anchor).
   4.4. Map every AC from the REQ against the returned breakdown. Every AC must be covered by at least one sub-issue. If any AC is uncovered: flag it by identifier. Do not proceed until the gap is closed.
   4.5. Treat the breakdown as approved — you are the approving authority in Agency mode. Proceed to step 5.

5. Create sub-issues
   5.1. For each sub-issue:
      a. Create the issue via `gh issue create` with the full body from step 4.1. The issue body MUST end with the signature footer: `---\n*Posted with AI assistance — companion*`
      b. After creation, obtain the node IDs of both the tracking issue and the
         new sub-issue:
         PARENT_ID=$(gh issue view $TRACKING_ISSUE_NUMBER --json id --jq '.id')
         CHILD_ID=$(gh issue view $NEW_ISSUE_NUMBER --json id --jq '.id')
      c. Register the hierarchical relationship via GraphQL:
         gh api graphql -f query="mutation { addSubIssue(input: {issueId: \"$PARENT_ID\", subIssueId: \"$CHILD_ID\"}) { issue { number } subIssue { number } } }"
      d. Apply the initial status label: `gh issue edit $NEW_ISSUE_NUMBER --add-label 'status:todo'`
   5.2. If any issue creation fails: report the exact error. Ask the human how to proceed. Do not continue creating remaining issues until resolved.
   5.3. When all issues are created: present the complete tracking issue → sub-issues map as confirmation.
        Update the REQ tracking issue label to reflect decomposition is complete: `gh issue edit $TRACKING_ISSUE_NUMBER --remove-label 'req:todo' --add-label 'req:decomposed'`

---

## Pipeline B — Augmentation

1. SDD gate check
   1.1. Read the REQ file. Extract from frontmatter: `status`, `related-adrs`, `blocked-by`, `requires`. If `ux-spec` is present, extract it as informational context — it carries no gate weight.
   1.2. Build a state record: map each field to its current value; for each ADR in `related-adrs` map its `status`; flag any ambiguous or missing field.
   1.3. Evaluate Gate 1 — `status` must be `accepted`. If not: halt. State current value. Explain: implementation planning cannot begin until the PM has accepted the REQ. Wait.
   1.4. Evaluate Gate 2 — for each ADR in `related-adrs`: read the file, check `status`. If `proposed`: halt, name the ADR, explain decision is not yet stable, wait. If `superseded by ADR-NNN`: follow the chain to the terminal ADR. If terminal is `proposed`: halt with full chain traced, wait. If `accepted`: continue.
   1.5. Evaluate Gate 3 — if `blocked-by` is populated: halt. Present blocker text verbatim. Do not interpret. Wait.
   1.6. Evaluate Gate 4 — for each REQ in `requires`: check its `status`. If any is `draft`: halt. Name the required REQ. Explain: must reach `accepted` first. Wait.

2. Tracking issue
   2.1. Delegate a Task to run `gh issue list --search "REQ-NNN"` and check for an existing tracking issue.
   2.2. If found and open: use as parent issue. Present issue number and title.
   2.3. If found but closed: report closed state. Ask the human whether to reopen or create new. Wait for explicit decision.
   2.4. If not found: delegate a Task to create it via `gh issue create` with title `REQ-NNN — <REQ title>` and body referencing the REQ file path. Present the created issue.
        After creating the tracking issue, apply the initial REQ label: `gh issue edit $TRACKING_ISSUE_NUMBER --add-label 'req:todo'`

3. Reanchoring and parallel specialist delegation
   3.1. Read directly (not via Task): `SKILL.md`, `hard-stops.md`, `docs/shared/architecture/tech-stack.md`, and the REQ file. Each file must be read in full — no `limit` parameter, no partial read. Anti-drift: reasoning must reflect files as they exist on disk now. The tech-stack.md read is mandatory — it defines the package manager and toolchain that must appear in all DoD items and delegation prompts.
   3.2. Construct Delegation 1 prompt — product-manager agent: read the REQ file; map all REQ-F-NNN, NFRs, and ACs; produce scope summary (what, for whom, constraints); flag any ambiguity or interpretation conflict. Pass through `@promptmind`.
   3.3. Construct Delegation 2 prompt — software-architect agent: read the REQ file and all ADRs in `related-adrs` following supersession chains to terminal ADRs; for each terminal ADR extract Decision Outcome, Implementation Notes, Consequences; identify mandatory patterns, known failure modes, and any area where the REQ implies a decision for which no governing ADR exists; additionally inspect the physical state of the repository and report explicitly: SCAFFOLD EXISTS (application present, can be iterated on) or BLANK SLATE (no deployable application found — foundation work required). Pass through `@promptmind`.
   3.4. Dev Mode Annotations: if any Figma reference is available (from the REQ's UX Spec or provided by the human), instruct the software-architect agent to additionally call `get_design_context(fileKey, nodeId)` for each referenced node and inspect the returned code for `data-development-annotations` attributes. Extract any annotations found and include them in the output as Designer implementation requirements that must be accounted for in the issue breakdown — these annotations contain implementation details (animation assets, interaction specifications, accessibility notes) that are not visible in the rendered design. This instruction is appended to the Delegation 2 prompt constructed in step 3.3 before it is passed through `@promptmind`.
   3.5. Delegate both prompts via Task simultaneously.
   3.6. When both return: present both outputs side by side. Highlight every discordance explicitly with source text from each agent.
   3.7. The human mediates and decides on each discordance. Iterate until the human confirms consensus.
   3.8. After three revision cycles without consensus: ask "What is the core issue with the current breakdown?" Reconstruct from the stated concern rather than patching.

4. Issue breakdown
   4.1. After consensus is confirmed: construct a delegation prompt for the senior-project-manager agent. The agent must break the REQ into sub-issues. Each sub-issue must specify:
        - Title: `REQ-NNN/SI-N: <concise action-oriented verb phrase>` (N is a sequential integer starting at 1; if a foundation issue was created as SI-0 in agentic-sdlc step 2, this sequence starts at SI-1)
        - AC identifier(s) covered (mapped directly to AC-NNN from the REQ)
         - Estimated complexity: S / M / L (XL is not permitted — see breakdown rules below)
         - Dependencies on other sub-issues (by SI-N identifier)
         - Persona or agent type responsible
         - Definition of done: observable, testable outcomes derived from covered ACs — each item verifiable by running a test or inspecting an artefact; do NOT specify file content or implementation instructions. Example: "GET /api/auth/callback/google returns 302 (not 404) when Google OAuth credentials are present"
         DoD items MUST describe observable, functional outcomes — not structural
         artefacts. A valid DoD item names a behaviour that can be verified by running
         the application or executing a test against it (e.g. 'GET /api/auth/session
         returns HTTP 200 on a running dev server'). An invalid DoD item names a file
         that must exist (e.g. 'src/lib/auth.ts exists'). If the sub-issue is a
         foundation/scaffold task (SI-0), the DoD MUST include at minimum one item that
         verifies the application starts successfully (e.g. 'running `npm run dev`
         or equivalent starts the application without errors').
         - Related ADRs: list each ADR from the REQ's `related-adrs` that governs this specific sub-issue's scope. Format: `- [ADR-NNN](docs/shared/architecture/adrs/NNN-title.md) — <one-line summary>`. The Dev reads these ADRs directly for Implementation Notes — the Companion does not transcribe them.
         **Breakdown rules — the SPM must follow these when producing sub-issues:**

         1. **Maximum complexity: L.** Each sub-issue must be estimated as S, M, or L. If a sub-issue would be XL, it must be subdivided until each part fits within L. Rationale: an XL sub-issue compromises the quality of the full implementation cycle (BDD → TDD → implementation → security → QA → code review).

         2. **Single responsibility.** Each sub-issue must have a single cohesive responsibility. If the scope of a sub-issue spans more than one concern — for example, infrastructure and business logic in the same sub-issue, or configuration and interface in the same sub-issue — it must be split. The test: if the DoD requires verifications of fundamentally different natures to be confirmed, the sub-issue likely contains more than one concern.

         3. **Project toolchain.** All commands in DoD items must use the package manager and toolchain defined in the project's tech-stack and ADRs. If the project uses pnpm, DoD commands use pnpm. If it uses turbo, builds use turbo. The SPM must not introduce alternative tooling in DoD items.

         4. **Number of sub-issues is the SPM's decision.** The Companion must trust the SPM's granularity as long as the delegation was done correctly — without imposing numerical limits. A high number of sub-issues is a sign of adequate granularity, not a problem.
   4.2. Pass through `@promptmind`. Delegate via Task.
   4.3. When the agent returns: read directly `SKILL.md` and the REQ file (completeness check anchor).
   4.4. Map every AC from the REQ against the returned breakdown. Every AC must be covered by at least one sub-issue. If any AC is uncovered: flag it by identifier. Do not proceed until the gap is closed.
   4.5. Present the complete AC-to-sub-issue map to the human for explicit approval. Wait. If the human requests changes: adjust and re-present the full map.

5. Create sub-issues
   5.1. For each sub-issue:
      a. Create the issue via `gh issue create` with the full body from step 4.1. The issue body MUST end with the signature footer: `---\n*Posted with AI assistance — companion*`
      b. After creation, obtain the node IDs of both the tracking issue and the
         new sub-issue:
         PARENT_ID=$(gh issue view $TRACKING_ISSUE_NUMBER --json id --jq '.id')
         CHILD_ID=$(gh issue view $NEW_ISSUE_NUMBER --json id --jq '.id')
      c. Register the hierarchical relationship via GraphQL:
         gh api graphql -f query="mutation { addSubIssue(input: {issueId: \"$PARENT_ID\", subIssueId: \"$CHILD_ID\"}) { issue { number } subIssue { number } } }"
      d. Apply the initial status label: `gh issue edit $NEW_ISSUE_NUMBER --add-label 'status:todo'`
   5.2. If any issue creation fails: report the exact error. Ask the human how to proceed. Do not continue creating remaining issues until resolved.
   5.3. When all issues are created: present the complete tracking issue → sub-issues map as confirmation.
        Update the REQ tracking issue label to reflect decomposition is complete: `gh issue edit $TRACKING_ISSUE_NUMBER --remove-label 'req:todo' --add-label 'req:decomposed'`

---

## Label conventions

Sub-issues use status labels to track progress. The following labels MUST
exist in the repository before decomposition begins. If they do not exist,
delegate a Task to create them via `gh label create` before creating any issue.

| Label | Meaning |
|---|---|
| `status:todo` | Issue created, not yet started |
| `status:wip` | Implementation in progress |
| `status:implemented` | All DoD items verified, committed |
| `status:closed` | Issue closed after PR merge |

REQ tracking issues use a separate set:

| Label | Meaning |
|---|---|
| `req:todo` | REQ decomposed, implementation not started |
| `req:decomposed` | Issues created, implementation not started |
| `req:implementing` | At least one sub-issue in progress |
| `req:implemented` | All sub-issues implemented, PR open |
| `req:closed` | PR merged, REQ delivered |

## Expected output

1. **Tracking issue** — one GitHub issue for the REQ, created or identified in step 2.
2. **Sub-issues** — one GitHub issue per decomposed task, linked to the tracking issue, with ACs mapped, complexity estimated, dependencies declared, and persona assigned.
3. **Consensus record** — the agreed scope between PM and architect outputs, confirmed by the human (Augmentation) or Companion (Agency).

---

## D4 gate

After step 6, ask the human what they want to do next. Surface options naturally: start implementing the first sub-issue, review the breakdown further, assign issues to team members, or move to another task. Do not suggest a default. Wait for explicit decision.

---

## Exceptions

| Condition | Response |
|---|---|
| REQ identifier absent | Halt before step 1; state the requirement; wait |
| REQ file not found | Halt at step 1; report the path attempted; wait |
| REQ status is not `accepted` | Halt at step 1; state the current status; explain implementation planning cannot begin until accepted; wait |
| Any related ADR is `proposed` (including via supersession chain) | Halt at step 1; name the ADR and its status; explain the decision is not yet stable; wait |
| `blocked-by` is populated | Halt at step 1; present the blocker text verbatim; wait |
| Required REQ has `status: draft` | Halt at step 1; name the required REQ; explain it must reach `accepted` first; wait |
| PM and architect disagree after 5 rounds on one discordance (Agency) | Escalate to human with full context: both positions, Companion's analysis, specific question; wait |
| AC not covered by any sub-issue in step 4 | Flag the uncovered AC before presenting; do not proceed until covered |
| GitHub issue creation fails | Report the error; ask human how to proceed; do not continue creating remaining issues until resolved |
| Tracking issue already exists but is closed | Report at step 2; ask human whether to reopen or create new; wait |
| Augmentation mode — human rejects breakdown repeatedly | After three revision cycles, ask: what is the core issue with the current breakdown? Reconstruct from consensus rather than patching |
