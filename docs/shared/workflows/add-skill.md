# Add a Skill Workflow

> Skills extend what OpenCode and Claude Code can do. They provide specialized knowledge, workflows, and tools — loaded on demand when relevant. All skills for this project live natively in the repository and are shared across all agents.

## Who is this for?

Anyone on the project — Developer, Designer, PM/PO, Architect. You don't need to be technical to suggest or install a skill. The AI assistant does most of the work.

## Key constraints (read before starting)

- Skills must be installed for **both** `opencode` and `claude-code` agents — never for `*` (all agents).
- Installation is always **project-level** — never global (omit `-g` / `--global`).
- Before installing, the AI **must** validate the source repository — not just the install count.

---

## Step 1 — Start your AI session

Open your terminal in the repository root and start OpenCode or Claude Code:

```bash
# OpenCode
opencode

# Claude Code
claude
```

## Step 2 — Create a branch

Ask the AI to create a branch for the new skill, or run it manually:

```bash
git checkout -b chore/add-<skill-name>-skill
```

## Step 3 — Discover and validate a skill

> **Security note:** Install count alone is not a reliable signal. The AI must inspect the source repository before recommending anything.

Ask the AI to search **and** validate before recommending:

> "Use the find-skills skill to search for a skill about [topic]. Inspect its GitHub repository (author, stars, SKILL.md content). Only recommend options you are confident are trustworthy. Show your reasoning."

## Step 4 — Install the skill

Once the AI has validated the source, ask it to install:

> "Install [skill-name] from [owner/repo] for both opencode and claude-code agents. Do not install globally. We are in the root directory."

The AI will run:
```bash
npx skills add <owner/repo@skill-name> --agent opencode --agent claude-code -y
```

## Step 5 — Verify installation

You can ask the AI to quickly verify:

> "Confirm that [skill-name] was installed correctly in both .opencode/skills and .claude/skills, and that the symlinks resolve correctly."

## Step 6 — Commit, push and open PR

Ask the AI to finalize the process:

> "Stage the new skill files and the updated skills-lock.json. Commit with message 'chore: add <skill-name> skill', push the branch, then open a PR targeting the main branch."

Or do it manually:
```bash
git add .opencode/skills/ .claude/skills/ skills-lock.json
git commit -m "chore: add <skill-name> skill"
git push -u origin HEAD
gh pr create --title "chore: add <skill-name> skill" --body "Adds new AI skill"
```

---

## Removing a skill

**Via AI (primary):**
> "Remove the skill [skill-name] from this project. Delete it from both .opencode/skills and .claude/skills, update skills-lock.json, then commit and open a PR."

**Manual fallback:**
```bash
npx skills remove <skill-name> -y

# Verify removal
ls .opencode/skills/<skill-name>   # should be gone
ls .claude/skills/<skill-name>   # should be gone

# Commit
git add .opencode/skills/ .claude/skills/ skills-lock.json
git commit -m "chore: remove <skill-name> skill"
git push -u origin HEAD
gh pr create --title "chore: remove <skill-name> skill" --body "Removes skill"
```

---

## Common issues

| Symptom | Cause | Fix |
|---|---|---|
| Skill visible in OpenCode but not Claude Code | `.claude/skills` symlink missing | Ask AI: *"Add the missing symlink for [skill] in .claude/skills pointing to ../../.opencode/skills/[skill]"* |
| `npx skills` not found | `node`/`npm` not in PATH | Ensure Node is installed and available in your terminal session |
| `.opencode` and `.claude/skills` counts differ | Skills installed without `--agent claude-code` | Ask AI: *"Check which skills are missing from .claude/skills and install them for claude-code"* |