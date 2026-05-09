# Create REQ — Specify Phase SOP

## Objective

Author a well-formed REQ conforming to `docs/shared/requirements/guidelines.md` and the template at `docs/shared/requirements/000-template.md`. Success condition: a complete REQ file exists on disk at `docs/shared/requirements/REQ-NNN-<kebab-case-title>.md` with `status: draft`, the relevant domain index file has been updated, and every item in the PR checklist from guidelines.md §8 passes. `status` is always `draft` at creation — never `accepted`. Setting `status: accepted` requires human approval after PR review and is a hard stop.

This workflow is consumed by the Companion in both Augmentation and Agency modes. The Companion never writes files directly — all file writes are delegated via Task.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| Feature or problem to specify | Required | Halt if absent. Accept any form: title, user story, problem description, stakeholder request. |
| Domain | Required | One of: cli-arguments, password-logic, security-validation. Halt if absent or not one of these values. |
| Milestone | Required | Ask the human if not provided. Validate against `docs/shared/README.md §Milestone`. Valid values: mvp, v2 |
| Priority | Required | One of: `must`, `should`, `could`, `wont` (MoSCoW). Ask if not provided. |
| REQ ID | Optional | If not provided, determine by reading `docs/shared/requirements/` — see Step 0. |
| Author | Required | At minimum one human name. The Companion appends `"Agent: companion"` automatically. |
| Mode | Inherited | Do not ask. The active mode (Augmentation or Agency) is already known from the SKILL.md pipeline. |

Do not proceed past input resolution until all required inputs are confirmed. If a required input is missing, state which one is missing and wait.

---

## Sequential steps

### Step 0 — Resolve inputs (both modes)

**Step 0.1.** If REQ ID was not provided by the human, execute the following three sub-steps in order. Do not skip or collapse them — each step's output is required as input to the next.

**Step 0.1a.** List all filenames matching `REQ-NNN-*.md` in `docs/shared/requirements/` (the physical directory — do NOT use any index file for this step). Output the complete list of filenames found. Halt and report if the directory is unreadable — do not proceed until the human resolves the access issue.

**Step 0.1b.** From the filename list produced in Step 0.1a, extract the integer `NNN` from each filename. Output the full list of integers found.

**Step 0.1c.** From the integer list produced in Step 0.1b, take the highest value. Add 1. Zero-pad to three digits. This is the next available global REQ ID. Present this derived ID to the Companion before proceeding — do not assume it silently.

**Step 0.2.** Check that the resolved REQ ID is not already in use. If a file named `REQ-<resolved-NNN>-*.md` already exists: halt. Report the conflict. Ask the human to confirm the intended ID before proceeding.

**Step 0.3.** Read `docs/shared/requirements/000-template.md`. This is the structural contract for the output file.

**Step 0.4.** Read `docs/shared/requirements/guidelines.md` §1 (frontmatter), §2 (structure), §4 (style), and §8 (PR checklist). Extract the quality gates — these are applied in Step 7.

**Step 0.5.** Confirm the domain is one of the five valid values. If not: halt. List the valid values. Wait for correction.

**Step 0.6.** If milestone was provided: confirm it is one of the valid values (`mvp, v2`) from `docs/shared/README.md §Milestone`. If not found: halt. List the valid values. Wait for correction.

> Do not include `ux-spec` in frontmatter for REQs authored after 2026-04-27.

---

### Steps 1–6 — Augmentation mode (co-creation with human)

Execute these steps only when the active mode is Augmentation. Skip to Steps 1–2 in the Agency section below if the active mode is Agency.

---

**Step 1 — Problem Statement**

Ask: "What problem are we solving? Who is the stakeholder, and what is the cost of inaction?"

Using the answer:
- Draft the Problem Statement: one to three paragraphs describing the problem, the affected stakeholder, and the cost of not solving it.
- Identify and include policy constraints — rules about what the solution SHALL NOT do — as a separate paragraph beginning with the bold label **Policy constraints:**. Policy constraints that appear here must not be duplicated as functional requirements.

Present the draft. Iterate until the human approves.

---

**Step 2 — Functional Requirements**

Ask: "What must the system do to solve this problem?"

For each behaviour identified:
- Draft a `REQ-F-NNN` entry using RFC 2119 SHALL/SHALL NOT/SHOULD/MAY keywords, capitalised. Each entry describes exactly one observable behaviour.
- Sub-requirements use `REQ-F-NNN-RN` format (e.g., `REQ-F-002-R1`).
- Apply the separation of concerns rule from guidelines §2.4a before presenting:
  - No two FRs may describe the same behaviour from opposite angles. If they do: merge into one FR with sub-rules.
  - No FR may restate a policy constraint already placed in the Problem Statement.
  - No FR may restate an NFR target. FRs describe what the system does; NFRs describe how well.
- Do not include technology names, library choices, or database column definitions. Describe observable behaviour only.

