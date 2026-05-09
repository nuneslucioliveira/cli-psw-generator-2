# implementer — Operating Context

> Permanent operational facts for the implementer agent.
> Read at session start (Phase 0, step 1) — never skipped.
> Updated only via maintain-system.md.

## Repository structure

This repository operates as a fully standalone workspace. All agents, skills, and documentation reside natively in the root directory.

### Branch strategy
- Project repositories: feature branches off `develop`, PR target `develop`.
- Direct commits to `main` and `develop` are prohibited.

### Protected branches
- `main` and `develop` are protected — direct commits are prohibited. All changes must be routed through feature branches and Pull Requests.

## Session memory

- `.companion-state/` must be in the microservice's `.gitignore` — session files must never be committed.
- Session files: `session-<hash>.md` with YAML frontmatter (session_id, created, intent).

## GIT state rules

- GIT locked by default.
- GIT ready only after explicit human authorisation for a specific operation.
- GIT ready expires after the authorised operation completes OR when a new task cycle begins.
- A new explicit authorisation is required for every git operation.

## Reanchoring rules

1. Reanchoring reads MUST be performed directly by the implementer in its own context — never delegated via Task. Delegated reads do not anchor context.
2. Every REANCHOR step in SKILL.md must execute as actual Read() calls. Declaring REANCHOR in text without calling Read() is a process violation.
3. Skipping a REANCHOR step is never acceptable. The content on disk governs — not what is remembered from session start.

## Delegation rules

- Every delegation prompt must pass through @promptmind before being sent to the executing agent — no exceptions.
- Agent discovery: before delegating via Task, read the agent's .md file in .claude/agents/ or .opencode/agents/ and extract the `name` field from YAML frontmatter. Use that value as subagent_type. Never assume subagent_type from filename alone.

## Direct execution permissions

### Allowed — read-only (no Task required)
```
git * (except commit, push, add, checkout -b, merge, rebase)
gh repo view / list
gh issue list / view / comments
gh pr list / view / checks / status
gh run list / view
gh workflow list / view
gh project list / view / item-list
gh browse
ls (project directories only)
cat / head (file inspection only)
find (project directories only, read-only)
wc -l
figma get_design_context (direct — not via Task)
figma get_screenshot (direct — not via Task)
```

### Denied — state-modifying (MUST delegate via promptmind + Task)
```
git commit / push / add / checkout -b / merge / rebase
gh issue create / edit / comment / close
gh pr create / merge / comment / review
gh api graphql (mutations)
rm / mv / cp / mkdir
pnpm / npm / yarn / bun (all operations including build, dev, test, install)
uv / poetry / pip / pip3 (Python package and environment management)
cargo (Rust)
go (Go build and module commands)
bundle / gem (Ruby)
composer (PHP)
node * (direct Node.js execution)
```

Any command not in either list: treat as denied.