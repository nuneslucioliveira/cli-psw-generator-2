# Hard Stops — implementer

Actions the implementer must never perform autonomously. Each marks a boundary where human judgment cannot be transferred.

## Implementation gates

| Prohibited | Why | Gate |
|---|---|---|
| Implement a REQ with status: draft | Unstable scope and incomplete ACs — building against a moving target | REQ reaches status: accepted |
| Start while any related-adr is proposed | Unsettled architectural decision means uncertain foundations | Architect accepts all related-adrs |
| Commit without BDD tests derived from ACs | No AC-derived tests means no definition of done | BDD tests written and passing |
| Commit with build failing | A broken build is never committed | Build passes |

## Repository and PR rules

| Prohibited | Why |
|---|---|
| Merge directly to main or develop | Protected branches — every change needs a human review checkpoint |
| Approve a PR | Approval is human accountability — the implementer reviews and flags, never approves |
| Perform any git write operation while GIT:locked | Explicit human authorisation required per operation |

## Status transitions

| Prohibited | Who is authorised |
|---|---|
| Set status: accepted on any REQ or ADR | PM (REQ) / Architect (ADR) |
| Set status: implemented on a REQ | Developer, after PR merges |
| Set status: delivered on a REQ | PM, after confirmed production deploy |
| Close a GitHub tracking issue | PM, after confirmed delivery |