# Figma → UX Spec — Augmentation SOP

## Objective

Populate the `## UX Spec` section of an existing REQ file with structured design content
extracted from Figma, mapping each design element to the REQ's acceptance criteria. Success
condition: the target REQ file's `## UX Spec` section contains human-approved content
derived from the Figma design, all coverage gaps have been surfaced and resolved, and all open
questions are marked. This workflow is optional — implementation does not depend on its completion.

The active mode is inherited from the SKILL.md pipeline. The Companion must not ask.

The Companion never writes files directly. All file operations are delegated to a specialist
agent via Task.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| Target REQ identifier (e.g. `REQ-001`) | Required — halt if absent | Used to locate the REQ file under `docs/shared/requirements/` |
| Figma file key and node ID | Required — halt if absent; may be provided mid-workflow in Phase 1 | Extract from a Figma URL if provided (`figma.com/design/:fileKey/...?node-id=:nodeId`). If not provided initially, the Companion asks in Phase 1 before proceeding. |
| Additional Figma node links (for multi-screen flows) | Optional | Human provides as needed during Phase 2 when the flow spans multiple screens not captured by the initial node |
| Mode | Inherited | Do not ask. The active mode is already known from the SKILL.md pipeline. |

If the REQ identifier is absent: state which input is missing and wait. Do not proceed to
Phase 1 until all required inputs are confirmed or the Figma link has been requested from
the human.

---

## Sequential steps

### Phase 1 — Identify scope

1. Delegate to a specialist agent via Task to read the target REQ file from
`docs/shared/requirements/`. Report the full resolved path to the Companion. If the file is
not found: halt, report the path that was attempted, and wait for the human to resolve the
location before retrying.

2. From the returned file content, extract all of the following:

- The value of the `ux-spec` frontmatter field
- The current content of the `## UX Spec` section (if any)
- All acceptance criteria entries (`AC-NNN`) and their Given/When/Then text
- Any Figma links already present in the document

3. If `ux-spec: complete` is found in the frontmatter: inform the human that this REQ's UX Spec was previously marked complete by the Designer. Ask whether to continue updating it anyway. Wait for an explicit yes or no before proceeding to Phase 2.

4. If no Figma link is available (none found in the REQ in step 2, and none
provided by the human in the required inputs): halt. Ask the human to provide a Figma file
key and node ID, or a full Figma URL. Wait for the human to supply it before proceeding to
Phase 2.

---

### Phase 2 — Extract design from Figma

1. Use the Figma MCP tool `get_design_context` with the provided node ID and
file key to retrieve the design for the target node. If the MCP tool is unavailable: fall
back to the Figma REST API via curl using the `FIGMA_ACCESS_TOKEN` environment variable:

```
GET https://api.figma.com/v1/files/{fileKey}/nodes?ids={nodeId}
Authorization: Bearer $FIGMA_ACCESS_TOKEN
```

If the REST API returns a 403 or a node-not-found error: halt. Surface the error response,
state which file key and node ID were used, and ask the human to verify the link and confirm
that `FIGMA_ACCESS_TOKEN` has read access to the file. Wait.

2. From the extracted design content, identify and document each of the
following elements. Present the raw extraction output to the human as a structured list
before proceeding:

- **Component names** — identify each named component (e.g., Button, Input, Card, Modal)
  using design system component names if discernible from Code Connect annotations or layer
  naming conventions
- **Design tokens** — colour tokens (e.g., `primary/700`; never hex values), spacing
  values, and typography tokens as named in the design system; if only hex values are
  available, flag them as "token unknown — hex: #RRGGBB" and surface them as open questions
  for the Designer
- **Layout structure** — the arrangement and hierarchy of elements, including container
  relationships, alignment, and stacking order
- **Interaction states** — hover, focus, error, loading, disabled, and empty states visible
  in the design frames
- **Designer annotations** — any notes, constraints, or instructions present in the Figma
  frame

3. Ask: "Does this extraction look correct? Are there missing components, incorrect token names, or states I did not capture?" Wait for an explicit response.

4. If the human identifies errors or missing elements: correct the extraction using the human's input. Re-present the corrected extraction. Repeat until the human confirms the extraction is accurate. Do not proceed to the next step until confirmed.

5. If the flow includes multiple screens (e.g., a login form and a separate
error state screen), and not all screens are covered by the initial node: ask the human to
provide the additional node IDs or Figma URLs for the remaining screens. For each additional
node provided, repeat step 1 and step 2. Collect all extracted content before
proceeding to Phase 3.

