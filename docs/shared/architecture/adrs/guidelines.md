# ADR Authoring Guidelines
> **Scope**: All files in `architecture/adrs/NNN-*.md`.
> **See also**: [`000-template.md`](000-template.md) — always copy the template when creating a new ADR.
> For vocabulary definitions, framework rationale, and evaluation criteria, see [`methodology.md`](../../../methodology.md).
---
## Reference Standard
This guideline implements the vocabulary and principles defined in [`methodology.md`](../../../methodology.md).
### Minimum vs. optional
The fields and sections defined in this guideline are the **minimum required** for a valid ADR. Additional fields and sections are permitted when they add genuine value — they are **never PR blockers**.
If a field or section recurs frequently across new documents, propose it as a guideline addition via PR.
---
## 1. Frontmatter
### 1.1 Mandatory Fields *(mandatory)*
| Field | Notes |
|-------|-------|
| id | ADR-NNN — globally unique, zero-padded integer. Never reuse. |
| title | Matches the H1 heading exactly (minus the ADR-NNN: prefix). |
| status | One of: proposed, accepted, deprecated, superseded by ADR-NNN. See §3 for lifecycle. |
| service | One of the valid service values defined in architecture/overview.md § Services. Single value. |
| milestone | Valid values defined in README.md § Milestone. |
| date | ISO 8601 (YYYY-MM-DD). Creation date — never change after creation. |
| deciders | YAML array. At minimum one human (git name). Use "Agent: <RoleName>" for AI-authored decisions. |
### 1.2 Optional Fields *(optional)*
> Optional — omit if not applicable.
| Field | When to include |
|-------|----------------------------------------------------------------------------------------------------------|
| `related-reqs` | When one or more REQs motivate this decision. Entries SHOULD NOT have a `#` inline comment. When this ADR is added to `related-reqs`, each originating REQ MUST be updated to include this ADR in its `related-adrs` frontmatter field. |
| `impacts` | When this ADR's change could force a review of other ADRs. Entries SHOULD NOT have a `#` inline comment. |
### 1.3 Common Mistakes
| Mistake | Rule |
|---------|------|
| `status: reviewed` or `status: approved` | Not valid. Review happens via PR. Use `accepted`. |
| `service: platform` for a single-service decision | Use the specific service. `platform` is for genuinely cross-service decisions. |
| Deciders not updated from template default | MUST reflect actual decision-makers. |
| `title` differs from H1 heading | They MUST match. |
---
## 2. Document Structure
### 2.1 Required Sections and Order *(mandatory)*
```
1.  Context and Problem Statement (H2 — mandatory)
2.  Considered Options (H2 — mandatory, minimum 2 options)
3.  Decision Outcome (H2 — mandatory)  
    3a. Consequences (H3 — mandatory)  
    3b. Implementation Notes (H3 — conditional, see §2.5)
4.  Sources (H2 — mandatory)
```
### 2.2 H1 Heading Format *(mandatory)*
```markdown
# ADR-NNN: Title
```
Use a colon separator. Not em-dash, not hyphen.
### 2.3 Considered Options *(mandatory)*
List at least **two** options. Format:
```markdown
1. **Option Name** — one-sentence description.
2. **Option Name** — one-sentence description.
```
The chosen option MUST appear in the list.
### 2.4 Consequences Format *(mandatory)*
Each consequence MUST begin with one of these exact prefixes:
```
Good, because [positive outcome]
Bad, because [trade-off or cost] — mitigated/acceptable: [statement]
Neutral, because [neither good nor bad, but worth noting]
```
Every `Bad, because` MUST include an explicit mitigation or acceptance statement.
**Optional ATAM extensions** *(optional — reviewers MUST NOT flag their absence)*
```
Tradeoff, because [attribute A] ↑ at the cost of [attribute B] ↓
Sensitivity, because [small change would have disproportionate impact on quality attribute]
```
### 2.5 Implementation Notes *(conditional)*
Implementation Notes SHALL be present when any of the following apply:
- The chosen technology has version-specific usage requirements.
- The decision imposes a specific code pattern on implementers.
- There is a known failure mode if implemented naively.
When none of these apply, the section MAY be omitted.
### 2.6 Sources Format *(mandatory)*
```markdown
- [Link Text](url) — one-sentence description of what was confirmed.
```
**Exception — reverse-engineered ADRs**: When an ADR is written by analysing existing code, the first Sources entry MAY use:
```markdown
- This decision was reverse-engineered from the existing `<service>` codebase which <specific artefact observed>.
```
* * *
## 3. Status Lifecycle
```
proposed ──────────────────► accepted
    │                            │
    └──────► deprecated          └──────► superseded by ADR-NNN
```
- **`proposed`**: Open for review. MAY be merged as `proposed`.
- **`accepted`**: Decision approved and stable. **Zero TBDs or TO-DOs.** Immutability preferred.
- **`deprecated`**: Decision no longer relevant. Add `> Deprecated: [reason].` at top. Never delete.
- **`superseded by ADR-NNN`**: Replaced by a newer ADR. Add `> Superseded by [ADR-NNN](file.md).` at top. Never delete.
**The only PR blocker**: a document with `status: accepted` that contains `TBD`, `TO-DO`, or `[to be defined]` anywhere in the body.
* * *
## 4. Writing Style
### 4.1 Decision Statement *(mandatory)*
```
Chosen option: **"<Option Name>"**, because <one-sentence justification>.
```
### 4.2 Active Voice
```
✅  Prisma adapter eliminates manual session table management.
❌  Manual session table management is eliminated by the Prisma adapter.
```
### 4.3 Prohibited Phrases
| Phrase | Replace with |
| --- | --- |
| "obviously" / "clearly" | Delete. |
| "best practice" (without citation) | Cite the specific source. |
| "etc." | List all items explicitly. |
| "TBD" in an accepted ADR | Resolve before setting status to `accepted`. |
| "simple" / "easy" | Describe what the approach actually requires. |
| "we decided" | Use the Chosen option format. |
* * *
## 5. Service Scoping *(mandatory)*
Each ADR MUST be assigned to exactly one `service`. When a decision genuinely spans multiple services, use `platform`.
* * *
## 6. Index File Maintenance *(mandatory)*
To maintain repository integrity and prevent cross-reference failures during AI or human review, index files MUST be strictly maintained.
- **Single Source of Truth:** Every ADR MUST appear in exactly one index file (`index-<service>.md` or `index-platform.md`). Never duplicate an entry.
- **Frontmatter Integrity:** The `service` value in the index file's frontmatter MUST perfectly match the `service` value inside every ADR listed within it.
- **Atomic Commits:** The index entry MUST be added or updated in the **exact same Pull Request** that creates or modifies the ADR.
- **Archive, Never Delete:** When an ADR is deprecated or superseded, do NOT delete its row. Move it from `## Active` to the `## Superseded / Deprecated` table.
The index entry format:
```markdown
| [ADR-NNN](NNN-title.md) | Title | status |
```
Update the index in the same PR that creates or modifies the ADR.
* * *
## 7. Reverse-Engineered ADRs *(optional)*
When an ADR documents a decision discovered by analysing existing code:
1.  Add a callout at the top of the body (before `## Context`):
    
    ```
    > **Note:** This ADR was reverse-engineered from the existing `<service>` codebase. It formalises a decision already present in the implementation.
    ```
    
