# companion — Operating Context

> Permanent operational facts. Read at the start of every session — never skipped, never overridden.
> Updated only via maintain-system.md. Never deleted automatically.

## Repository structure

This repository operates as a fully standalone, consolidated workspace. All agents, skills, configuration files (`.opencode/`, `.claude/`), and documentation (`docs/shared/`) reside natively within the root directory. 

There are NO submodules and NO symlinked external toolchains. Any modifications to skills or workflows are committed directly to this repository.

### Project services (branch off `develop`, PR target `develop`)
| Service | Description |
|---|---|
| cli-interface | Command-line interface handling user input and output |
| core-generator | Core password generation engine with security validation |

### Protected branches
- `main` and `develop` are protected branches — direct commits are prohibited. All changes must be routed through feature branches and Pull Requests.

## Session memory

- `.companion-state/` MUST be in the microservice's `.gitignore` — session files must never be committed.
- Session files follow the naming convention `session-<hash>.md` with a YAML frontmatter header (session_id, created, intent).
- You MUST use `ls -la` command to list .companion-state/ files.

## GIT state rules

- `GIT:ready` expires in two cases:
  1. After the authorised git operation completes (commit, push, PR creation, merge).
  2. When a new task cycle begins at the end of D4.
- A new explicit human authorisation is required for every git operation — previous authorisations do not carry over.

## Context Engineering conventions

- Sequential instructions must always use numbered lists — never bullet points. Numbered lists carry CoT weight; bullets do not.
- Bullet points are acceptable only for content of messages (what to communicate to the human) — not for behavioural instructions.
- Reanchoring is a mandatory, normative act governed by these rules:
  1. Reanchoring reads MUST always be performed directly by the Companion in its own context — never delegated via Task. Delegated reads do not anchor context.
  2. Every workflow that defines a REANCHORING step MUST execute it as actual Read() calls before proceeding. Declaring "REANCHORING" in text without calling Read() is a process violation, not a reanchoring.
  3. Skipping a REANCHORING step is never acceptable regardless of time pressure, throughput, or the apparent simplicity of the next action. The rules of the workflow on disk govern the current action — not the rules as remembered from the session start.

## Delegation rules

- Every delegation prompt must pass through `@promptmind` before being sent to the executing agent — no exceptions. Delegating with a raw prompt produces lower-quality output silently.

- **Agent discovery at runtime:** Before delegating via Task to a named agent, verify the correct `subagent_type` by reading the agent's `.md` file in `.claude/agents/` or `.opencode/agents/` and extracting the `name` field from its YAML frontmatter. Use that value as the `subagent_type`. Never assume the subagent_type from the filename alone — filename conventions (kebab-case) differ from the name field (Title Case with spaces). Example: file `ux-architect.md` has `name: UX Architect` → use `subagent_type: UX Architect`.

## Direct execution permissions

The Companion MAY execute the following commands directly (without delegating via Task) for read-only queries used in decision-making:

### Allowed — read-only queries (no Task required)

```
git * (except git commit and git push)
gh repo view
gh repo list
gh issue list
gh issue view
gh issue comments
gh pr list
gh pr view
gh pr checks
gh pr status
gh run list
gh run view
gh workflow list
gh workflow view
gh project list
gh project view
gh project item-list
gh browse
ls (project directories only)
cat / head (file inspection only)
find (project directories only, read-only)
wc -l (line counting for reanchoring verification)
```

### Denied — state-modifying commands (MUST delegate via rewriter + Task)

```
git commit *
git push *
git add *
git checkout -b *
git merge *
git rebase *
gh issue create
gh issue edit
gh issue comment
gh issue close
gh pr create
gh pr merge
gh pr comment
gh pr review
gh api graphql (mutations)
rm / mv / cp (file operations)
mkdir
npm / pnpm / yarn (package operations — includes pnpm build, pnpm dev, pnpm test)
node * (direct Node.js execution)
```

Any command not in either list: treat as denied and delegate via Task.

## Document authoring invariants

Violations of these rules produce silently incorrect documents that pass superficial review but fail on closer inspection.

### REQs
- Obligation keywords (`SHALL`, `SHALL NOT`, `SHOULD`, `MAY`) must always be capitalised. Lowercase equivalents are ambiguous and must not appear in functional requirements.
- Every `REQ-F-NNN` must have at least one `AC-NNN` acceptance criterion that tests it. A functional requirement with no AC has no definition of done. SHALLs in Problem Statement, NFRs, and Out of Scope do not require ACs.
- NFRs must name an ISO 25010 subcategory explicitly — never an adjective ("fast", "secure"). The full taxonomy is in `docs/shared/methodology.md`.
- REQ and REQ-F IDs are never renumbered after deletion. Gaps are valid. Renumbering breaks traceability silently.
- Documents with `status: accepted`, `implemented`, or `delivered` must contain zero `TBD`, `TO-DO`, or `[to be defined]` anywhere in the body. These are hard blockers — not style suggestions.
- `status: accepted` (and `implemented`, `delivered`) is set only by the human — never autonomously.
- The `author` field is append-only — never remove existing entries. Contributors are cumulative, not replaced.
- `cancelled` and `superseded` REQs are never deleted. Add a note at the top. The gap in the ID sequence is correct.
- Changes to `docs/shared/` must be in a separate PR from application code to maintain atomic, logically isolated git history.

### ADRs
- Considered Options must list at least two options — including rejected ones. An ADR with one option is an announcement, not a decision record.
- Every ADR must have at least one `**BAD:**` consequence entry with an explicit `*Mitigated:*` or `*Acceptable:*` sub-bullet. Costs without mitigations are incomplete.
- ADR IDs are never renumbered. Gaps are valid.
- Documents with `status: accepted` must contain zero `TBD`, `TO-DO`, or `[to be defined]`. Hard blocker.
- The `deciders` field must list the humans who made the decision — never set autonomously, never remove existing entries.
- `status: accepted` is set only by the Architect — never autonomously.
- `deprecated` and `superseded` ADRs are never deleted. Add the appropriate callout at the top.
