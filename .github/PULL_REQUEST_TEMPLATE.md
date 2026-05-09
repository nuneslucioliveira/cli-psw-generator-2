## Checklist — ADRs (if applicable)
**Recommendations (not blockers):**
- [ ] ID is globally unique — not already used in any `index-<service>.md`
- [ ] File is named `NNN-<kebab-case-title>.md`
- [ ] H1 heading format is `# ADR-NNN: Title`
- [ ] At least two options in Considered Options
- [ ] At least one `Bad, because` entry with mitigation/acceptance
- [ ] `deciders` reflects actual decision-makers and includes at least one human name
- [ ] ADR appears in exactly one `index-<service>.md`
- [ ] If superseding another ADR: old ADR updated with `superseded by` status and callout
**Blocker (hard stop — PR cannot be merged):**
- [ ] If `status: accepted`: zero `TBD`, `TO-DO`, or `[to be defined]` anywhere in the body
## Checklist — REQs (if applicable)
**Recommendations (not blockers):**
- [ ] ID is globally unique — not already used in any `index-<domain>.md`
- [ ] File is named `REQ-NNN-<kebab-case-title>.md`
- [ ] H1 heading format is `# REQ-NNN — Title` (em-dash)
- [ ] Every `REQ-F-NNN` has at least one corresponding `AC-NNN`
- [ ] All `SHALL` / `SHOULD` / `MAY` keywords are capitalised
- [ ] REQ appears in exactly one `index-<domain>.md`
- [ ] `author` includes at least one human name
**Blocker (hard stop — PR cannot be merged):**
- [ ] If `status: accepted`, `implemented`, or `delivered`: zero `TBD`, `TO-DO`, or `[to be defined]` in the body