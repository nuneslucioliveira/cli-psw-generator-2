# V2 Development Checklist

**Status**: V2.0 Foundation Gate Passed — Ready for REQ-004 (Batch Generation)

---

## 📋 V2.0 — Foundation Phase

### ✅ Phase 0 — Planning (Complete)
- [x] V2 Execution Plan authored (`docs/v2-execution-plan.md`)
- [x] V2 Checklist created (this file)
- [x] Team alignment on V2 scope

### ✅ REQ-003: Special Characters Set (Complete)
**Phase Status:** ✅ All REQ-003 acceptance criteria satisfied. Service boundary verified (core-generator contains no CLI dependencies). All 36 tests passing (24 MVP + 12 REQ-003).

### ✅ REQ-004: Batch Generation Mode (In Progress)
- [x] Author REQ-004 (Functional + Non-Functional requirements)
- [x] Derive 12 acceptance criteria (AC-001 through AC-012)
- [x] Zero TBD markers — D2 gate compliance
- [ ] Author ADR-004 (Batch Contract decision)
- [ ] Submit ADR-004 for review
- [ ] Accept ADR-004 (`status: accepted`)
- [ ] Implement batch logic in core-generator
- [ ] Implement cli-interface `--batch` flag
- [ ] Derive tests from REQ-004 ACs
- [ ] Pass REQ-004 tests
- [ ] Submit PR for REQ-004
- [ ] Merge REQ-004 to `develop`
- [ ] Update REQ-004 to `implemented` status
- [ ] Commit to GitHub

**Phase Status:** REQ-004 spec complete with 11 functional requirements. Awaiting ADR-004 contract decision before implementation.


### 🔹 ADR-003: Extended Character Set Contract
- [x] ADR-003 content drafted (in execution plan)
- [x] Document review (MADR format check)
- [x] ADR acceptance gate
- [x] Commit to GitHub

### ✅ Phase 0.5 — Quality Gate V2.0 (Pre-REQ-004) ✅

**Status:** V2.0 Foundation Complete — REQ-003 implemented, ADR-003 accepted

### ✅ REQ-004: Batch Generation Mode (Spec Complete)
- [x] Author REQ-004 (11 functional + 12 ACs)
- [x] Zero TBD/TO-DO markers
- [x] Related ADRs documented (ADR-001, ADR-003, pending ADR-004)
- [ ] ADR-004 contract decision (architectural pattern)
- [ ] Quality gate V2.0-Complete

### 🔹 REQ-004: Batch Generation Mode
- [ ] Author REQ-004 (Batch API contract, `--batch` flag)
- [ ] Author ADR-004 (Batch Contract decision)
- [ ] Submit ADR-004 for review
- [ ] Accept ADR-004 (`status: accepted`)
- [ ] Implement batch logic in core-generator
- [ ] Implement cli-interface `--batch` flag
- [ ] Derive tests from REQ-004 ACs
- [ ] Pass REQ-004 tests
- [ ] Submit PR for REQ-004
- [ ] Merge REQ-004 to `develop`
- [ ] Update REQ-004 to `implemented` status
- [ ] Commit to GitHub

### 🎯 V2.0 Completion
- [ ] REQ-003 + REQ-004 all `implemented`
- [ ] ADR-003 + ADR-004 all `accepted`
- [ ] Tests: 24 MVP + 34–40 V2.0 tests passing
- [ ] Service boundary audit (no violations)
- [ ] Quality gate V2.0 passed
- [ ] Prepare to author REQ-005

---

## 📋 V2.1 — Output Formats Phase

### 🔹 REQ-005: Output Format Options
- [ ] Author REQ-005 (JSON/CSV schema, `--format` flag)
- [ ] Author ADR-005 (Format Selection decision)
- [ ] Submit ADR-005 for review
- [ ] Accept ADR-005 (`status: accepted`)
- [ ] Implement JSON formatter in cli-interface
- [ ] Implement CSV formatter in cli-interface
- [ ] Implement format dispatcher logic
- [ ] Derive tests from REQ-005 ACs
- [ ] Pass REQ-005 tests
- [ ] Submit PR for REQ-005
- [ ] Merge REQ-005 to `develop`
- [ ] Update REQ-005 to `implemented` status
- [ ] Commit to GitHub

### 🎯 V2.1 Completion
- [ ] REQ-005 complete (`implemented`)
- [ ] ADR-005 complete (`accepted`)
- [ ] Format tests passing (JSON valid, CSV RFC 4180)
- [ ] Combinatorial coverage matrix verified
- [ ] Stdlib compliance verified (no new deps)
- [ ] Full regression suite passing

### ✅ V2 Complete — Final Declaration
- [ ] All REQs (R003, R004, R005) at `implemented`
- [ ] All ADRs (A003, A004, A005) at `accepted`
- [ ] Test count: 80–90 tests passing
- [ ] Service boundary audit passed
- [ ] Index files updated (REQ + ADR)
- [ ] V2 declared `delivered`
- [ ] Update milestone badges (README.md)
- [ ] Create release notes
- [ ] Commit to GitHub

---

## 📊 Progress Tracking

### Current Phase: V2.0 — Foundation Complete
### Next Phase: V2.0-Complete (REQ-004 Batch Generation)

### Estimated Hours to REQ-004: ~20h (ADR-004 + Implementation + Tests)
### Estimated Hours to V2.1: ~18h (additional)
### Total Estimated Effort: ~50h

---

**Last Updated:** Mon May 11 2026 23:00  
**Plan Maintainer:** Companion Orchestrator  
**Safety Net:** This checklist tracks SDD phase gate compliance
