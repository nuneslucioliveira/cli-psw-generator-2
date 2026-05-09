# Small Fix Workflow

> For larger changes (new features, new REQs, new ADRs, architectural decisions), follow the full contribution process in [`architecture/scm.md`](../architecture/scm.md).

## Who is this for?

| Persona | Typical fixes |
|---|---|
| **Designer** | Copy corrections in REQs, UX-related requirement updates |
| **PM / PO** | Requirement wording, status updates, acceptance criteria |
| **Software Architect** | ADR corrections, architecture doc updates |
| **Developer** | Any of the above as a side effect of implementation |

---

## Pre-conditions

Ensure you have the repository cloned locally and your terminal is open at the root of the project.

> **Stuck at any step?** Ask a teammate for help and consider suggesting an improvement to this doc.

### Steps

**1. Pull latest changes**
```bash
git checkout <default-branch> # (e.g., main or develop)
git pull origin <default-branch>
```

**2. Create a branch**
```bash
git checkout -b fix/your-short-description
```
> Branch name examples: `fix/req-007-typo`, `fix/adr-003-status-update`, `fix/navbar-copy`
>
> **AI tip:** not sure what name to use? Ask OpenCode or Claude Code:
> *"Suggest a branch name for fixing the acceptance criteria threshold in REQ-007"*

**3. Make your changes**

Open the file and edit. Not sure how to phrase something?

> **AI tip — use OpenCode or Claude Code:**
> *"Update the acceptance criteria in REQ-007 to reflect that the minimum confidence score was changed from 0.7 to 0.8. Make only the minimal change needed."*
> Review the diff before accepting.

**4. Commit your changes**
```bash
git add .
git commit -m "docs: fix acceptance criteria threshold in REQ-007"
```
> Follow Conventional Commits format. See [`architecture/scm.md`](../architecture/scm.md) for examples and valid types.

**5. Push your branch**
```bash
git push -u origin HEAD
```

**6. Open a PR**
```bash
gh pr create --title "fix: your short description" --body "Updates documentation"
```

> **AI tip — use OpenCode or Claude Code to write the PR description:**
> *"Write a PR description for my current changes following the format in architecture/scm.md — include Summary, Impact, and Key changes. Then open the PR."*

---

## AI-assisted example prompts

**Drafting a fix:**
> "I need to update REQ-010 to change the maximum file upload size from 10MB to 25MB. File: requirements/REQ-010-report-upload.md. Make only the minimal change needed."

**Writing the PR description:**
> "Review my staged changes and write a PR description. Read architecture/scm.md to determine the required format and which Impact fields apply to this type of change."

**Running a pre-PR review:**
> "Review the changes I made and check for formatting issues, broken cross-references, or incomplete checklist items before I open the PR."
```