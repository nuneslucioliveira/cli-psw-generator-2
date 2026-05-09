# Issue Tracking Workflow

> This guide describes how the SDD lifecycle maps to GitHub Issues — who creates what, when, and how to keep issues connected to the REQs and ADRs that motivated them.

## Who is this for?

| Persona | Typical action |
|---------|----------------|
| **PM / PO** | Open the tracking issue when a REQ reaches `accepted` |
| **Software Architect** | Mark the Plan phase complete; decide whether ADRs are needed |
| **Developer** | Pick up implementation issues, link PRs, update REQ status on merge |

---

## One tracking issue per REQ

Each accepted REQ gets a single GitHub tracking issue that follows it through the full SDD lifecycle. Implementation issues are created during the Task phase and linked back to the tracking issue.

**Who opens it:** PM, immediately after the PR that sets the REQ to `status: accepted` merges.

**When to open it:** as soon as the REQ is accepted — not before, not after sprint planning.

### Tracking issue template

```
Title: [REQ-NNN] {REQ title}

## REQ

{link to the REQ file in this repository}
e.g. https://github.com/{org}/{repo}/blob/main/docs/shared/requirements/REQ-NNN-title.md

## ADRs

{links to related-adrs entries — Architect fills this in during Plan}

## Progress

- [ ] **Plan** — Architect confirms whether ADRs are needed; all required ADRs reach `status: accepted`
- [ ] **Task** — implementation issues created and estimated (link them below)
- [ ] **Implement** — all implementation issues closed; REQ `status: implemented`
- [ ] **Deliver** — milestone deployed to production; PM sets REQ `status: delivered`

## Blocking rule

If any ADR is still `status: proposed`, apply the `adr:pending` label to this issue.
Do not start Task until the Architect removes `adr:pending`.

## Implementation issues

{links to implementation issues created during Task — add as they are created}
```

**Labels to apply on open:** `req:accepted`. Add `adr:pending` if any `related-adr` is already known to be pending.

**Milestone:** match the REQ's `milestone` field (see Milestones section below).

**Assignee:** the Architect, for the Plan phase. Reassign to Dev Team lead when Plan is complete.

---

## Phase responsibilities

### Plan — Architect

The Architect is responsible for deciding whether ADRs are needed and for writing or accepting them.

- Review the REQ's `related-adrs` field.
- For each ADR listed: if it exists and is `proposed`, move it to `accepted`. If it does not exist yet, create it using `architecture/adrs/000-template.md`.
- If no ADRs are needed for this REQ, mark Plan complete immediately and note why in the issue.
- When all required ADRs are `accepted`: uncheck `adr:pending` label (if applied), tick the Plan checkbox, and reassign the issue to the Dev Team lead.

> **The decision of whether ADRs are needed belongs to the Architect — not the PM.** The PM opens the tracking issue; the Architect decides and executes the Plan phase.

### Task — Dev Team

With Plan complete, the Dev Team decomposes the REQ into implementation issues.

- Create one GitHub issue per logical unit of work (ideally ≤ 1 day of effort).
- Use the naming convention: `[REQ-NNN] REQ-F-NNN — {functional requirement title}`
- Assign each issue to the implementing developer.
- Link all created issues in the tracking issue under **Implementation issues**.
- Estimate issues before the sprint begins.
- Tick the Task checkbox when all issues are created and estimated.

### Implement — Developer

- Pick up an implementation issue, create a branch, write code, open a PR.
- Reference the tracking issue and the REQ in the PR description (see Connecting issues to REQs and ADRs below).
- Use `Closes #NNN` in the PR to auto-close the implementation issue on merge.
- After all implementation issues are closed and the PR is merged: update the REQ to `status: implemented` (requires a logically isolated PR).
- Tick the Implement checkbox on the tracking issue.

### Deliver — PM

- When the milestone is deployed to production: update the REQ to `status: delivered` (requires a logically isolated PR).
- Tick the Deliver checkbox on the tracking issue.
- Close the tracking issue.

> **`status: delivered` trigger:** the PM sets this after the production deploy of the milestone that contains the REQ — not on merge, not on staging deploy. The milestone name in the REQ frontmatter (`mvp`, `v1`) corresponds to the GitHub Milestone (see below).

---

## Labels

Create these labels in the GitHub repository before using this workflow. Go to **Issues → Labels → New label**.

| Label | Suggested colour | Meaning | Who applies | Who removes |
|-------|-----------------|---------|-------------|-------------|
| `req:accepted` | `#0075ca` blue | REQ is accepted; lifecycle has started | PM | — (permanent) |
| `adr:pending` | `#e4e669` yellow | One or more `related-adrs` are still `proposed`; blocked at Plan | PM (on open) or Architect | Architect (when all ADRs accepted) |
| `blocked` | `#d93f0b` red    | Issue cannot progress for any other reason | Anyone | Issue owner when unblocked |

---

## Milestones

GitHub Milestones map directly to the `milestone` field in the REQ frontmatter.

| REQ `milestone` value | GitHub Milestone |
|-----------------------|-----------------|
| `mvp` | `MVP` |
| `v1` | `v1` |
| `unscheduled` | _(no milestone — leave blank)_ |

Create GitHub Milestones with these exact names before opening tracking issues. Leave the due date empty unless the team has committed to a specific release date.

Assign the milestone that matches the REQ's `milestone` field when opening the tracking issue. Implementation issues inherit the same milestone.

---

## Connecting issues to REQs and ADRs

Reference REQs and ADRs by ID in issues, commits, and PRs so reviewers can navigate directly to the source.

### In issue body or comments

```
Implements requirements/REQ-NNN-signal-curation.md
Governed by architecture/adrs/NNN-react-flow-graph.md
```

### In commit messages

```
feat(curation): implement signal evaluation form

Implements REQ-NNN REQ-F-NNN (per-signal evaluation with re-evaluation).
Governed by ADR-008.
```

### In PR description

```markdown
## Implements

- [REQ-NNN — Feature Title](../requirements/REQ-NNN-title.md)
  - REQ-F-001, REQ-F-002

## Governed by

- [ADR-NNN](../architecture/adrs/NNN-title.md)

## Closes

Closes #42 (implementation issue)
Tracking: #38 (REQ-NNN tracking issue)
```

---

## What not to do

- **Do not open a tracking issue for a REQ with `status: draft`.** The SDD gate requires `status: accepted` before the lifecycle begins in the tracker.
- **Do not skip the tracking issue.** Implementation issues without a tracking issue have no connection to the REQ or to the SDD lifecycle phase.
- **Do not mark Plan complete without the Architect's confirmation.** The decision of whether ADRs are needed belongs to the Architect.
- **Do not start Task while `adr:pending` is applied.** Architectural decisions that govern the implementation have not been settled.
- **Do not set `status: implemented` or `status: delivered` via an issue comment.** Status changes to REQs require a PR.
- **Do not use `status: delivered` after a staging deploy.** Delivered means production. See the Deliver phase above.
- **Do not create milestones with names that deviate from `MVP`, `v1`.** Ad-hoc milestone names break filtering and reporting.