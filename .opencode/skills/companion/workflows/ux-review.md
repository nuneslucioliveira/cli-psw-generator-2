# UX Review — Augmentation / Agency SOP

## Objective

Review a Figma design frame against the REQ it implements. Success condition: all ACs have been evaluated against the frame, findings have been posted as comments on the correct Figma nodes, and a structured report has been delivered in the conversation. Supports two modes — Agency (default: executes and delivers result) and Augmentation (presents each finding for human approval before posting). Active mode is inherited from SKILL.md — never ask.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| Entry point | Required — halt if absent | One of: (a) Figma frame URL, (b) REQ identifier, or (c) both |
| Mode | Inherited | Do not ask |

If the entry point is absent: state that the entry point is required, and wait. Do not proceed to Step 0.

---

## Sequential steps

### Step 0 — Resolve entry point (all modes)

1. Confirm the entry point is present. If absent: halt. State that the entry point is required. Wait.

2. Resolve the missing half using whichever branch applies:

- **Frame URL only — no REQ identifier provided:** Call `figma_get_design_context(fileKey, nodeId)`. Store the result — it will be reused in Step 1, which must not call `figma_get_design_context` again for the same node. Extract component names, text strings, and interactive elements from the stored result. Read `docs/shared/requirements/index-<domain>.md` files to identify candidate REQs by content match. Warn the human that inference may take time. If multiple candidates are identified: present the full list, halt, and wait for the human to confirm which REQ to use before proceeding to Step 0.3.

- **REQ identifier only — no frame URL provided:** Read the REQ file at `docs/shared/requirements/`. Look for Figma links in the `## UX Spec` section (format: `[label](https://figma.com/design/{fileKey}/...?node-id={nodeId})`). If found: use those links as the resolved frame(s) and proceed to Step 0.3. If not found: ask the human for the frame URL, halt, and wait.

- **Both provided:** Proceed directly to Step 0.3.

3. Read the resolved REQ file. Extract: `status` field, `ux-spec` field, content of `## UX Intent`, content of `## UX Spec`, all `AC-NNN` criteria with their full Given/When/Then text, and the full content of `## 5. Out of Scope`.

If `ux-spec: complete` is found: note it as context — the Designer has signed off the spec. The review proceeds normally; findings are still valid and should be posted.

---

### Step 1 — Read Figma frame (all modes)

1. For each resolved frame: if `figma_get_design_context` was already called for this node in Step 0.2, reuse that stored result. Otherwise call `figma_get_design_context(fileKey, nodeId)` now. Extract: component names and structure, all visible text strings, interactive elements (buttons, inputs, dropdowns), and navigation states present in the frame.

2. If the result from Step 1.1 is truncated or empty: call `figma_get_metadata(fileKey, nodeId)` as fallback and extract available structural information.

---

### Step 2 — Read existing Figma comments (all modes)

1. Fetch all comments on the file:

```
GET https://api.figma.com/v1/files/{fileKey}/comments
X-Figma-Token: $FIGMA_ACCESS_TOKEN
```

2. Filter the response to comments on the resolved node(s). For each matching comment: record the node ID, author, message (first 150 characters), and resolved/open status.

3. Build a map of already-addressed items from the filtered comments. Use this map in Step 3 to avoid posting duplicate findings.

---

### Step 3 — Layer 1: AC coverage (all modes)

1. For each `AC-NNN` extracted in Step 0.3, assign exactly one result from the following set:

- `COVERED` — the frame clearly shows the state or interaction the AC describes
- `PARTIAL` — the frame hints at the AC but leaves ambiguity (post as `PARTIAL` finding)
- `MISSING` — no element in the frame addresses this AC (post as `MISSING` finding)
- `BLOCKER` — the frame contradicts the AC or implements something the AC explicitly prohibits (post as `BLOCKER` finding)
- `N/A` — the AC is backend-only or not user-facing
- `ALREADY COMMENTED` — an existing comment from Step 2 already addresses this AC

2. Record every AC with its assigned result. Do not skip any AC.

---

### Step 4 — Layer 2: Interpretive analysis (all modes)

1. **UX Intent alignment.** If `## UX Intent` exists in the REQ, evaluate whether the frame structure and key behaviours match the stated intent. Flag all deviations found.

2. **Out of Scope conflicts.** Check whether any element in the frame implements something listed in `## 5. Out of Scope`. For each conflict found: name the frame element and the Out of Scope item it corresponds to.

3. **Undocumented elements.** Identify interactive elements or flows in the frame that are not covered by any AC and not described in UX Intent. Flag each as either a scope addition or a designer decision.

4. **Helper text and labels.** Check all visible text strings from the frame against any text or label constraints in the REQ. Flag mismatches.

---

### Step 5 — Post findings as Figma comments (mode-branching)

Execute the branch that matches the active mode. Do not mix branches.

---

**Agency mode:**