2.  Set `status: accepted` (the decision already exists in the codebase).
    
3.  `deciders` MUST include at least one human who validated the reverse-engineering.
    
* * *
## 8. When to Write an ADR
### Write an ADR when:
- A new external runtime dependency is introduced.
- A structural pattern is chosen (how layers communicate, how state flows).
- A technology is explicitly rejected after evaluation.
- A constraint is imposed on multiple features.
### Do NOT write an ADR for:
- Library version upgrades (unless breaking architectural changes).
- Configuration choices (timeouts, env var names).
- Conventions that belong in `AGENTS.md`.
* * *
## 9. PR Checklist
**Recommendations (not blockers):**
- [ ] ID is globally unique — not already used in any `index-<service>.md`
- [ ] File is named `NNN-<kebab-case-title>.md`
- [ ] H1 heading format is `# ADR-NNN: Title`
- [ ] At least two options in Considered Options
- [ ] At least one `Bad, because` entry with mitigation/acceptance
- [ ] `deciders` reflects actual decision-makers (not template default)
- [ ] ADR appears in exactly one `index-<service>.md`
- [ ] If superseding another ADR: old ADR updated with `superseded by` status and callout
- [ ] If motivated by a REQ that already references this ADR in its body: that REQ's `related-adrs` frontmatter field updated to include this ADR
- [ ] If motivated by a quality concern: Quality Attribute Driver named in Context (ISO 25010 subcategory)
- [ ] If affecting a specific architectural layer: layer named in Context in plain prose
**Blocker (hard stop — PR cannot be merged):**
- [ ] If `status: accepted`: zero `TBD`, `TO-DO`, or `[to be defined]` anywhere in the body