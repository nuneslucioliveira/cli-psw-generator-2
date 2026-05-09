# UX Intent → Figma Wireframes — Augmentation / Agency SOP

## Objective

Given a REQ with a populated UX Intent section, generate medium-fidelity wireframes in Figma
using flow-core-design-system components positioned as inspiration for the Designer to begin
their studies. Success condition: a Figma Section containing N wireframe frames (1440×1080
each) exists on the target page, a direct link to the Section has been shared with the human,
component decisions are documented with rationale, and the Designer has been notified of the
link.

The active mode is inherited from the SKILL.md pipeline. The Companion must not ask.

The REQ file is not modified by this workflow. File reads are delegated to a specialist agent
via Task. Figma operations are performed directly using MCP tools.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| REQ identifier (e.g. `REQ-001`) | Required — halt if absent | Used to locate REQ file under `docs/shared/requirements/` |
| Figma file key | Optional | Default: `bogus-api-key`. Use default if not provided. |
| Figma page name | Optional | Default: `Playground`. Located via `check-figma-page.js`. If not found, ask human. |
| Screens to generate | Optional | Augmentation: ask human (suggest: main screen only). Agency: use default (main screen only), report what was used. |
| Number of variations | Optional | Augmentation: ask human (suggest: 2). Agency: use default (2), report what was used. |
| Mode | Inherited | Do not ask. Active mode is already known from SKILL.md pipeline. |

If the REQ identifier is absent: state which input is missing and wait. Do not proceed to
Phase 1 until the REQ identifier is provided.

---

## Sequential steps

### Step 0 — Design context

1. Check whether `.impeccable.md` exists at the project root.
   - If found: load its content as `design_context`. This will be passed to the `ux-architect` in Phase 4.
   - If not found at the project root: ask the human for the correct path. All messages to the human MUST be written in the language the human is using in the current conversation.
   - If the human confirms it does not exist: execute the `teach-impeccable` skill via Task before proceeding. Wait for the skill to complete and the file to be created before continuing to Phase 1.

### Phase 1 — Read and validate REQ

Run validation scripts before any other action. Resolve the full path to the REQ file from
the identifier before running any script — the resolved path is the argument passed to each
script (e.g. `docs/shared/requirements/REQ-001-google-login.md`). Delegate a Task to locate
the file if the exact filename is not known.

1. Run `.opencode/skills/companion/scripts/check-ux-intent-present.js <req-file>`. If FAIL: halt in both Augmentation
   and Agency modes. State that the UX Intent section is required to generate wireframes. Wait
   for explicit instruction.

2. If the script PASS: delegate to a specialist agent via Task to read the REQ file from
   `docs/shared/requirements/`. Extract: id, name, Problem Statement, UX Intent content, and
   all AC entries.

---

### Phase 2 — Locate Figma page

1. Run `.opencode/skills/companion/scripts/check-figma-page.js <fileKey> <pageName>`.
   - If PASS: use the `PAGE_ID` value from the script output for all subsequent Figma calls.
   - If FAIL: the output includes the `AVAILABLE_PAGES` list. Present it to the human and ask
     which page to use. Wait for an explicit answer before proceeding.

---

### Phase 3 — Check for duplicate Section

1. Run `.opencode/skills/companion/scripts/check-figma-section.js <fileKey> <pageId> <reqId>`.
   - If PASS: no duplicate exists. Proceed to Phase 4.
   - If FAIL: the script output includes `EXISTING_NODE_ID`, `EXISTING_NAME`, and
     `FIGMA_LINK`. Present these to the human and ask what to do: replace the existing
     Section, create a new version (with a suffix), or cancel. **Always ask, regardless of
     mode.** Wait for explicit decision before proceeding.

Section naming convention: `REQ-NNN - short-name`
Example: `REQ-001 - Login`

---

### Phase 3b — Confirm scope and disruption intent

**Augmentation:** Ask the human the following three questions in a single natural message — not as a form:
- Which additional screens to generate beyond the main screen (if any)?
- How many variations per screen? (suggest 2)
- On a scale of 0 to 10, how disruptive should the proposals be? (0 = familiar and safe, within expectations; 10 = bold, memorable, challenges the obvious)