Post all `BLOCKER` and `MISSING` findings as Figma comments immediately using the POST call below. Hold `PARTIAL` and `UNDOCUMENTED` findings — do not post them yet. After posting, proceed to Step 6. In the Step 6 report, list held findings under FINDINGS HELD FOR HUMAN DECISION and ask the human whether to post them.

---

**Augmentation mode:**

Present the full findings list to the human before posting any comment. For each finding state: the target node ID, the proposed comment text, and the REQ reference. Ask the human to confirm, modify, or discard each finding. Post only findings the human has explicitly approved. Halt and wait for approval before posting each comment.

---

**Comment format (both modes):**

- One to two lines maximum
- Cite the REQ and specific AC or section: `REQ-002 (AC-006)` or `REQ-002 (Out of Scope)`
- Name the specific element or field at issue
- End with an open question inviting a Designer response
- Direct, clear language — not passive

**Post each comment via:**

```
POST https://api.figma.com/v1/files/{fileKey}/comments
X-Figma-Token: $FIGMA_ACCESS_TOKEN
Content-Type: application/json

{
  "message": "<comment text>",
  "client_meta": {
    "node_id": "<nodeId>",
    "node_offset": { "x": 0, "y": 0 }
  }
}
```

---

### Step 6 — Compose and deliver report (all modes)

1. Determine the verdict using the rules below:

- `BLOCKED` — REQ `status` is `draft` AND has no `AC-NNN` entries (spec too unstable to review meaningfully)
- `NEEDS WORK` — one or more ACs are `BLOCKER` or `MISSING`, or one or more Out of Scope conflicts were identified in Step 4.2
- `APPROVED WITH COMMENTS` — no `BLOCKER` or `MISSING` ACs, no Out of Scope conflicts, but one or more `PARTIAL` results or undocumented elements are present
- `APPROVED` — all ACs are `COVERED` or `N/A`, no Out of Scope conflicts, no undocumented elements

Note: a REQ with `status: draft` but with ACs present is reviewable — set the verdict based on coverage, not on status alone. Mention the draft status in the report as a context note.

2. Deliver the report in the conversation using exactly this format:

```
VERDICT: APPROVED | APPROVED WITH COMMENTS | NEEDS WORK | BLOCKED

LAYER 1 — AC COVERAGE
[each AC-NNN: result]

LAYER 2 — INTERPRETIVE ANALYSIS
UX Intent alignment: [findings or "aligned"]
Out of Scope conflicts: [findings or "none"]
Undocumented elements: [findings or "none"]
Helper text / labels: [findings or "none"]

FINDINGS POSTED TO FIGMA
[numbered list — node ID, comment text, severity: BLOCKER / MISSING / PARTIAL]

FINDINGS HELD FOR HUMAN DECISION (Agency mode only)
[numbered list or "none"]

---
*Posted with AI assistance — companion*
```

---

## Expected output

**1. Figma comments** — one comment posted per finding, on the correct Figma node. Each comment cites the REQ and the specific AC or section, names the element at issue, and ends with an open question inviting a Designer response.

**2. Review report** — structured report delivered in the conversation using the exact format in Step 6.2. Not posted to Figma.

---

## D4 gate

After delivering the report, conduct the three diligence sub-dimensions before closing:

**Creation** — Comments were posted publicly on the Figma file on behalf of the reviewer. Confirm with the human: "Are you comfortable with the comments posted? Do they represent the team's position, or should any be revised or removed?"

**Transparency** — The report cites REQ ACs and Out of Scope items. Confirm: "Were there findings you chose not to post? If so, how will they reach the Designer?"

**Deployment** — The review is complete but the Designer has not been notified. Ask: "Does the Designer know this review was posted? Is there a follow-up expected from them?"

After these three checks: ask the human what they want to do next — review another frame, notify the Designer, update the REQ, or move to another task. Do not suggest a default. Halt and wait for an explicit decision before taking any action.

---

## Exceptions

| Condition | Response |
|---|---|
| Entry point absent | Halt at Step 0.1; state that the entry point is required; wait |
| `figma_get_design_context` fails | Try `figma_get_metadata`; if both fail: report the error, ask the human to verify the URL and token; wait |
| REQ file not found | Halt at Step 0.2; report the path that was attempted; wait |
| REQ `draft` + `ux-spec` absent | Set VERDICT to BLOCKED; surface this to the human; ask whether to proceed anyway; wait |
| No Figma links in REQ and no frame URL provided | Ask the human for the frame URL; wait |
| Multiple candidate REQs identified from frame inference | Present the full list; wait for the human to confirm which REQ to use before proceeding to Step 0.3 |
| Figma comment POST fails | Report the error and the comment text that was not posted; ask the human whether to retry or skip; wait |
| Finding already addressed by an existing comment | Mark as `ALREADY COMMENTED`; do not post a duplicate |
| `FIGMA_ACCESS_TOKEN` not set | Halt; state that the environment variable is required; wait |
