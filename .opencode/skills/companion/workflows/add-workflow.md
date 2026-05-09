# Add Workflow — Meta SOP

## Objective

Create a new workflow SOP file in `.opencode/skills/companion/workflows/` and register it in `workflows-index.md`. Success condition: the new workflow file exists on disk, follows the canonical SOP structure defined in `.opencode/skills/companion/workflows/README.md`, is registered in the routing table of `workflows-index.md`, and the Companion can load and execute it from the index.

The Companion never writes files directly. All file operations are delegated via Task.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| Workflow name | Required | Kebab-case slug (e.g. `create-adr`). Used as the filename: `<name>.md`. Halt if absent. |
| Situation trigger | Required | One-sentence description of the situation that causes the Companion to load this workflow. Appears in the "Situation" column of `workflows-index.md`. Halt if absent. |
| SDD phase | Required | One or more of: `Specify`, `Plan`, `Task`, `Implement`, `Any`. Halt if absent or invalid. |
| Workflow title | Required | Human-readable name. Appears in the "Workflow" column of `workflows-index.md` and in the file H1. Halt if absent. |
| Execution mode | Required | One or more of: `Automation`, `Augmentation`, `Agency`. Determines mode-branching structure and whether a `Mode \| Inherited` row is needed in the new workflow's inputs. Halt if absent. |
| Delivers result to human for decision? | Required | Yes or no. Determines whether a `## D4 gate` section is needed in the new workflow. Halt if absent. |
| Mode | Inherited | Do not ask. The active mode is already known from the SKILL.md pipeline. |

Do not proceed past this point until all required inputs are confirmed. If a required input is missing, state which one is missing and wait.

---

## Canonical SOP structure

Every workflow in this directory must contain the following seven structural elements, in this order:

1. **`# Title — Subtitle SOP` heading** — H1 using an em-dash separator; subtitle describes the mode or phase scope (e.g. `Augmentation / Agency SOP`, `Specify Phase SOP`).

2. **`## Objective`** — one to three sentences stating what the workflow accomplishes and giving an explicit success condition; if the workflow supports multiple execution modes, state how execution differs per mode and that the active mode is inherited from SKILL.md and must never be asked.

3. **`## Required inputs`** — three-column table with columns `Input | Required | Notes`; every row has an explicit Required status (e.g. `Required`, `Required — halt if absent`, `Optional`, `Inherited`); a halt instruction follows the table immediately; if the workflow is multi-mode, include a `Mode | Inherited | Do not ask. The active mode is already known from the SKILL.md pipeline.` row.

4. **`## Mode routing` + `## Pipeline A` + `## Pipeline B`** — CONDITIONAL: include only when `Execution mode` includes more than one mode. When present:
   - Add a `## Mode routing` section immediately after `## Required inputs`. It must contain exactly: "Read the Mode input. If Agency → execute Pipeline A. If Augmentation → execute Pipeline B. Do not ask the human."
   - Replace the single `## Sequential steps` section with two complete, independently numbered pipeline sections: `## Pipeline A — Agency` and `## Pipeline B — Augmentation`.
   - Each pipeline is a self-contained numbered list. Steps that are identical in both modes appear in full in both pipelines — do not use cross-pipeline shortcuts.
   - Steps that differ between modes are written independently in each pipeline with the mode-specific content.
   - Sub-steps use decimal notation: 1.1, 1.2, 2.1, etc.
   - Reanchoring instructions are numbered sub-steps, not bold inline text.
   - Every instruction is imperative and atomic. No prose paragraphs inside numbered steps.
   - The `## Objective`, `## Required inputs`, `## Mode routing`, `## Expected output`, `## D4 gate`, and `## Exceptions` sections are shared and appear once, outside the pipelines.

   When `Execution mode` is a single mode: use a single `## Sequential steps` section as before (no change to existing pattern for single-mode workflows).

5. **`## Expected output`** — enumerate every artefact produced by the workflow; state the exact file path, format, and any fixed template the artefact must follow.

6. **`## D4 gate`** — CONDITIONAL: include only when the workflow delivers a result to the human for a decision; content must ask the human what they want to do next, surface options naturally without suggesting a default, and wait for an explicit decision; if the workflow involves a status transition, state explicitly that the Companion does not set it.

7. **`## Exceptions`** — two-column table with columns `Condition | Response`; every exception states the step at which it fires and exactly what the Companion must do; must cover at minimum: missing required inputs, unreadable files, and conflicts at the target path.

---

## Sequential steps

### Step 0 — Resolve inputs (all modes)

**Step 0.1.** Confirm all required inputs are present. If any are absent: halt; state which ones are missing; wait.

**Step 0.2.** Read `.opencode/skills/companion/workflows/README.md`. This is the structural contract for every workflow in this directory. Extract the required section list.

**Step 0.3.** Read `.opencode/skills/companion/workflows-index.md`. Check whether a workflow for this situation trigger already exists in the routing table. If it does: halt; surface the existing entry to the human; ask whether to update the existing workflow or create a new one; wait for explicit decision before proceeding.

Step 0 is now complete. Proceed to Step 1.

---

### Step 1 — Draft the workflow

Construct an authoring brief from the resolved inputs. Delegate to a specialist agent via Task with the following instructions:

