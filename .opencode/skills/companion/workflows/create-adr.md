# Create ADR — Augmentation / Agency SOP

## Objective

Author a well-formed ADR conforming to `docs/shared/architecture/adrs/guidelines.md` and the template at `docs/shared/architecture/adrs/000-template.md`. Success condition: a complete ADR file exists on disk at the correct path, every item in the PR checklist from guidelines.md §9 is satisfied, and the relevant `index-<service>.md` has been updated with the new row.

The Companion orchestrates this workflow across two modes. In **Augmentation** mode, the Companion co-creates the ADR with the human turn by turn, delegating each write to a specialist agent only after the human approves the content for that section. In **Agency** mode, the Companion delegates the full authoring to a specialist agent in a single Task, then runs a review loop with the human before closing. The active mode is inherited from the SKILL.md pipeline — the Companion must not ask.

The Companion never writes files directly. All file operations are delegated via Task.

## Required inputs

| Input | Required | Notes |
|---|---|---|
| Architectural decision to document | Required — halt if absent | Accept any form: a title, a problem description, or a REQ reference. The Companion extracts decision scope in Step 0. |
| Service scope | Required — halt if absent or invalid | Must be one of: cli-interface, core-generator |
| ADR ID | Optional | If absent, derive the next available global ID in Step 0. |
| Related REQ | Optional | If provided, update that REQ's `related-adrs` frontmatter after ADR creation. |
| Deciders | Required — halt if absent | At minimum one human name. The Companion appends `"Agent: companion"` automatically. |
| Mode | Inherited | Read from the active SKILL.md pipeline. Do not ask. |

Do not proceed past this point until all required inputs are confirmed. If a required input is missing, state which one is missing and wait.

## Sequential steps

### Step 0 — Resolve inputs (both modes)

**Step 0.1.** If the ADR ID was not provided by the human, execute the following three sub-steps in order. Do not skip or collapse them — each step's output is required as input to the next.

**Step 0.1a.** List all filenames matching `NNN-*.md` in `docs/shared/architecture/adrs/` (the physical directory — do NOT use any index file for this step). Output the complete list of filenames found. Halt and report if the directory is unreadable — do not proceed until the human resolves access.

**Step 0.1b.** From the filename list produced in Step 0.1a, extract the integer `NNN` from each filename. Output the full list of integers found.

**Step 0.1c.** From the integer list produced in Step 0.1b, take the highest value. Add 1. Zero-pad to three digits. This is the next available global ADR ID. Present this derived ID to the Companion before proceeding — do not assume it silently.

**Step 0.2.** Delegate a Task to read:

- `docs/shared/architecture/adrs/000-template.md` — structural contract the ADR must follow
- `docs/shared/architecture/adrs/guidelines.md` — quality gates; load §1 (frontmatter), §2 (structure), §4 (style), §9 (PR checklist)

**Step 0.3.** Confirm the service scope is one of the valid values: cli-interface, core-generator. If `platform`: verify the decision genuinely spans multiple services. If it appears single-service, surface the concern to the human before continuing. Do not block if the human confirms `platform` is intentional.

**Step 0.4.** Confirm the ADR ID resolved in Step 0.1 is not already in use by any filename in `docs/shared/architecture/adrs/`. If a conflict is found: halt; report the conflict and the file that holds the colliding ID; ask the human to confirm the intended ID before proceeding.

Step 0 is now complete. Branch to the active mode.

---

### Augmentation mode — Steps 1–5

**Step 1 — Problem framing.**

Ask the human: "What decision needs to be made, and why now? What is the cost of not deciding?"

Use the answer to draft the `## Context and Problem Statement` section. Follow guidelines.md §2.1: identify the Quality Attribute Driver (ISO 25010 subcategory) if a quality concern motivates the decision; name the architectural layer if the decision affects one. Present the draft to the human. Iterate until the human approves the text of this section before moving to Step 2.

---

**Step 2 — Options.**

Ask the human: "What options were considered? At minimum two are required by guidelines.md §2.3."

If the human provides only one option, probe: "What is the alternative that was rejected — even if it was rejected quickly?"

Draft the `## Considered Options` section. Format: numbered list, each entry as `**Option Name** — one-sentence description.` The chosen option must appear in the list. Present the draft to the human. Iterate until approved before moving to Step 3.

