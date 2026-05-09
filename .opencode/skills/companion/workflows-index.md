# Workflows Index
Routing map for the companion. Use this to identify the correct workflow and file to read for any contributor task. Do not read all workflow files upfront — identify the situation, find the row, read only the file listed.
---
## Routing table
| Situation | SDD Phase | Workflow | File to read |
|---|---|---|---|
| Write a new REQ from scratch | Specify | Authoring Guide | `docs/shared/workflows/authoring-guide.md` |
| Write a new ADR from scratch | Plan | Authoring Guide | `docs/shared/workflows/authoring-guide.md` |
| Generate a Figma Make prompt from a REQ | Specify | Authoring Guide §Figma | `docs/shared/workflows/authoring-guide.md` |
| Fix a typo, update wording, correct a status in a REQ or ADR | Any | Small Fix | `docs/shared/workflows/small-fix.md` |
| Review a Pull Request | Implement | Code Review | `docs/shared/workflows/code-review.md` |
| Use AI to write, update, or review any document | Any | AI-Assisted | `docs/shared/workflows/ai-assisted.md` |
| Add or remove an AI skill | Ops | Add Skill | `docs/shared/workflows/add-skill.md` |
| Open a tracking issue for an accepted REQ | Task | Issue Tracking | `docs/shared/workflows/issue-tracking.md` |
| Track progress from REQ accepted → delivered | Task / Implement | Issue Tracking | `docs/shared/workflows/issue-tracking.md` |
| Create a branch, write a commit, open a PR | Any | SCM Rules | `docs/shared/architecture/scm.md` |
| Understand the SDD lifecycle or phase gates | Any | Methodology | `docs/shared/methodology.md` |
| Load process orchestration logic | Any | Companion Skill | `.opencode/skills/companion/SKILL.md` |
| Check ISO 25010 quality attribute for an NFR | Specify | Methodology | `docs/shared/methodology.md` |
---
## Alert patterns
| Signal | What it means | What to do |
|---|---|---|
| User mentions implementing a REQ | Check the REQ status first | If `draft` → gate: Specify not complete |
| User mentions starting Task | Check all `related-adrs` | If any `proposed` → gate: Plan not complete |
| User wants to merge to `main`/`develop` directly | SCM violation | Redirect to PR process |
| User wants to set `status: accepted` | Requires human approval | Hard stop — explain the gate |
| User mentions implementing without tests | SDD Implement gate | Require AC → test derivation first |
| User mentions bundling spec/doc changes with application code | SCM violation | Separate PRs required |
| User wants to set `ux-spec: complete` | Requires Designer sign-off | Hard stop — this is the Designer's decision |
| User is rushing through the pipeline without engaging D3/D4 | Collaboration drift | Name it explicitly and invite them to slow down |