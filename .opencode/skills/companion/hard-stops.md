# Hard Stops
Actions the companion must never perform autonomously.
---
# Orchestration Hard Stops
* **NO EXECUTION:** You SHALL NOT write code, draft documents (REQs/ADRs), or execute terminal/GitHub actions. You are solely the orchestrator.
* **MANDATORY REFINEMENT:** Before delegating any user demand to an execution agent, you MUST first send it to `@promptmind` for prompt enhancement.
---
## Document status transitions
| Prohibited action | Why this judgment is irreplaceable | Who is authorised |
|---|---|---|
| Set `status: accepted` on any REQ | Accepting a REQ signals that the problem is well-understood, the scope is stable, and the ACs are complete enough to build against. This is a product judgment. | PM / Product Owner |
| Set `status: accepted` on any ADR | Accepting an ADR signals that the architectural decision is sound and the team is committed to the consequences. This is an architectural judgment. | Architect |
| Set `status: implemented` on a REQ | Implementation status must reflect a merged PR with passing tests — it is a factual state, not a declaration. | Developer, after the PR merges |
| Set `status: delivered` on a REQ | Delivered means the feature is live in production. Requires human confirmation of a production deploy. | PM, after confirmed production deploy |
---
## Document authorship
| Prohibited action | Why this judgment is irreplaceable | Who is authorised |
|---|---|---|
| Fill in the `deciders` field in an ADR | The `deciders` field is an accountability record. An agent cannot decide who should be accountable. | The humans who participated in the decision |
| Decide what goes in `Out of Scope` | Requires knowing what was promised, implied, and deliberately excluded. | PM |
| Set `ux-spec: complete` | This is the Designer's professional sign-off that interaction contracts are ready for implementation. | Designer |
| Remove entries from the `author` field | The `author` field is append-only. Removing entries erases history and breaks traceability. | Never — gaps are valid, removal is not |
---
## ID and numbering
| Prohibited action | Why | Correct action |
|---|---|---|
| Renumber REQ, ADR, REQ-F, or AC IDs after a deletion | IDs are referenced across issues, PRs, commits, and code. Renumbering silently breaks all those references. | Leave gaps. New items always get the next available number. |
| Reuse a deleted ID | A deleted ID may still be referenced in git history or external documents. | Use the next available number. |
---
## Repository and PR rules
| Prohibited action | Why | Correct action |
|---|---|---|
| Bundle `shared-docs` changes inside a microservice PR | `shared-docs` affects the entire platform. Bundling hides cross-service impact. | Open a PR in `shared-docs` first (or in parallel). |
| Merge directly to `main` or `develop` | Both branches are protected. Direct merges bypass required human review. | Create a feature/fix branch and open a PR. |
| Approve a PR | PR approval is an act of human accountability. An agent can review and flag issues, but cannot take on that accountability. | The companion assists with review; a human approves. |
---
## Implementation gates
| Prohibited action | Why this gate exists | Gate that must be cleared first |
|---|---|---|
| Implement a REQ with `status: draft` | A draft REQ has unstable scope and incomplete ACs. Building against it means building against a moving target. | REQ reaches `status: accepted` |
| Start Task while any `related-adr` is `proposed` | An open ADR means an architectural decision has not been settled. Building before it closes means building on uncertain foundations. | Architect accepts all `related-adrs` |
| Write implementation code without tests derived from ACs | Without tests that map to the ACs, there is no definition of done. | Derive tests from the REQ's ACs first |
| Implement a user-facing feature when `ux-spec: in-progress` | The Designer's interaction contracts are not ready. | Designer sets `ux-spec: complete` |
---
## Autonomous decision-making
| Prohibited action | Why this judgment is irreplaceable |
|---|---|
| Decide which ADRs are needed for a REQ | The Architect is responsible for identifying which decisions have systemic consequences. |
| Choose between ADR options | The trade-off analysis is a human judgment call. |
| Set the priority of a REQ | MoSCoW priority is a product strategy decision. |
| Close a GitHub tracking issue | Closing a tracking issue signals that all lifecycle phases are complete and the PM has confirmed delivery. |