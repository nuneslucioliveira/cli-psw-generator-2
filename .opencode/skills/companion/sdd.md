# SDD — Spec Driven Development Operational Reference
> For companion use only. Load when the task involves SDD phases, gates, or status transitions.
## Lifecycle
```
Specify → Plan → Task → Implement
```
---
## 1. Specify
**Gate of entry:** none — this is the first phase.
**Responsible:** PM / Product Owner
**Steps:**
1.1. Identify the stakeholder, the problem, and the cost of inaction.
1.2. Write the REQ file using `requirements/000-template.md`.
1.3. Define functional requirements (REQ-F-NNN) with RFC 2119 keywords.
1.4. Write Acceptance Criteria (AC-NNN) for every REQ-F-NNN.
1.5. Define NFRs using ISO 25010 subcategories (if applicable).
1.6. Document Out of Scope (behavioural descoping only).
1.7. Add the REQ to the correct `requirements/index-<domain>.md`.
1.8. Set `status: draft` initially.
**Gate of exit:** REQ SHALL reach `status: accepted` — set by the PM/PO, never autonomously.
---
## 2. Plan
**Gate of entry:** the motivating REQ SHALL be `accepted`. No exceptions.
**Responsible:** Architect
**Steps:**
2.1. Read the accepted REQ and its `related-adrs` field.
2.2. Identify which architectural decisions are needed to implement the REQ.
2.3. For each decision: write an ADR using `architecture/adrs/000-template.md`.
2.4. Set ADR `status: proposed` initially.
2.5. Evaluate options, document trade-offs, choose the option.
2.6. Add each ADR to the correct `architecture/adrs/index-<service>.md`.
2.7. Add each ADR to the REQ's `related-adrs` frontmatter field.
**Gate of exit:** All `related-adrs` SHALL reach `status: accepted` — set by the Architect, never autonomously.
---
## 3. Task
**Gate of entry:** all `related-adrs` for the REQ SHALL be `accepted` (or Architect confirmed none are needed).
**Responsible:** Dev Team
**Steps:**
3.1. Decompose the REQ into GitHub Issues.
3.2. Estimate each issue.
3.3. Link issues to the REQ tracking issue.
3.4. Label the tracking issue: `req:accepted`, remove `adr:pending` if present.
**Gate of exit:** Issues SHALL be created, estimated, and linked before implementation begins.
---
## 4. Implement
**Gate of entry:** issues exist and are linked to the REQ tracking issue.
**Responsible:** Developer (code) / PM (delivery confirmation)
**Steps:**
4.1. Derive test cases from the REQ's Acceptance Criteria (AC → test mapping is mandatory).
4.2. Write tests first (TDD/BDD) — no implementation code without tests mapped to ACs.
4.3. Write implementation code.
4.4. Open a PR. PR SHALL NOT be merged without passing tests covering every AC.
4.5. On PR merge: set REQ `status: implemented` — Developer, after the PR merges.
4.6. On production deploy: set REQ `status: delivered` — PM, after confirmed production deploy.
**Gate of exit:** `status: delivered` — set by PM after confirmed production deploy.
---
## Status quick-reference
| Status | Who sets it | When |
|--------|------------|------|
| REQ `draft` | PM/Author | Being written — do not implement |
| REQ `accepted` | PM/PO | Approved — gate of entry for Plan |
| REQ `implemented` | Developer | PR merged, tests passing |
| REQ `delivered` | PM | Live in production |
| ADR `proposed` | Architect | Under review — do not implement against it |
| ADR `accepted` | Architect | Stable — gate of exit for Plan |
---
## Hard rules
- A REQ with `status: draft` SHALL NOT be implemented. This includes ADR authoring.
- A REQ with `status: draft` SHALL NOT advance to Plan.
- An ADR with `status: proposed` SHALL NOT be used as implementation guidance.
- `status: accepted` on a REQ or ADR SHALL NOT be set autonomously.
- Tests derived from ACs SHALL exist before any implementation code is written.
- `ux-spec: in-progress` blocks UI implementation. Wait for `ux-spec: complete`.