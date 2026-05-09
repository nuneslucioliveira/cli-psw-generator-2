# REQ Authoring Guidelines
> **Scope**: All files in `requirements/REQ-NNN-*.md`.
> **See also**: [`000-template.md`](000-template.md) — always copy the template when creating a new REQ.
---
## Reference Standard
### Minimum vs. optional
The fields and sections defined in this guideline are the **minimum required** for a valid REQ. Additional fields and sections are **permitted when they add genuine value** — they are never PR blockers.
### Legacy documents
| Legacy element | Current equivalent |
|---|---|
| `version` field | Not used — git history serves this purpose |
| `date` field | Not used |
| `last-updated` field | Not used |
| `tags` field | Not used |
| `applicable-from` field | `milestone` |
| `impacts` / `impacted-by` fields | `requires` (unidirectional only) |
---
## 1. Frontmatter
### 1.1 Mandatory Fields *(mandatory)*
| Field | Notes |
|-------|-------|
| `id` | `REQ-NNN` — globally unique, zero-padded integer. Stable for the lifetime of the product. |
| `title` | Matches the H1 heading exactly (minus the `REQ-NNN — ` prefix). |
| `status` | One of: `draft`, `accepted`, `implemented`, `delivered`, `cancelled`, `superseded`. |
| `domain` | One of the valid domain values for this project. Single value. |
| `milestone` | Valid values defined in `README.md § Milestone` — that table is the single source of truth. |
| `priority` | One of: `must`, `should`, `could`, `wont` (MoSCoW). |
| `author` | YAML array. At minimum one human (git name). Use `"Agent: <RoleName>"` for AI agents. |
### 1.2 Optional Fields *(optional)*
| Field | When to include |
|-------|-----------------------------------------------------------------------------------------------------------------------------------|
| `related-adrs` | When ADRs govern the implementation of this requirement. |
| `requires` | When other REQs must be implemented before this one. Lists only semantic/runtime dependencies. |
| `blocked-by` | Free text. When implementation is blocked by something external. |
| `ux-spec` | When the REQ involves a user-facing interface. Values: `in-progress` \| `complete`. |
### 1.3 Author Array Rules *(mandatory)*
- The `author` field is append-only — never remove existing entries.
- If a PR is opened by a committer whose name is not already in the array, add it.
### 1.4 Common Mistakes
| Mistake | Rule |
|---------|------|
| `status: reviewed` or `status: approved` | Not valid. Use `accepted`. |
| `author` updated to reflect only the last editor | `author` is cumulative. Never remove entries. |
| `title` differs from H1 heading | They MUST match. |
| Renumbering `REQ-F-NNN` after deletion | Never renumber. Gaps are valid. |
---
## 2. Document Structure
### 2.1 Required Sections and Order *(mandatory)*
```
1.  Problem Statement (H2 — mandatory)
2.  Functional Requirements (H2 — mandatory)
3.  Non-Functional Requirements (H2 — mandatory; omit if genuinely empty)
4.  Acceptance Criteria (H2 — mandatory)
5.  Out of Scope (H2 — mandatory)
6.  Dependencies (H2 — mandatory; omit if genuinely empty)
```
### 2.1a Problem Statement — Policy Constraints *(mandatory when applicable)*
Policy constraints — rules about what the system SHALL NOT do — belong in the Problem Statement, not scattered across functional requirements.
### 2.3 H1 Heading Format
```markdown
# REQ-NNN — Title
```
Use an em-dash separator. Not colon, not hyphen.
### 2.4 Functional Requirement IDs *(mandatory)*
Sub-requirements use `REQ-F-NNN` with zero-padded three-digit numbers. Sub-sub-requirements use `REQ-F-NNN-RN`.
**Gap rule:** When a sub-requirement is removed, do NOT renumber the surviving ones. New sub-requirements always receive the next available number.
### 2.4a Separation of Concerns: FRs, NFRs, and ACs *(mandatory)*
| Element | Responsibility | What it must NOT do |
| --- | --- | --- |
| **FR** (`REQ-F-NNN`) | Describe a single, observable behaviour the system SHALL exhibit | Repeat another FR's behaviour from a different angle |
| **NFR** | Constrain the *quality* of a behaviour — adding a measurable target | Redescribe what the system does |
| **AC** | Verify exactly one FR (or NFR) under a specific condition | Combine verification of multiple independent FRs |
### 2.5 Non-Functional Requirements *(mandatory section; omit only if genuinely empty)*
When NFRs are present, each MUST name an ISO 25010 subcategory. Use the five-column table:
| ID  | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
### 2.6 Acceptance Criteria *(mandatory)*
ACs use `### AC-NNN — Descriptive title` format. Every AC MUST include a descriptive title.
```markdown
### AC-001 — Dashboard loads within 1 second for 100 reports
**Given** an authenticated user with 100 reports,
**When** they navigate to the dashboard,
**Then** the page renders within 1 second (p95).
```
**Gap rule:** Same as REQ-F — never renumber after deletion.
Every `REQ-F-NNN` MUST have at least one corresponding AC.
### 2.7 Out of Scope *(mandatory)*
Document **behavioural** descoping decisions only. Do NOT use Out of Scope to document implementation decisions (library choices, infrastructure constraints).
### 2.8 Dependencies *(mandatory section; omit only if genuinely empty)*
List runtime and implementation dependencies — other REQs and external systems. **ADRs are NOT dependencies of a REQ** — use `related-adrs` frontmatter instead.
* * *
## 3. Status Lifecycle
```
draft ──────────────────► accepted ──────────► implemented ──────────► delivered
  │                           │
  └──────► cancelled          └──────► superseded
```
- **`draft`**: Being written. MAY contain TBDs and open questions.
- **`accepted`**: Approved. **Zero TBDs or TO-DOs.** ACs MUST be complete.
- **`implemented`**: Developer-owned. PR merged, tests passing.
- **`delivered`**: PM-owned. Feature live in production.
- **`cancelled`**: Will not be implemented. Never delete.
- **`superseded`**: Replaced by another REQ. Never delete.
**The only PR blocker**: a document with `status: accepted`, `implemented`, or `delivered` that contains `TBD`, `TO-DO`, or `[to be defined]` anywhere in the body.
* * *
## 4. Writing Style
### 4.1 RFC 2119 Keywords *(mandatory)*
Always capitalise `SHALL`, `SHALL NOT`, `SHOULD`, `MAY`. Do NOT use lowercase equivalents.
### 4.2 Active Voice
```
✅  The system SHALL validate the file extension before upload.
❌  The file extension shall be validated before upload.
```
### 4.3 Prohibited Phrases
| Phrase | Replace with |
| --- | --- |
| "etc." | List all items explicitly |
| "and/or" | Choose "or" (inclusive) or "and" (conjunctive) |
| "obviously" / "clearly" / "simply" | Delete |
| "TBD" in an accepted document | Resolve before setting status to `accepted` |
| "As needed" | Specify the exact condition |
| "performant" | State the measurable target |
* * *
## 5. What Belongs in a REQ
| Belongs in REQ | Belongs in ADR |
| --- | --- |
| What the system does (user-observable outcomes) | Why a technology or pattern was chosen |
| Business constraints | Library and framework choices |
| Behavioural invariants | Schema definitions and API contracts |
| Error states visible to users | Architecture patterns |
### 5.1 No Technology Names in REQs
```
❌  The system SHALL use Redis to cache session data.
✅  The system SHALL cache session data to avoid a database round-trip on every request.
```
* * *
## 6. Index File Maintenance *(mandatory)*
To maintain repository integrity and prevent cross-reference failures during AI or human review, index files MUST be strictly maintained.
- **Single Source of Truth:** Every REQ MUST appear in exactly one index file (`index-<domain>.md`). Never duplicate an entry across domains.
- **Frontmatter Integrity:** The `domain` value in the index file's frontmatter MUST perfectly match the `domain` value inside every REQ listed within it.
- **Atomic Commits:** The index entry MUST be added or updated in the **exact same Pull Request** that creates or modifies the REQ.
- **Archive, Never Delete:** When a REQ is cancelled or superseded, do NOT delete its row. Move it from `## Active` to the `## Cancelled / Superseded` table.
The index entry format:
```markdown
| [REQ-NNN](REQ-NNN-title.md) | Title | status | priority | milestone |
```
Update the index in the same PR that creates or modifies the REQ.
* * *
## 7. Reverse-Engineered REQs *(optional)*
When a REQ is written by analyzing existing code:
1.  Add a callout at the top of the body (before `## 1.`):
    
    ```
    > **Note:** This document was reverse-engineered from the existing `<service>` codebase.
    ```
    