---

**Step 3 — Decision and consequences.**

Ask: "Which option was chosen, and what is the one-sentence justification that references the most important consequence?"

Then ask: "What does this decision cost — performance, maintainability, security, flexibility — and how is each cost mitigated or accepted?"

Draft `## Decision Outcome` and `### Consequences` using the prefix rules from guidelines.md §2.4:

- `**GOOD:**` — positive outcome
- `**BAD:**` — trade-off stated as a complete sentence, followed immediately by an indented `*Mitigated:*` or `*Acceptable:*` sub-bullet. Every BAD entry must have one.
- `**NEUTRAL:**` — neither good nor bad but worth noting
- `**TRADEOFF:**` — when a quality attribute rises at the cost of another (optional, use only when the trade-off is direct and named)
- `**SENSITIVITY:**` — when a small change would have disproportionate quality impact (optional)

Present the draft to the human. Iterate until approved before moving to Step 4.

---

**Step 4 — Implementation Notes and Sources.**

Ask: "Are there version-specific requirements, mandatory code patterns, or known failure modes if implemented naively?"

If the human answers yes for any of these: draft `### Implementation Notes` under the Decision Outcome section. Per guidelines.md §2.5, this section is mandatory when version-specific usage requirements exist, when the decision imposes a specific code pattern, or when there is a known failure mode if implemented naively. Otherwise omit it.

Ask: "What sources confirmed this decision — documentation pages, ADRs consulted, skills used?"

Draft `## Sources` using the format from guidelines.md §2.6: `- [Link Text](url) — one-sentence description of what was confirmed.` For skills, use backtick-only format: `` `skill-name` ``. Present both sections to the human. Iterate until approved.

---

**Step 5 — Delegate writing.**

With all section content approved, delegate a single Task to a specialist agent with the following instructions:

1. Write the complete ADR file to `docs/shared/architecture/adrs/NNN-<kebab-case-title>.md` where NNN is the ID resolved in Step 0 and the kebab-case title is derived from the approved H1. The file must include correct frontmatter: `id: ADR-NNN`, `title` matching the H1 exactly (without the `ADR-NNN: ` prefix), `status: proposed`, `service`, `date` set to today in ISO 8601 format, `deciders` array containing the human name(s) and `"Agent: companion"`. Include `related-reqs` if a related REQ was provided; use `[]` if not.

2. Update `docs/shared/architecture/adrs/index-<service>.md`: add a new row to the Active table in the format `| [ADR-NNN](NNN-<kebab-case-title>.md) | Title | proposed |`.

3. If a related REQ was provided: update that REQ file's `related-adrs` frontmatter field to include the new ADR ID. If the field does not exist, add it. If the REQ file is not found or the frontmatter is malformed, do not fail the Task — report the specific problem in the Task output so the Companion can surface it to the human.

Wait for the Task to complete, then proceed to Step 6.

---

### Agency mode — Steps 1–2

**Step 1 — Brief construction and delegation.**

From the inputs confirmed in Step 0, construct a complete authoring brief and pass it to a specialist agent via Task. The brief must include:

- Decision title and ADR ID
- Service scope
- Problem statement as understood from the human's input
- Any options the human mentioned; if none were mentioned, instruct the agent to propose at least two options based on the problem statement and common patterns for the technology stack
- Any sources or related ADRs or REQs provided

Instruct the agent to:

1. Read `docs/shared/architecture/adrs/000-template.md` and `docs/shared/architecture/adrs/guidelines.md` before writing.
2. Write the complete ADR following the template exactly. Set `status: proposed`. Include `"Agent: companion"` in the `deciders` array alongside the human name(s). Include `related-reqs` if provided; use `[]` if not. Set `date` to today in ISO 8601 format.
3. Apply the consequence prefix rules from guidelines.md §2.4 — every BAD entry must have a `*Mitigated:*` or `*Acceptable:*` sub-bullet.
4. Include `### Implementation Notes` if version-specific requirements, mandatory code patterns, or known failure modes exist.
5. Write the file to `docs/shared/architecture/adrs/NNN-<kebab-case-title>.md`.
6. Update `docs/shared/architecture/adrs/index-<service>.md` with the new Active table row.
7. If a related REQ was provided: update that REQ file's `related-adrs` frontmatter. If the file is not found or frontmatter is malformed, report the problem in the Task output rather than failing.