Present all drafted FRs. Iterate until the human approves the full set.

---

**Step 3 — Non-Functional Requirements (conditional)**

Ask: "Are there measurable quality constraints — performance, security, accessibility — that are specific to this requirement and not already covered by another REQ?"

If yes:
- Draft NFRs using the five-column table format: `ID | Quality Attribute (ISO 25010) | Metric | Target | Condition`.
- Each NFR must name an ISO 25010 subcategory (e.g., `Time Behaviour`, `Confidentiality`, `Accessibility`).
- Each NFR must add a measurable quality target not already expressed in any FR or in the Problem Statement.
- Present the drafted NFRs. Iterate until approved.

If no: omit the section entirely. Do not create placeholder subsections.

---

**Step 4 — Acceptance Criteria**

For each `REQ-F-NNN` approved in Step 2:
- Derive at least one `AC-NNN` using Given/When/Then format with a descriptive title.
- Format: `### AC-NNN — Descriptive title` followed by `**Given** ..., **When** ..., **Then** ...`
- Every FR must have at least one AC. An FR and its AC must not verify the same behaviour under the same condition from both a positive and negative angle — merge them if they do.

Present all ACs together with their linked FRs. Iterate until the human confirms coverage is complete and every FR is covered.

---

**Step 5 — Out of Scope and Dependencies**

Ask: "What should explicitly NOT be in scope — things a stakeholder might reasonably expect but that we are excluding?"

Draft Out of Scope:
- List only behavioural descoping decisions — observable system behaviours that are explicitly excluded.
- Do not include implementation decisions (library choices, infrastructure, deployment). Those belong in ADRs.
- An empty dash (`-`) is acceptable only if no active descoping decisions were made.

Ask: "Does this REQ depend on another REQ or an external system being in place before it can be implemented?"

Draft Dependencies table if any exist: `| Dependency | Type | Why |`
- ADRs are NOT listed in the Dependencies table. They go in `related-adrs` frontmatter.
- Only runtime and implementation dependencies on other REQs or external systems belong here.

If the human mentions a forward reference to a future ADR that will govern part of this REQ's implementation: note it for the D4 gate — the `related-adrs` field will need updating when that ADR is authored.

Present Out of Scope and Dependencies together. Iterate until approved.

---

**Step 6 — Delegate file writing via Task**

With all content approved, delegate to a specialist agent via a single Task:

