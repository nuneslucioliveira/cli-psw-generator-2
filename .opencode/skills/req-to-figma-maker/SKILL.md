---
name: req-to-figma-make
description: Converts a REQ, PRD, or any requirements document into a structured TC-EBC prompt for Figma Make. Triggers on "convert to Figma Make", "generate Make prompt", "TC-EBC from spec", or any request to prepare requirements for UI/UX prototyping in Figma.
---

# REQ to Figma Make

Converts any product requirement document into a structured TC-EBC prompt for Figma Make. Use when the intent is to generate a Figma Make prompt from a requirements document, spec, PRD, or user story — regardless of format or naming convention. Triggers on: "convert to Figma Make", "generate Make prompt", "TC-EBC from spec", "Figma Make from requirements", or any request to prepare requirements for UI/UX prototyping in Figma.

---

## What this skill does

Reads a requirements document and extracts a structured prompt in the TC-EBC format (Task, Context, Elements, Behavior, Constraints) — the prompt structure that produces the best results in Figma Make, as documented by Figma's own design advocacy team.

The output is a self-contained prompt the user copies and pastes directly into Figma Make. Nothing else is modified.

---

## How to extract TC-EBC from any document

The input document can be any format: a structured REQ with numbered sections and YAML frontmatter, a narrative PRD, a Notion page, a user story, or raw notes. The skill does not depend on a specific document structure.

For each TC-EBC field, scan the entire document using semantic meaning — not section titles.

### Task

What is being built. Look for: document title, feature name, the first sentence that describes the deliverable.

Write as a single imperative sentence: "Build a...", "Create a...", "Design a..."

### Context

Who uses it, when, and why it matters. Look for: stakeholder descriptions, user personas, problem statements, background sections, jobs-to-be-done, user stories, any paragraph that answers "who has this problem and what are they trying to accomplish?"

Write 2–3 sentences. Name the user role and the core task they perform. Include the scenario that makes this feature necessary.

### Elements

UI components the prototype needs. Look for: any mention of screens, panels, drawers, modals, forms, buttons, cards, lists, badges, menus, toggles, progress indicators, charts, graphs, or navigation elements — anywhere in the document (functional requirements, user flows, acceptance criteria, wireframe descriptions).

Write as a bulleted list. Each item is a component with a brief qualifier:
- "Lateral drawer (signal detail + curation form)"
- "Contextual action menu on group nodes (Keep / Discard / Favorite)"

### Behavior

What happens when the user interacts. Look for: acceptance criteria (Given/When/Then), user flows, interaction descriptions, state transitions, any sentence following the pattern "when the user does X, the system does Y."

Convert to active, direct statements:
- "User clicks group node → contextual menu appears"
- "User applies Keep Group → all child nodes update status immediately"

Drop the Given/When/Then ceremony — Figma Make needs action→result pairs, not test specifications.

### Constraints

What the design must respect and what it must not do. Look for: non-functional requirements, accessibility requirements, platform constraints (desktop-first, mobile-first), layout mandates ("hierarchical, not free-form"), performance limits, out-of-scope declarations, policy constraints, any explicit "do not" or "must not" statement.

Write as a bulleted list. Lead with structural/layout constraints, then platform, then accessibility, then content/vocabulary constraints.

---

## Prioritisation

If the document contains a section explicitly labeled as UX Intent, UX Goals, or similar (describing user goals, mental model constraints, key behaviors, and reference feeling), prioritise that content for Context, Behavior, and Constraints — it is pre-digested for design consumption and maps most directly to TC-EBC.

If no such section exists, infer from whatever the document provides. The skill works either way.

---

## Edge cases

**Document has no identifiable UI components:**
Before generating, check whether the document describes a user-facing interface. If it describes only backend processing, data pipelines, infrastructure, or analytical processes with no user interaction, respond:

> "This document does not appear to describe a user-facing interface. A TC-EBC prompt for Figma Make may not be useful here. Want me to proceed anyway?"

**Insufficient information for a TC-EBC field:**
If a field cannot be reliably extracted, include it in the output with a placeholder:

```
**Context:** [to clarify — the document does not identify who uses this feature or why]
```

After the prompt, list what was missing so the user can fill the gaps before pasting into Make.

**Document is very long (>500 lines):**
Focus extraction on the first occurrence of each TC-EBC element. Do not attempt to merge contradictory information from different sections — use the earliest, most authoritative source.

---

## Output format

Always produce this exact structure:

```markdown
## Figma Make Prompt — [Feature Name]

**Task:** [one sentence]

**Context:** [2–3 sentences]

**Elements:**
- [component 1]
- [component 2]
- ...

**Behavior:**
- [action → result]
- [action → result]
- ...

**Constraints:**
- [constraint 1]
- [constraint 2]
- ...

---
> Paste this prompt directly into Figma Make.
> Suggested model: Claude Sonnet (best for layered, contextual prompts).
> Attach your design system library (Make Kit) before prompting for on-brand output.
```

Keep the entire prompt under 300 words. Figma Make performs better with concise, structured input than with exhaustive detail. If the source document is rich, distill — do not transcribe.