---
name: doc-review
description: Review a REQ or ADR in this repository against the project authoring guidelines. Checks all PR checklist items, flags blockers vs recommendations, and verifies index file presence. Invoke with /doc-review [file-path], or without arguments to review files modified in the current branch.
disable-model-invocation: true
---

# doc-review

Reviews a REQ or ADR document against the project authoring guidelines.
Loads the full guidelines at runtime — no rules are duplicated here.

## Step 1 — Identify the target file(s)

If `$ARGUMENTS` is provided, use that file path as the target.

If no argument is given, run:

```!
git diff --name-only main
```

Filter the output for `.md` files under `requirements/` or `architecture/adrs/`.
If nothing is found after filtering, report: "No REQ or ADR files found in the current diff against main."

## Step 2 — Detect document type

Read the target file. Determine the type:

- **REQ** — path contains `requirements/REQ-` OR frontmatter contains `id: REQ-`
- **ADR** — path contains `architecture/adrs/` AND filename matches `[0-9]*.md` OR frontmatter contains `id: ADR-`
- **Unknown** — report that the file is not a recognized REQ or ADR and stop.

## Step 3 — Load the authoring guidelines

Read the full guidelines for the detected type:

- For **REQ**: read `docs/shared/requirements/guidelines.md`
- For **ADR**: read `docs/shared/architecture/adrs/guidelines.md`

Apply the complete PR Checklist from the loaded guidelines. Do not rely on memory — read the file.

## Step 4 — Apply the checklist

Work through every item in the `## PR Checklist` (or `## 9. PR Checklist`) section of the loaded guidelines.

Classify each finding as:

- **[BLOCKER]** — items listed under "Blocker (hard stop — PR cannot be merged)"
- **[RECOMMENDATION]** — items listed under "Recommendations (not blockers)"

For each finding, quote the specific line or field that triggered it and state the required fix.

## Step 5 — Verify index presence

This is always a **[BLOCKER]** if failing.

**For REQ:**
- Read the `domain` field from the frontmatter.
- Read `docs/shared/requirements/index-<domain>.md`.
- Check that the REQ `id` (e.g. `REQ-004`) appears in that file.
- If absent: `[BLOCKER] REQ-NNN is not listed in docs/shared/requirements/index-<domain>.md. Add it in the same PR.`

**For ADR:**
- Read the `service` field from the frontmatter.
- Read `docs/shared/architecture/adrs/index-<service>.md`.
- Check that the ADR `id` (e.g. `ADR-007`) appears in that file.
- If absent: `[BLOCKER] ADR-NNN is not listed in docs/shared/architecture/adrs/index-<service>.md. Add it in the same PR.`

## Step 6 — Output

Format the result as follows:

```
## Review: <ID> — <Title>

**File:** <path>
**Type:** REQ | ADR
**Status:** <status field value>

---

### BLOCKERS (must fix before merge)

- [BLOCKER] <finding> — Fix: <specific action required>

*(or "No blockers found." if clean)*

---

### RECOMMENDATIONS

- [RECOMMENDATION] <finding> — Suggestion: <specific improvement>

*(or "No recommendations." if clean)*

---

### PASSED

- ✓ <item>
```

If there are no blockers, state that explicitly at the top: "**No blockers. This PR is ready to merge (pending human approval).**"