Instruct the agent to write the complete REQ file to `docs/shared/requirements/REQ-NNN-<kebab-case-title>.md` with:
- Correct YAML frontmatter: `id`, `title` (matching H1 exactly), `status: draft`, `domain`, `milestone`, `priority`, `author` (including the human's name and `"Agent: companion"`), `requires` (if any), `related-adrs: []` (empty at creation).
- H1 heading: `# REQ-NNN — Title` (em-dash, not colon, not hyphen).
- All sections in the required order from guidelines §2.1: Problem Statement, Functional Requirements, Non-Functional Requirements (or omit if empty), Acceptance Criteria, Out of Scope, Dependencies.
- RFC 2119 keywords (`SHALL`, `SHALL NOT`, `SHOULD`, `MAY`) capitalised throughout.
- All `REQ-F-NNN` and `AC-NNN` IDs zero-padded to three digits, starting at `REQ-F-001` and `AC-001` respectively.

Then instruct the same agent to update `docs/shared/requirements/index-<domain>.md` by appending a new row:
`| [REQ-NNN](REQ-NNN-<kebab-case-title>.md) | Title | draft | <priority> | <milestone> |`

Delegate both writes as a single Task. Do not split into two Tasks.

Proceed to Step 7 when the Task returns.

---

### Steps 1–2 — Agency mode (delegated authoring)

Execute these steps only when the active mode is Agency. Skip the Augmentation steps above.

---

**Step 1 — Construct the authoring brief**

From the inputs resolved in Step 0, construct a complete authoring brief containing:
- Problem description (verbatim from the human's input)
- Domain, milestone, priority, REQ ID
- Known stakeholders (if mentioned)
- Any FRs or ACs already mentioned in the human's input
- Any out-of-scope items noted
- Any dependencies mentioned
- The target file path: `docs/shared/requirements/REQ-NNN-<kebab-case-title>.md`
- The index file to update: `docs/shared/requirements/index-<domain>.md`

Delegate to a specialist agent via Task with explicit instructions to:
1. Read `docs/shared/requirements/000-template.md` and `docs/shared/requirements/guidelines.md` before writing.
2. Write the complete REQ following the template exactly — all required sections in the required order.
3. Set `status: draft`. Never `accepted`.
4. Include `"Agent: companion"` in the `author` array alongside the human's name.
5. Apply RFC 2119 keywords (`SHALL`, `SHALL NOT`, `SHOULD`, `MAY`) throughout, capitalised.
6. Derive at least one AC per FR using Given/When/Then format with a descriptive title.
7. Apply the separation of concerns rule: no two FRs describe the same behaviour from opposite angles; no FR restates a policy constraint already in the Problem Statement.
8. Write the file to `docs/shared/requirements/REQ-NNN-<kebab-case-title>.md`.
9. Update `docs/shared/requirements/index-<domain>.md` with the new row.

---

**Step 2 — Review and correction loop**

When the Task returns:
- Present the complete REQ to the human.
- Run the PR checklist from guidelines §8 immediately — surface any BLOCKER items before asking for feedback.
- Ask: "Does this REQ correctly describe the problem and the system behaviour? Are the ACs testable and complete? Is anything missing or misrepresented?"

If corrections are needed:
- Identify exactly which section requires the change.
- Delegate a surgical edit via Task — specify the section, the current text, and the replacement text.
- Present the corrected section to the human.
- Repeat until the human confirms the REQ is correct.

Proceed to Step 7 when the human approves the complete REQ.

---

### Step 7 — PR checklist gate (both modes)

Before closing, run the script validation below, then verify the remaining judgment-based items in the table.

**Script validation:** Run the unified REQ validator against the created file:

```
node .opencode/skills/companion/scripts/validate-req.js <req-file> docs/shared/requirements
```

Include any FAIL findings in the Step 7 failure report. Execute the script from the workspace root.

**Judgment-based items** (not covered by the script — require human reasoning):

| Checklist item | Why this requires judgment |
|---|---|
| `author` includes at least one human name | Script cannot distinguish a human name from `"Agent: companion"` — verify manually that at least one entry is a real person |
| Out of Scope contains only behavioural descoping decisions — no implementation choices | Requires reading intent — implementation decisions are not syntactically distinguishable from behavioural ones |
| Dependencies section contains no ADR references | Requires recognising ADR-NNN patterns in free text and judging whether they are listed as dependencies (wrong) vs mentioned in prose (acceptable) |

Surface every FAIL before closing. If any FAIL exists: delegate a correction via Task before proceeding to D4.

---

## D4 gate

The REQ is on disk with `status: draft` and the index is updated.

Do not set `status: accepted`. That requires human approval after PM/PO PR review.

If the human mentioned a forward reference to a future ADR during authoring: surface it now — "The REQ body references an ADR that does not yet exist. When that ADR is authored, add it to the `related-adrs` field."

Ask the human: "The REQ is written and the index is updated. What do you want to do next — open a PR, continue refining, or move to another task?"

Do not suggest a default. Wait for an explicit decision before taking any action.

---

## Expected output

Two files written to disk via Task:

**1. REQ file** — `docs/shared/requirements/REQ-NNN-<kebab-case-title>.md`

Contains:
- YAML frontmatter with all required fields (`id`, `title`, `status: draft`, `domain`, `milestone`, `priority`, `author`, `related-adrs: []`)
- H1: `# REQ-NNN — Title` (em-dash separator)
- Required sections in order: Problem Statement, Functional Requirements, Non-Functional Requirements (if any), Acceptance Criteria, Out of Scope, Dependencies (if any)
- RFC 2119 keywords capitalised throughout
- At least one `AC-NNN` per `REQ-F-NNN`

**2. Index update** — `docs/shared/requirements/index-<domain>.md`

New row appended to the Active table:
```
| [REQ-NNN](REQ-NNN-<kebab-case-title>.md) | Title | draft | <priority> | <milestone> |
```

---

## Exceptions

| Condition | Response |
|---|---|
| Feature or problem description absent | Halt before Step 0; state which input is missing; wait |
| Domain absent or not one of the five valid values | Halt at Step 0.5; list the five valid values; wait for correction |
| Milestone value not found in `docs/shared/README.md §Milestone` | Halt at Step 0.6; list the four valid values (mvp, v2); wait for correction |
| REQ ID already in use (a file `REQ-<NNN>-*.md` already exists) | Halt at Step 0.2; report the conflict; ask the human to confirm the intended ID |
| `docs/shared/requirements/` directory unreadable | Halt at Step 0.1; report the access failure; wait for the human to resolve it |
| Author array contains no human name | Flag at Step 7 checklist as FAIL; do not close until a human name is present |
| Forward reference to a future ADR in the REQ body | Note at D4 gate — `related-adrs` must be updated when the ADR is authored; do not block the REQ for this |
| Task returns a REQ with `status: accepted` | Reject the output immediately; delegate a correction via Task to reset `status` to `draft`; do not present the `accepted` version to the human |
| Task returns a REQ missing one or more `AC-NNN` for a `REQ-F-NNN` | Identify the uncovered FRs; delegate a targeted correction via Task before proceeding to Step 7 |
| Priority not one of `must`, `should`, `could`, `wont` | Halt at input resolution; list the valid MoSCoW values; wait for correction |