# AI-Assisted Contribution Workflow

> This guide covers using OpenCode or Claude Code to help you contribute to the repository. It applies to all personas alongside the [Small Fix Workflow](./small-fix.md).

## Who is this for?

All personas — especially those less familiar with Markdown conventions, git, or the ADR/REQ authoring guidelines.

---

## Setup

> **Stuck at any step?** Ask a teammate for help and consider suggesting an improvement to this doc.

**OpenCode** and **Claude Code** are AI coding assistants that run in your terminal alongside the repository. They can read files, propose edits, run native scripts, and create PRs — always with your review before anything is committed.

To start a session, open your terminal in the repository root and run:

```bash
# OpenCode
opencode

# Claude Code
claude
```

> Both tools have access to the repository context, your local shell environment, and the `gh` CLI.

---

## Quick navigation

Jump to:
- [Pattern 1 — Describe what you want](#pattern-1--describe-what-you-want-let-the-agent-do-the-work)
- [Pattern 2 — Check your work](#pattern-2--ask-the-agent-to-check-your-work-before-you-commit)
- [Pattern 3 — Git and PR steps](#pattern-3--ask-the-agent-to-handle-the-git-and-pr-steps)
- [Pattern 4 — New content from scratch](#pattern-4--ask-the-agent-to-create-new-content-from-scratch)
- [Pattern 5 — Code and config fixes](#pattern-5--ask-the-agent-to-fix-code-or-configuration)

---

## Contribution patterns

### Pattern 1 — Describe what you want, let the agent do the work

Best for: Designers, PM/PO making requirement or copy updates.

```
"Update REQ-007 to change the minimum confidence score threshold
from 0.7 to 0.8. Only change what's necessary."
```

```
"The acceptance criteria in REQ-010 are unclear. Rewrite AC-002
to be more specific about what happens when the file exceeds the limit."
```

```
"Add a new acceptance criterion to REQ-005 covering the case where
the user's session expires mid-flow."
```

> Always review the proposed diff before accepting. The agent will show you exactly what changed.

---

### Pattern 2 — Ask the agent to check your work before you commit

Best for: Anyone who edited a file manually and wants a sanity check.

```
"Review my changes against the authoring guidelines and tell me
if anything would be flagged in a PR review."
```

```
"Check that the ADR I just edited follows the format in
architecture/adrs/guidelines.md — focus on blockers."
```

```
"I updated the status of REQ-009 to 'accepted'. Verify there are
no TBDs or TO-DOs left in the body."
```

---

### Pattern 3 — Ask the agent to handle the git and PR steps

Best for: Anyone not comfortable with git commands.

```
"Create a branch called fix/req-007-threshold, commit my changes
with message 'docs: update confidence threshold in REQ-007',
push the branch, and open a PR following the format in architecture/scm.md."
```

```
"Show me the current git status and tell me what I still need to do
before opening a PR."
```

```
"Write a PR description for my current changes. Read architecture/scm.md
to determine the required format and which Impact fields apply to
this type of change."
```

> Remember to tell the agent which target branch to use. See [`architecture/scm.md`](../architecture/scm.md) for your project's branching rules.

---

### Pattern 4 — Ask the agent to create new content from scratch

Best for: PM/PO drafting new REQs, Architects drafting new ADRs.

**New REQ:**
```
"Create a new REQ for multi-factor authentication. Use the template
at docs/shared/requirements/000-template.md. Set status to draft,
domain to platform, milestone to v1. I'll fill in the details."
```

**New ADR:**
```
"Draft an ADR for using Redis as our session cache. Use the template
at docs/shared/architecture/adrs/000-template.md. Service is backend-api.
Include at least two alternatives."
```

> The agent will produce a draft. You review, adjust, and then use Pattern 2 to validate before committing.

---

### Pattern 5 — Ask the agent to fix code or configuration

Best for: Developers making small code fixes, config updates, or test adjustments.

> **TDD/BDD first:** Before writing any implementation code, derive test cases from the REQ's ACs. Each Given/When/Then AC maps directly to a test case. Use the `tdd` skill to guide this process, then use Pattern 2 to validate AC coverage before committing.

```
"Fix the failing test in src/services/auth.test.ts — the expected
status code should be 401, not 403."
```

```
"Update the environment variable name from API_KEY to API_TOKEN
across all config files. Show me what will change before applying."
```

> Review the diff carefully. For code changes, always run the test suite before committing:
> ```
> "Run the tests and tell me if anything fails."
> ```

---

## What to always review before accepting

Regardless of what the agent produces, check:

| What | Why |
|---|---|
| **The diff** — read every line changed | Agents can make unintended edits to surrounding content |
| **IDs** (`REQ-NNN`, `ADR-NNN`, `REQ-F-NNN`, `AC-NNN`) | Never accept a renumbering or a duplicate ID |
| **Status transitions** | Only move a REQ/ADR to `accepted` when it is truly ready — zero TBDs |
| **`author` field** | Add your name if you meaningfully contributed to the content |
| **Index file** | If a new REQ or ADR was created, confirm it was added to the correct `index-<domain>.md` |

---

## What not to delegate to the agent

- **Approving a PR** — human approval is always required per [`architecture/scm.md`](../architecture/scm.md)
- **Setting `status: accepted`** — this is a product/architecture decision, not a formatting task
- **Deciding what goes out of scope** — the `Out of Scope` section requires deliberate product judgment
- **Choosing ADR deciders** — `deciders` must reflect who actually made the decision