1. Read `.opencode/skills/companion/workflows/create-adr.md` and `.opencode/skills/companion/workflows/create-req.md` as style references — match their structural conventions exactly.
2. Read `.opencode/skills/companion/workflows/README.md` for the required section list.
3. Write the complete SOP file following the canonical structure defined in the "Canonical SOP structure" section of this workflow.
4. If the execution mode includes more than one mode: structure the workflow with `## Mode routing` followed by `## Pipeline A — <ModeA>` and `## Pipeline B — <ModeB>` as complete independent numbered lists per the Canonical SOP structure item 4. If single mode: use `## Sequential steps` as a single numbered list.
5. Include `## D4 gate` only if the "Delivers result to human for decision?" input is yes.
6. Write in imperative tone throughout. No prose explanations outside the Objective section.
7. Every file operation in the new workflow must say "Delegate to a specialist agent via Task".
8. Write the file to `.opencode/skills/companion/workflows/<name>.md`.

When the Task returns: present the complete draft to the human. Proceed to Step 2.

---

### Step 2 — Review and correction loop

Verify the draft against the canonical structure checklist:

| Check | What to verify |
|---|---|
| H1 format is `# Title — Subtitle SOP` | First line of the file |
| `## Objective` present with explicit success condition | Non-empty; success condition stated |
| `## Required inputs` table has Required/Notes columns | Present; every row has an explicit Required status |
| Halt instruction present after inputs table | Exact text present |
| `Mode \| Inherited` row present if multi-mode | Present when execution mode includes more than one mode |
| Steps are numbered and imperative | No passive voice; each step has a clear action |
| File operations delegated via Task | No direct write/edit instructions to the Companion |
| Human decision steps end with halt + wait | Present wherever a human choice is required |
| `## Expected output` enumerates all artefacts with exact paths | Present and specific |
| `## D4 gate` present only when delivering result to human | Correct conditional presence |
| `## Exceptions` table covers known failure conditions | Present; each exception states step and response |

Surface all failures. Delegate corrections via Task targeting only the failing sections. Do not rewrite sections that passed. Repeat until the human approves the full content.

---

### Step 3 — Register in workflows-index.md

Delegate to a specialist agent via Task:
- Add a new row to the routing table in `.opencode/skills/companion/workflows-index.md`:
  `| <situation trigger> | <SDD phase> | <workflow title> | \`workflows/<name>.md\` |`
- Insert in phase order: Specify before Plan, Plan before Implement, Implement before Any.
- Do not modify any other line in the file.

When the Task returns: verify the new row appears in the routing table with the correct situation trigger, SDD phase, workflow title, and file path.

---

### Step 4 — Final verification (all modes)

Verify all three conditions before proceeding to the D4 gate:

| Condition | How to verify |
|---|---|
| Workflow file exists at `.opencode/skills/companion/workflows/<name>.md` | Confirm file is on disk |
| Row for the new workflow exists in `workflows-index.md` routing table | Confirm the situation trigger appears in the table |
| File contains all required sections in correct order | Spot-check H1, Objective, Required inputs, Sequential steps, Expected output, Exceptions — and D4 gate if applicable |

If any check fails: delegate a correction via Task before proceeding to the D4 gate.

---

## Expected output

Two artefacts written to disk via Task:

1. **Workflow file** — `.opencode/skills/companion/workflows/<name>.md`
   Complete SOP following the canonical structure. Imperative tone. All required sections present in correct order. Mode-branching structure if multi-mode. D4 gate if the workflow delivers a result to the human for a decision.

2. **Index registration** — `.opencode/skills/companion/workflows-index.md`
   One new row added to the routing table: `| <situation trigger> | <SDD phase> | <workflow title> | \`workflows/<name>.md\` |`

---

## D4 gate

The new workflow is on disk and registered in the routing table.

Ask the human: "The workflow is written and registered. What do you want to do next — commit, review the content further, or move to another task?"

Do not suggest a default. Wait for an explicit decision before taking any action.

---

## Exceptions

| Condition | Response |
|---|---|
| Any required input absent | Halt at Step 0.1; state which input is missing; wait |
| SDD phase not one of the five valid values | Halt at Step 0.1; list valid values (`Specify`, `Plan`, `Task`, `Implement`, `Any`); wait for correction |
| Situation trigger already registered in `workflows-index.md` | Halt at Step 0.3; surface the existing entry; ask whether to update the existing workflow or create a new one; wait for explicit decision |
| Workflow file already exists at target path | Halt at Step 1 before the Task is invoked; report the conflict; ask whether to overwrite or choose a different name; wait |
| `.opencode/skills/companion/workflows/README.md` unreadable | Halt at Step 0.2; report the access failure; wait for the human to resolve it |
| Specialist agent returns a workflow missing required sections | Identify each missing section; delegate a targeted correction via Task (not a full rewrite); verify against the checklist; repeat Step 2 |
| Human requests a workflow intended for humans (not for the Companion) | Surface the distinction: `docs/shared/workflows/` is for humans; `.opencode/skills/companion/workflows/` is for the Companion; ask which audience the new workflow is for; wait before proceeding |

**Authoring note — example messages:** Messages in workflows are instructional orientations that define what to communicate and roughly how long and direct to be — not scripts to be cited literally. Write them to convey the right intent and approximate register. The Companion will adapt them using its own voice and the language of the current conversation, consistent with its identity as defined in SKILL.md.