---

### Phase 3 — Map to ACs and identify gaps

1. For each AC extracted in Phase 1 step 2, verify whether the design content
extracted in Phase 2 covers the acceptance criterion. Produce two lists:

   - **Coverage gaps** — ACs that have no corresponding design content in the Figma
     extraction (design is silent on what this criterion requires visually)
   - **Unspecified design content** — design states or elements visible in Figma that are not
     reflected in any AC in the REQ

2. Present both lists to the human in full. If either list is empty, state that
explicitly. Then ask: "Do these gaps require REQ expansion — new sub-requirements or ACs —
or are they acceptable to leave unaddressed at this stage?"

3. Wait for an explicit decision from the human before proceeding. Do not proceed
to Phase 4 until the human has responded.

4. If the human decides that REQ expansion is needed to cover any gap: pause Phase 4.

   Emit: `[Re-anchoring — resuming after REQ expansion]`

   Re-read directly in the Companion's own context — do not delegate:
   - `.opencode/skills/companion/SKILL.md`
   - `.opencode/skills/companion/hard-stops.md`

   Inform the human that the new ACs must be authored first using the `create-req` workflow before UX Spec coverage can be extended to them. Do not proceed to Phase 4 until the human confirms the REQ has been updated and provides the revised AC list.

---

### Phase 4 — Draft UX Spec content

1. From the verified design extraction and the gap decisions confirmed in Phase
3, draft the full `## UX Spec` section content for the REQ.

Structure the draft with one subsection per distinct screen or design state. Name each
subsection descriptively (e.g., `### Login Screen`, `### Error — Authentication Failure`,
`### Loading State`).

2. Each subsection must contain all of the following that are applicable:

- **Figma link** — direct link to the specific Figma node for this screen or state (format:
  `[View in Figma](https://figma.com/design/{fileKey}/...?node-id={nodeId})`)
- **Component inventory** — a table listing each component present, its name, and its role
  in the screen:
  `| Component | Role |`
- **Design token references** — colour, spacing, and typography tokens by name; never hex
  values, never CSS class names
- **Layout description** — describe the hierarchy and arrangement of elements in plain
  language; do not use CSS property names or flexbox/grid terminology
- **Interaction states** — list each state visible in the design and describe the visual
  change it produces
- **Open questions for the Designer** — any element whose token, behaviour, or intent could
  not be determined from the design; prefix each with `[?]`

3. Apply this rule throughout: no implementation details. Do not include variant
prop names (e.g., `variant="primary-outline"`), hex colour values, CSS class names, or
library-specific attribute syntax. Design token names (e.g., `primary/700`) are acceptable
— they are specification, not implementation.

4. Present the complete draft to the human. Ask: "Does this draft accurately
reflect the design? Are there corrections, missing states, or open questions to add or
remove?"

5. Incorporate corrections. Re-present the updated draft. Repeat until the human explicitly approves the full draft without further corrections.

   If three revision cycles pass on the same subsection without resolution: ask the human directly "What is the core issue with this section?" Use the answer to reconstruct that subsection from scratch rather than incrementally patching it.

   Do not proceed to the reanchoring block below until approval is given.

---

**REANCHORING — before writing to the REQ:**

Emit: `[Re-anchoring — rereading SKILL.md and hard-stops.md before writing in the REQ]`

Re-read directly in the Companion's own context — do not delegate:
- `.opencode/skills/companion/SKILL.md`
- `.opencode/skills/companion/hard-stops.md`

Only after completing these reads proceed to Phase 5.

---

### Phase 5 — Write to REQ

1. Delegate to a specialist agent via Task with the following instructions:

- Read the current REQ file at its resolved path
- Replace the entire `## UX Spec` section with the approved draft content from Phase 4
- Preserve all other sections exactly — frontmatter, headings, body text, and all other
  content must remain unchanged
- Write the updated file back to the same path

2. When the Task returns: confirm that the `## UX Spec` section in the file
matches the approved draft exactly. If the write failed or the section content does not
match: halt. Report the error. Do not proceed to Phase 6 until the file has been written
correctly.

---

### Phase 6 — Open questions to Figma

1. If no open questions were identified in Phase 4 (no `[?]` entries in the
approved draft): skip Phase 6 entirely and proceed to the D4 gate.

