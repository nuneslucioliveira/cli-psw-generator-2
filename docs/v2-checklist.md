# V2 Development Checklist

**Status**: Planning Phase — Awaiting First Feature Implementation

---

## 📋 V2.0 — Foundation Phase

### ✅ Phase 0 — Planning (Current)
- [x] V2 Execution Plan authored (`docs/v2-execution-plan.md`)
- [ ] V2 Checklist created (this file) ⭐ Created now
- [ ] Team alignment on V2 scope

### 🔹 REQ-003: Special Characters Set
- [x] ADR-003 analysis complete (special + full charsets)
- [x] Author REQ-003 (Functional + Non-Functional requirements)
- [ ] Author ADR-003 (Extended Character Set Contract)
- [ ] Submit ADR-003 for review
- [ ] Accept ADR-003 (`status: accepted`)
- [ ] Implement REQ-003 in core-generator
- [ ] Derive tests from REQ-003 ACs
- [ ] Pass REQ-003 tests
- [ ] Submit PR for REQ-003
- [ ] Merge REQ-003 to `develop`
- [ ] Update REQ-003 to `implemented` status
- [ ] Commit to GitHub

### 🔹 ADR-003: Extended Character Set Contract
- [x] ADR-003 content drafted (in execution plan)
- [x] Document review (MADR format check)
- [x] ADR acceptance gate
- [ ] Commit to GitHub

### ✅ Phase 0.5 — Quality Gate V2.0 (Pre-REQ-004)
- [ ] REQ-003 complete (`accepted`)
- [ ] ADR-003 complete (`accepted`)
- [ ] MVP tests still passing (24/24)
- [ ] Prepare to author REQ-004

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

### Current Phase: Phase 0 — Planning
### Next Phase: V2.0 — REQ-003 (Special Characters)

### Estimated Hours to V2.0 Completion: ~32h (12h + 20h)
### Estimated Hours to V2.1 Completion: ~18h (additional)
### Total Estimated Effort: ~50h

---

**Last Updated:** Mon May 11 2026  
**Plan Maintainer:** Companion Orchestrator  
**Safety Net:** This checklist tracks SDD phase gate compliance