Wait for explicit answers. Record: `additional_screens`, `variation_count`, `disruption_scale`.

Derive the skill instruction for Phase 4 based on `disruption_scale`:
- 0–3: `skill_instruction = none` — standard brief, no personality push
- 4–6: `skill_instruction = delight` — introduce moments of joy without breaking familiar patterns
- 7–10: `skill_instruction = delight + bolder` — intentionally differentiate variations with strong personality; one variation may be more restrained, the other should challenge the obvious

**Agency:** use defaults: `additional_screens = none`, `variation_count = 2`, `disruption_scale = 7` (`skill_instruction = delight + bolder`). Report what was used. No human interaction.

### Phase 4 — Brief

1. Delegate via Task to the `ux-architect` agent with the following input:
   - Problem Statement + UX Intent content + ACs extracted in Phase 1
   - `design_context` from `.impeccable.md` (Step 0)
   - `variation_count` and `disruption_scale` from Phase 3b
   - `skill_instruction` derived in Phase 3b

   The agent must produce, for each variation:
   - Primary objective of the screen
   - Key user behaviours from the UX Intent
   - Types of components needed per section (intent-level — no Figma keys required)
   - Proposed structure with distinct intentions between variations
   - Relevant states and edge cases
   - One-sentence personality intention per variation

   If `skill_instruction` is `delight`: instruct the agent to load the `delight` skill in its own context, extract principles relevant to this product's personality, and apply them to introduce moments of joy without breaking familiar patterns.

   If `skill_instruction` is `delight + bolder`: instruct the agent to load both the `delight` and `bolder` skills in its own context, extract principles relevant to this product's personality and UX Intent, and use them to intentionally differentiate the variations — each variation must have a distinct personality intention.

2. **Augmentation:** present the brief to the human. Wait for validation before proceeding to
   Phase 6. The human may correct or approve.

   **Agency:** use the brief internally. Do not present. Proceed directly to Phase 6.

---

**REANCHORING — before generating in Figma:**

Emit: `[reancorando — relendo SKILL.md e hard-stops.md antes de gerar no Figma]`

Re-read directly in the Companion's own context — do not delegate:
- `.opencode/skills/companion/SKILL.md`
- `.opencode/skills/companion/hard-stops.md`

Only after completing these reads proceed to Phase 6.

---

### Phase 6 — Generate Figma code

1. Delegate via Task to the `senior-developer` agent with the following input:
   - Brief from Phase 4 (all variations with component types and personality intentions)
   - Figma fileKey and pageId from Phase 2
   - Section naming convention from Phase 3
   - `variation_count` and frame layout specs (1440×1080 each, 355px gap, starting x=200 y=420)
   - Section structure to replicate: node `147:3899`

   Instruct the agent explicitly:
   - Load the `figma-use` and `figma-generate-design` skills in its own context before writing any code
   - Discover components by inspecting existing screens in the Figma file first — do NOT rely on `search_design_system` as primary discovery method; only fall back to it when no existing screens are available to inspect
   - Decide which components to use from what is actually available in the file, with one-line rationale per component choice
   - **Produce the JavaScript code only — do not execute it**. The Companion will call `use_figma` directly in Phase 7 with the code returned by this Task
   - The code must create:
     - Section with name = `REQ-NNN - short-name` (naming convention from Phase 3)
     - Frame "Content" (full width, height 220) containing:
       - Text "Title": `REQ-NNN — REQ Name | N variation(s)`
       - Text "Extra info": list of screens to be generated
     - N wireframe frames (1440×1080 each) arranged horizontally with 355px gap, starting at x=200, y=420
     - Each frame named: "Variante A — [variation title]", "Variante B — ...", etc.
     - Section positioned below all existing content on the page (max Y + height + 200px)
     - Medium-fidelity wireframes using Flow Design Language components per brief
     - One-line rationale per component choice documented in a comment block at the top of the code

### Phase 7 — Generate in Figma