2. If open questions exist: ask the human "There are open questions in the UX
Spec draft. Do you want to post them as comments on the relevant Figma nodes?" Wait for an
explicit yes or no.

3. If yes: for each open question, delegate to a specialist agent via Task to
post a comment on the specific Figma node using the REST API:

```
POST https://api.figma.com/v1/files/{fileKey}/comments
Authorization: Bearer $FIGMA_ACCESS_TOKEN
Content-Type: application/json

{
  "message": "<question text, stripped of the [?] prefix>",
  "client_meta": {
    "node_id": "<nodeId>",
    "node_offset": { "x": 0, "y": 0 }
  }
}
```

Confirm each comment was posted successfully. If any post fails: report the failure and the
question that was not posted; do not block the D4 gate for comment failures.

4. If no: skip posting and proceed to the D4 gate.

---

## D4 gate

The `## UX Spec` section has been updated in the REQ file.

Conduct the three diligence sub-dimensions before closing:

**Creation** — The UX Spec content was co-created from Figma designs with human validation at each phase. Confirm with the human: "Is the content in the UX Spec yours to approve? Were there design decisions here that belong to the Designer and have not been verified yet?"

**Transparency** — Open questions (`[?]` entries) are the transparency markers in this output. Confirm: "Are there open questions that have not yet been posted to Figma or communicated to the Designer? If so, how will they reach the Designer?"

**Deployment** — The REQ is now updated. The `ux-spec` frontmatter field, if present, is never modified by this workflow. Ask: "Has the Designer been informed that the UX Spec is ready for their review?"

After these three checks: ask the human what they want to do next — notify the Designer, commit the REQ update, or continue to another task.

Do not suggest a default. Wait for an explicit decision before taking any action.

---

## Expected output

**1. Updated REQ file** — same path as input (e.g.
`docs/shared/requirements/REQ-001-google-login.md`)

- `## UX Spec` section replaced with the approved draft content
- All other sections preserved exactly
- `ux-spec` frontmatter field remains `in-progress` — the Companion never changes this
  field

**2. Figma comments** (conditional) — one comment posted per open question (`[?]` entry)
on the specific Figma node identified for that question, if the human approved posting in
Phase 6.

---

## Exceptions

| Condition | Response |
|---|---|
| Target REQ identifier absent | Halt before Phase 1; state which input is missing; wait |
| REQ file not found at resolved path | Halt at step 1.1; report the exact path attempted; wait for the human to resolve the location |
| `ux-spec: complete` on the target REQ | Warn at step 1.3; inform the human the UX Spec was previously marked complete; ask whether to continue; wait for explicit yes or no |
| No Figma link available in REQ or from human | Halt at step 1.4; ask the human to provide a Figma file key and node ID or URL; wait |
| Figma MCP tool unavailable | Fall back to REST API in step 2.1 using `FIGMA_ACCESS_TOKEN`; do not halt unless the REST API also fails |
| Figma REST API returns 403 or node not found | Halt at step 2.1; surface the error response; state the file key and node ID used; ask the human to verify the link and token; wait |
| `FIGMA_ACCESS_TOKEN` not set in environment | Halt at step 2.1; state that the environment variable is required for REST API fallback; ask the human to set it; wait |
| Phase 3 gap — human decides REQ expansion is needed | Pause Phase 4 at step 3.4; direct the human to the `create-req` workflow to author the new ACs; do not draft UX Spec content for uncovered ACs; resume Phase 4 only when the human confirms the REQ is updated |
| Design contains only hex values — no token names discernible | Flag all hex values as "token unknown" in step 2.2; mark each as `[?]` in the Phase 4 draft; surface them to the Designer via Figma comments if the human approves in Phase 6 |
| Human rejects Phase 4 draft repeatedly | After three revision cycles on the same subsection, ask: "What is the core issue with the current draft?" Use the answer to reconstruct that subsection from scratch rather than incrementally patching it |
| Specialist agent fails to write REQ file in Phase 5 | Halt at step 5.2; report the error; do not proceed to Phase 6 until the file is written correctly |
| Figma comment POST fails in Phase 6 | Report the failure and the question that was not posted; do not block the D4 gate; inform the human that the question must be posted manually |
| REQ has no `## UX Spec` section | Delegate a Task to add the section heading and placeholder before the approved draft is inserted; confirm placement follows the section order in the REQ template |