---

**Step 2 — Review and correction loop.**

When the Task returns, present the complete ADR content to the human.

Run the PR checklist from guidelines.md §9 against the returned content. For each item that fails, mark it as BLOCKER or RECOMMENDATION. Surface all failures before asking for the human's response.

Ask the human: "Does this ADR capture the decision correctly? Are the trade-offs complete? Are the options accurately described?"

If corrections are needed: identify the specific section requiring change, delegate a surgical edit to a specialist agent via Task. Do not rewrite the entire file — scope each edit to the minimum necessary change. Repeat until the human approves the content without further corrections, then proceed to Step 6.

---

### Step 6 — PR checklist gate (both modes)

Before declaring the workflow complete, run the script validation below, then verify the remaining judgment-based item.

**Script validation:** Run the unified ADR validator against the created file and updated index directory:

```
node .opencode/skills/companion/scripts/validate-adr.js <adr-file> docs/shared/architecture/adrs
```

Include any FAIL findings in the Step 6 failure report. Execute the script from the workspace root.

**Judgment-based item** (not covered by the script — requires human reasoning):

| Checklist item | Why this requires judgment |
|---|---|
| `deciders` reflects actual decision-makers and is not the template default | Script cannot determine whether the listed names are the real decision-makers or were copied from the template |

Surface every failure to the human. For each failure, state the item, what was found, and what is required. Do not close the workflow until the human has acknowledged each failure and either accepted it or directed a correction.

## Expected output

The workflow produces three artefacts, all written to disk by delegated Tasks:

1. **ADR file** at `docs/shared/architecture/adrs/NNN-<kebab-case-title>.md` — complete, well-formed, `status: proposed`, conforming to `000-template.md` and passing the guidelines.md §9 checklist.
2. **Index update** in `docs/shared/architecture/adrs/index-<service>.md` — one new row added to the Active table.
3. **REQ update** (conditional) — if a related REQ was provided and the file was reachable: the REQ's `related-adrs` frontmatter field updated to include the new ADR ID.

## D4 gate

After Step 6 passes and all checklist failures have been acknowledged or corrected, deliver this message to the human:

> The ADR is written and the index is updated. What do you want to do next — open a PR, review the content further, or move to another task?

Do not suggest a default. Do not move. Wait for an explicit decision before taking any action.

The Companion does not set `status: accepted`. That transition belongs to the Architect after PR review.

## Exceptions

| Condition | Response |
|---|---|
| Architectural decision input absent | Halt before Step 0; state which required input is missing; wait for the human to provide it |
| Service scope absent or not one of the four valid values | Halt before Step 0; state the valid values; wait |
| `docs/shared/architecture/adrs/` directory unreadable | Halt at Step 0.1; report the access failure; wait for the human to resolve it before retrying |
| ADR ID conflict — resolved ID already in use | Halt at Step 0.4; report the conflict and the filename holding the colliding ID; ask the human to confirm the intended ID before proceeding |
| Service scope is `platform` but decision appears single-service | Surface the concern at Step 0.3 before proceeding; do not block if the human confirms `platform` is intentional |
| Deciders absent | Halt before Step 0; state the requirement; wait |
| Related REQ has `status: draft` | Surface a warning after Step 0 completes: state the REQ ID, that `status: draft` means the Plan phase gate is not satisfied, and that implementation cannot begin until the REQ is accepted. Do not block ADR authoring — the ADR may still be written. Continue after surfacing the warning. |
| Related REQ file not found or frontmatter malformed | Report the specific failure (file path attempted, error encountered); do not block ADR creation; instruct the human to update the REQ's `related-adrs` field manually |
| Augmentation mode — human rejects a section repeatedly | After three revision cycles on the same section, ask the human explicitly: "What is the core issue with the current draft?" Use the answer to reconstruct the section from scratch rather than incrementally patching it |
| Agency mode — specialist agent returns an ADR that fails multiple checklist items | Surface all failures as a grouped list in Step 2; delegate a single corrective Task addressing all failures rather than one Task per failure; repeat the review loop |
| `000-template.md` or `guidelines.md` unreadable | Halt at Step 0.2; report which file could not be read; wait for the human to resolve access before retrying |