1. Use `use_figma` directly with the fileKey and the JavaScript code returned by the
   `senior-developer` Task in Phase 6. The Companion executes this call — it is not delegated.

2. Attempt 1 — verify: use `figma_get_metadata` on the pageId to check that the Section with
   the correct name exists among direct children.
   - If confirmed: record the nodeId of the created Section. Proceed to Phase 8.
   - If not confirmed: wait 3 seconds and proceed to step 3.

3. Attempt 2 — repeat the verification call.
   - If confirmed: record the nodeId. Proceed to Phase 8.
   - If not confirmed: alert the human regardless of mode. Report the error and wait for
     instruction.

---

### Phase 8 — Report result

1. Present the following to the human:
   - Direct Figma link: `https://www.figma.com/design/{fileKey}/?node-id={nodeId}` (format
     nodeId with hyphen, e.g. `341-11153`)
   - Component decisions made (which components were used and the rationale from `senior-developer`)
   - Scope generated (screens and number of variations)
   - Note: the Designer should bring the final artefact link when they finish their studies
     and adjustments.

---

## Reanchoring triggers

1. **Mandatory:** before Phase 6 (before any write to Figma)
2. **Conditional (Augmentation only):** if the human requests scope expansion after Phase 4
   brief validation, emit `[Re-anchoring — resuming after scope adjustment]`, re-read SKILL.md
   and hard-stops.md, then return to Phase 3b with updated scope.

---

## D4 gate

The wireframes have been generated in Figma and the link has been shared.

Ask the human in a single natural message — not as a menu:
- Would they like to notify the Designer with the Figma link?
- Would they like to generate more variations or screens?
- Would they like to refine any variation — make it bolder or simplify one that feels too busy?

If `disruption_scale` ≥ 7, add naturally: "You asked for more disruptive proposals — worth a look before passing to the Designer."

Do not suggest a default. Do not use internal skill names (`bolder`, `distill`) in messages to the human. Wait for an explicit decision before taking any action.

---

## Expected output

1. **Figma Section** — created on the target page in the file (or human-specified
   file), named `REQ-NNN - short-name`, containing N wireframe frames (1440×1080) per screen
   with Flow Design Language components positioned according to the brief.
2. **Figma link** — direct URL to the created Section node.
3. **Component decisions report** — list of components used with one-line rationale per
   component.

The REQ file is NOT modified by this workflow.

---

## Exceptions

| Condition | Response |
|---|---|
| REQ identifier absent | Halt before Phase 1; state which input is missing; wait |
| REQ file not found at resolved path | Halt at Phase 1 step 3; report the exact path attempted; wait |
| `check-ux-intent-present.js` returns FAIL | Halt at Phase 1 step 1 in both modes; state UX Intent is required; wait for explicit instruction |
| `check-figma-page.js` returns FAIL | Present AVAILABLE_PAGES from script output; ask human which page to use; wait |
| `check-figma-section.js` returns FAIL (duplicate) | Present EXISTING_NAME and FIGMA_LINK from script output; ask human to decide (replace / new version / cancel); wait — always ask regardless of mode |
| `figma_search_design_system` returns no relevant components | `senior-developer` uses generic layout components and documents this in the component decisions report |
| `use_figma` produces no verifiable Section after 2 attempts | Alert the human regardless of mode; report the error; wait for instruction. Note: if the Figma PAT token is read-only, `use_figma` will execute silently without creating any nodes — this is indistinguishable from a successful call at the API level. If this is suspected, ask the human to verify token write permissions. |
| `ux-architect` or `senior-developer` Task returns error | Report the error; do not proceed to the next phase until resolved |
| Human requests scope expansion during Augmentation Phase 4 | Emit reanchoring signal; re-read SKILL.md and hard-stops.md; return to Phase 3b with updated scope |
| `.impeccable.md` not found and human cannot provide path | Execute `teach-impeccable` via Task; wait for completion before proceeding to Phase 1 |
| `ux-architect` Task returns without personality intention per variation | Request the missing field before proceeding to Phase 6 |
| `senior-developer` Task returns without component rationale comments | Request the missing rationale before proceeding to Phase 7 |
