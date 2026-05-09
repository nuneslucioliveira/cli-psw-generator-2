---
applyTo: "docs/shared/requirements/REQ-*.md"
---

- Dependencies must not list ADR IDs — use `related-adrs` frontmatter instead.
- Out of Scope must contain only behavioural descoping — no library, technology, or deployment choices.
- Policy constraints (what the system SHALL NOT do) belong in Problem Statement, not scattered across functional requirements.
- NFRs when present must use five-column table: `ID | Quality Attribute (ISO 25010) | Metric | Target | Condition`.

**Frontmatter — valid values:**

- `status`: `draft` | `accepted` | `implemented` | `delivered` | `cancelled` | `superseded`
- `domain`: cli-arguments, password-logic, security-validation
- `milestone`: mvp, v2
- `priority`: `must` | `should` | `could` | `wont`
- Flag `status: reviewed` or `status: approved` — these are not valid values.

**Structure checks:**

- H1 format must be `# REQ-NNN — Title` (em-dash separator, not colon).
- Every `REQ-F-NNN` has at least one AC — if two FRs share an AC, consider consolidating them.
- `author` field is append-only — flag if existing author entries were removed.
- `SHALL`, `SHOULD`, and `MAY` keywords must be capitalized. Flag lowercase usage.
- REQs must not name specific technologies (`SHALL use Redis`, `SHALL use Prisma`). Requirements describe observable behavior; technology choices belong in ADRs.
- IDs (`REQ-F-NNN`, `AC-NNN`) must not be renumbered. Gaps are valid and expected.
- NFRs (when present) must name an ISO 25010 subcategory. The absence of an NFR section is NOT a flag — it is optional.
- Additional sections (Success Metrics, Risks, Proposed Solution) are optional. Do NOT flag their absence.
- Required sections must appear in the order defined in the guidelines (Problem Statement → Functional Requirements → Non-Functional Requirements → Acceptance Criteria → Out of Scope → Dependencies). Do NOT flag section numbering — flag out-of-order presentation only.
- Flag if two FRs describe the same behaviour from opposite angles — merge into one FR or sub-requirements (`REQ-F-NNN-RN`).
- Flag if an NFR restates what the system does or repeats a policy constraint from the Problem Statement. An NFR must add a measurable quality target.
- Do NOT flag two ACs that verify the same data at different system boundaries — these test distinct observable states.