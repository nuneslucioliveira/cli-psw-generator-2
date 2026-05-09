# Code Review Instructions

This repository contains only documentation (ADRs and REQs). No application code.
Apply the checks below to every pull request.

---

## PR Blockers — Hard Stops

Flag as a blocker (must be fixed before merging):

- Any document with `status: accepted`, `implemented`, or `delivered` that contains
  `TBD`, `TO-DO`, or `[to be defined]` anywhere in the body.
- Any new or modified ADR/REQ that is **not listed** in its corresponding index file
  in the same PR.
- Any ADR missing a mandatory frontmatter field: `id`, `title`, `status`, `service`,
  `date`, `deciders`.
- Any REQ missing a mandatory frontmatter field: `id`, `title`, `status`, `domain`,
  `milestone`, `priority`, `author`. Valid `domain` values: cli-arguments, password-logic, security-validation.
- Any REQ `milestone` field containing a value other than mvp, v2.

---

## Commit and PR Format

- Commit messages must follow Conventional Commits: `docs:`, `feat:`, `fix:`, `chore:`, etc.
- PR description must include a **Summary** section and a **Key changes** section.
- PR must target `main`. Flag if the target branch is anything other than `main`.

---

## Index File Maintenance

- Every ADR must appear in exactly one `docs/shared/architecture/adrs/index-<service>.md`.
- Every REQ must appear in exactly one `docs/shared/requirements/index-<domain>.md`.
- The index entry must be added or updated in the same PR as the document change.

---

## Cross-Reference Integrity

- `related-adrs` entries in a REQ should reference IDs that exist in the ADR corpus.
- `requires` entries in a REQ should reference IDs that exist in the REQ corpus.
- `related-reqs` entries in an ADR should reference IDs that exist in the REQ corpus.
- Flag any reference to an ID that does not appear in any index file.

## Relative path conventions in this repository

All paths are relative to the root of this standalone repository.

### Links in `docs/shared/architecture/adrs/**` and `docs/shared/workflows/**`

Links from files inside `docs/shared/architecture/adrs/` use `../../` to reach the `docs/shared/` root, or `../../../../` to reach the repository root. For example, from `docs/shared/architecture/adrs/001-example.md`:

- `../../requirements/REQ-001-google-login.md` — correct (relative path to requirements)
- `../../../../methodology.md` — correct (relative path to the methodology file at the repository root)

Do NOT flag `../../requirements/` or `../../architecture/` paths in ADR files as broken.

### Skill references

Skills in `.opencode/skills/` (and `.agents/skills/` aliases) are referenced by name only — never as navigable Markdown links. References like `` `tdd` `` in prose or `<tdd>` in code blocks are intentional named references, not broken links.

Do NOT flag missing `.agents/skills/` link targets as broken.