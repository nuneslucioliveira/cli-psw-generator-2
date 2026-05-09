# Code Review Workflow

> This guide covers reviewing a Pull Request in any repository. For full SCM rules (branching, commit format, merge strategy), see [`architecture/scm.md`](../architecture/scm.md).

## Who is this for?

| Persona | Focus during review |
|---|---|
| **Designer** | Copy clarity, UX language, acceptance criteria readability |
| **PM / PO** | Product alignment, requirement completeness, status transitions |
| **Software Architect** | Architectural consistency, decision traceability, cross-service impact |
| **Developer** | Code quality, cross-references, structural correctness, test coverage |

---

## Quick navigation

Jump to:
- [Step-by-step](#step-by-step)
- [What each persona looks for](#what-each-persona-looks-for)
- [AI-assisted example prompts](#ai-assisted-example-prompts)

---

## Step-by-step

> **Stuck at any step?** Ask a teammate for help and consider suggesting an improvement to this doc.

**1. Open the PR**

Use OpenCode or Claude Code:
```
"List open PRs assigned to me or waiting for my review."
```

Or go directly to the repository's Pull Requests tab on GitHub. See [`architecture/scm.md`](../architecture/scm.md) under **Repositories** for the full list of repo URLs.

**2. Read the PR description**

Every PR description should provide enough context for the reviewer to understand what changed, why, and what the impact is. The exact required fields depend on the repository and whether a PR template exists — see [`architecture/scm.md`](../architecture/scm.md) for the authoritative rules.

At a minimum, look for: **what changed**, **why it was needed**, and **what the key impacts are**. For microservice repos, a **Related REQ** is also expected. For documentation repos, a link to the originating issue or discussion is preferred.

> If the PR description lacks sufficient context for you to review, request changes before reviewing the content.

**3. Review the files changed**

Use the GitHub diff view or ask your AI assistant:
```
"Summarise the changes in this PR and flag anything that looks
incomplete, inconsistent, or missing."
```

**4. Go through the PR template checklist**

If the repository has a `.github/PULL_REQUEST_TEMPLATE.md`, the PR description should have been written using it. Check that **every item is filled in**:

- Items marked as **blockers** must be resolved before the PR can be merged.
- Items marked as **recommendations** should be flagged as comments — the author decides whether to act on them.

If no template exists, verify that the PR description covers the minimum defined in [`architecture/scm.md`](../architecture/scm.md).

> Not all repositories have the same PR template. For example, `shared-docs` includes specific checklists for ADRs and REQs — full authoring rules are in [`requirements/guidelines.md`](../requirements/guidelines.md) and [`architecture/adrs/guidelines.md`](../architecture/adrs/guidelines.md). Other repositories may focus on code quality, test coverage, or deployment safety. Review what applies to the PR at hand.

> **AI tip — use OpenCode or Claude Code:**
> ```
> "Check whether the PR description covers all items in
>  .github/PULL_REQUEST_TEMPLATE.md. List what's missing or incomplete."
> ```

**5. Leave your feedback**

- **Blocker found** — Request changes. Quote the specific line and explain what needs to be fixed.
- **Recommendation found** — Leave a comment. The author decides whether to act on it.
- **All good** — Approve.

> **AI tip — use OpenCode or Claude Code:**
> ```
> "Review this PR diff and list any issues grouped by severity
>  (blockers vs. recommendations)."
> ```

**6. Follow up**

If you requested changes, re-review when the author updates the PR. Once all blockers are resolved, approve.

> Per [`architecture/scm.md`](../architecture/scm.md): every PR requires at least **two reviewers** — one human and one agent.

---

## What each persona looks for

### Designer
- Is the language clear and user-facing?
- Are UX constraints described in terms of observable behavior, not implementation details?
- Does the copy match what we actually want to ship?

### PM / PO
- Does the change align with the product direction?
- Are status fields correct and transitions intentional?
- Are scope exclusions explicit and deliberate?
- Does the PR description make sense from a product perspective?

### Software Architect
- Is the change consistent with existing architectural decisions?
- Does it introduce new patterns, dependencies, or cross-service contracts that need an ADR?
- Are implementation notes adequate for developers to follow correctly?

### Developer
- Does the code follow established patterns and coding standards?
- Are tests present and do they map to the REQ's ACs? Per SDD, every AC SHALL have a corresponding test — a PR without AC-driven tests is a blocker. See [methodology.md](../methodology.md).
- If TDD/BDD was not followed, use the `tdd` skill to retroactively derive tests from the ACs before approving.
- Are cross-references between documents or modules pointing to existing, valid targets?
- Is there anything that could break other services or consumers?

---

## AI-assisted example prompts

**Automated checklist review:**
```
"Review this PR against the checklist in .github/PULL_REQUEST_TEMPLATE.md
and tell me which items pass and which need attention."
```

**Checking cross-references:**
```
"Verify that all IDs referenced in this PR exist in the corresponding
index files or source code."
```

**Checking AC test coverage:**
```
"For each AC-NNN in the linked REQ, verify that there is a corresponding
test in this PR. List any ACs without test coverage as blockers."
```

**Drafting review comments:**
```
"I found an issue with the acceptance criteria — the threshold is ambiguous.
Draft a constructive review comment suggesting a specific fix."
```