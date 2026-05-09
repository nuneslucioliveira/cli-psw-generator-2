---
applyTo: "docs/shared/architecture/adrs/[0-9]*.md"
---

- Quality Attribute Driver in Context is optional — do not flag its absence.
- RM-ODP viewpoint layer in Context is optional — do not flag its absence.
- `Tradeoff, because` and `Sensitivity, because` consequences are optional — do not flag their absence.
- `## Implementation Notes` is required ONLY when the decision imposes a code pattern or has a known naive-implementation failure mode — do not flag its absence otherwise.

**Frontmatter — valid values:**

- `status`: `proposed` | `accepted` | `deprecated` | `superseded by ADR-NNN`
- `service`: `frontend-app` | `backend-api` | `agentic-backend` | `platform`
- Flag `status: reviewed` or `status: approved` — these are not valid values.

**Structure checks:**

- H1 format must be `# ADR-NNN: Title` (colon separator, not em-dash).
- `Considered Options` must list at least two options.
- Every `Bad, because` consequence must include an explicit mitigation or acceptance statement (e.g., `— mitigated: …` or `— acceptable: …`).
- `deciders` must not be the template default — it must reflect actual decision-makers.
- If an ADR supersedes another, the old ADR must be updated with `superseded by` status.
- IDs must not be renumbered. Gaps after deletions are valid and expected.