2.  Set `status: accepted`.
    
3.  `author` MUST include at least one human who validated the reverse-engineering.
    
* * *
## 8. PR Checklist
**Recommendations (not blockers):**
- [ ] ID is globally unique — not already used in any `index-<domain>.md`
- [ ] File is named `REQ-NNN-<kebab-case-title>.md`
- [ ] H1 heading format is `# REQ-NNN — Title` (em-dash)
- [ ] Every `REQ-F-NNN` has at least one AC
- [ ] All `SHALL` / `SHOULD` / `MAY` keywords are capitalised
- [ ] REQ appears in exactly one `index-<domain>.md`
- [ ] `author` includes at least one human name
- [ ] NFRs (when present) name an ISO 25010 subcategory and use the five-column table format
- [ ] Out of Scope contains only behavioural descoping decisions
- [ ] Dependencies section contains no ADR references (use `related-adrs` frontmatter)
- [ ] Policy constraints on the solution appear in the Problem Statement
- [ ] No two FRs describe the same behaviour from opposite angles
- [ ] No NFR redescribes a FR or repeats a policy constraint
**Blocker (hard stop — PR cannot be merged):**
- [ ] If `status: accepted`, `implemented`, or `delivered`: zero `TBD`, `TO-DO`, or `[to be defined]` in the body