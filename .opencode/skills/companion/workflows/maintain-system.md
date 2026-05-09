# Maintain Companion System — Augmentation SOP

## Objective

Correct, evolve, or extend any part of the companion system — including `SKILL.md`, workflow files, `hard-stops.md`, `ai-fluency.md`, `sdd.md`, and `workflows-index.md`. This workflow guides a collaborative session in which the Companion reads the full system state, reasons through the requested change, co-creates the exact content with the human, verifies consistency across all affected files, tests behavioural changes in a live session, and commits the result.

Success condition: every affected file reflects the approved change, the consistency check in Phase 4 finds no remaining issues, behavioural changes have been confirmed correct in a live session (where required), and the result is committed to a feature branch with a Conventional Commits message.

This workflow supports **Augmentation mode only**. The active mode is inherited from SKILL.md — never ask.

The Companion never writes files directly. All file operations are delegated via Task. Reanchoring reads are always performed by the Companion directly in its own context — never delegated.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| Change request | Required — halt if absent | Accept any form: a description, a symptom, a desired behaviour change. The Companion extracts the precise scope in Phase 1. |
| Mode | Inherited | Read from the active SKILL.md pipeline. Do not ask. |

Do not proceed past this point until all required inputs are confirmed. If the change request is absent, halt, state that a change request is required, and wait.

---

## Sequential steps

### Phase 1 — World State establishment

**Phase 1 is the foundation of all subsequent work. Do not skip, compress, or defer any read in this phase. The summary produced here is the shared ground from which co-creation begins.**

**Step 1.1 — Read the system files in sequence.**

Read the following files directly in this exact order. For each file, extract what it governs — not a full quote, but a precise statement of its role in the system:

1. `.opencode/skills/companion/SKILL.md` — identity, operating constraints, full 4Ds pipeline, mode definitions, gate enforcement, non-negotiable constraints
2. `.opencode/skills/companion/ai-fluency.md` — collaboration framework and the definitions of Automation, Augmentation, and Agency modes
3. `.opencode/skills/companion/hard-stops.md` — the complete list of decisions that belong exclusively to humans and must never be bypassed
4. `.opencode/skills/companion/sdd.md` — the SDD lifecycle, phase definitions, and phase gate criteria
5. `.opencode/skills/companion/workflows-index.md` — the complete routing map of all registered workflows and post-event hooks
6. Any individual workflow file in `.opencode/skills/companion/workflows/` that is directly relevant to the change request — identified by consulting `workflows-index.md` and the change request itself

**Step 1.2 — Identify the governing scope.**

From the files read in Step 1.1, identify:
- Which file(s) govern the area being changed
- Which rules or constraints in those files apply to the change request
- What the current behaviour is — stated in concrete, observable terms

**Step 1.3 — Present the World State summary to the human.**

Present the summary to the human. The summary must cover: what files govern the area being changed, what the relevant rules or constraints are, and what the current behaviour is. This summary is mandatory — the Companion does not propose any change during Phase 1.

**Step 1.4 — Wait for confirmation.**

Wait for the human to confirm or correct the World State summary. If the human corrects it: update the working understanding, re-present the corrected summary, and wait again. Do not proceed to Phase 2 until the human explicitly confirms.

---

### Phase 2 — Change analysis

**Phase 2 requires step-by-step reasoning. Present the reasoning to the human before proposing anything. Do not shortcut the CoT sequence.**

**Step 2.1 — Reason through the change request.**

Working from the confirmed World State, reason through the following five questions in sequence. Present each answer as the reasoning unfolds — do not withhold the chain of thought until the end:

**Question 1:** What exactly is being requested, in system terms? Translate the change request from product or symptom language into a precise statement of what instruction, rule, behaviour, or structure needs to change in which file.

**Question 2:** Which file or files does this affect directly? Name each file and state what in that file is affected.

**Question 3:** Does anything in the current system contradict or complicate this change? Check `hard-stops.md` explicitly. If the change touches a hard-stop — meaning it would remove, bypass, or modify a decision that belong exclusively to a human — halt immediately. Explain the contradiction in product language: what would break and why it was built that way. Wait for the human's explicit decision. Do not propose a workaround.

**Question 4:** Is the change complete as stated, or does it have cascading effects on other files? If the change is valid but incomplete — for example, a new pause criterion in one workflow that should also be reflected in SKILL.md — propose the expanded scope proactively. Name each file that needs to change, explain why, and state the tradeoff of not expanding. Wait for the human's decision on scope.

**Question 5:** What type of change is this? Classify as exactly one of:
- `surgical-correction` — a typo, a missing exception row, an ambiguous instruction, or a factual error
- `behaviour-evolution` — changing how the Companion behaves in a specific situation
- `structural-addition` — adding a new workflow file, a new section, or a new index entry

**Step 2.2 — Present the full CoT output.**

Present the complete answer to all five questions as a single readable output. Make the reasoning visible so the human can follow the logic and catch any misunderstanding.

**Step 2.3 — Wait for confirmation.**

Wait for the human to confirm or correct the analysis. If the human corrects any part: revise it, re-check Questions 3 and 4 with the corrected understanding, and re-present the affected portion. Do not proceed to Phase 3 until the human explicitly confirms.

---

### Phase 3 — Co-creation of the change

**Work turn by turn. The human validates each piece before the Companion proceeds to the next file. Do not batch multiple files into a single proposal.**

**Step 3.1 — Propose content according to change type.**

**For `surgical-correction`:** Present current text alongside proposed replacement in a before/after format. One change at a time. State the file and section. Wait for approval before presenting the next change.

**For `behaviour-evolution`:** Present the full rewritten section — not a diff, but the complete replacement text. Explain in one or two sentences what the new instruction produces that the old one did not. Wait for approval before presenting the next file.

**For `structural-addition` — new workflow:** Load and follow `.opencode/skills/companion/workflows/add-workflow.md` as a sub-workflow. Execute it fully before returning to Phase 3 completion.

**For `structural-addition` — new section, hard-stop entry, or index row:** Propose the exact content and its placement. State why this placement is correct. Wait for approval before proceeding.

**Step 3.2 — Handle mid-iteration conflicts.**

If the human introduces a request that would violate a hard-stop or create an inconsistency with another file: pause immediately. Name the conflict in product language. Wait for the human's explicit decision. Do not incorporate the conflicting instruction silently.

**Step 3.3 — Close Phase 3.**

Phase 3 ends when the human has approved the complete proposed content for all affected files.

---

**REANCHORING — before exiting Phase 3:**

Emit: `[Re-anchoring — rereading SKILL.md and hard-stops.md before checking consistency]`

Re-read directly in the Companion's own context — do not delegate:
- `.opencode/skills/companion/SKILL.md`
- `.opencode/skills/companion/hard-stops.md`

Only after completing these reads proceed to Phase 4.

---

### Phase 4 — Consistency check

**Phase 4 is a World State check after the proposed content is fully approved but before any file is written.**

**Step 4.1 — Check consistency across all system files.**

Evaluate the approved change set against the following four checks. For each, state the finding explicitly — "no issues found" or a precise description of the issue:

**Check 1 — Contradiction with governing files:** Does the proposed change contradict any instruction in `SKILL.md`, `ai-fluency.md`, `hard-stops.md`, or `sdd.md`?

**Check 2 — Routing table impact:** Does the proposed change affect routing in `workflows-index.md`? If yes: confirm a `workflows-index.md` update is included in the change set. If not: flag it and propose the missing update.

**Check 3 — Cross-workflow references:** Does the proposed change modify a workflow referenced by another workflow or by SKILL.md? If yes: determine whether the referencing file needs updating. If it does: flag it, name the file and section, and propose the update.

**Check 4 — Context Engineering completeness:** Does the changed file contain all CoT steps, reanchoring triggers, and World State checks its content requires? Apply these rules:
- Any step involving analysis or proposal must instruct the Companion to reason step by step and present that reasoning before acting
- Any phase boundary involving a mutation of system state requires a reanchoring trigger
- The D2→D3 boundary in any workflow that modifies files must include a reanchoring trigger
- Any re-entry into a co-creation loop from a test or review cycle must include a reanchoring trigger
- Reanchoring triggers must instruct the Companion to read directly — never via Task delegation
- Instructions governing a specific action must appear immediately before that action

**Step 4.2 — Present the consistency check results.**

Present all four check results as a single grouped output. For each issue: state which check identified it, describe it precisely, and propose a specific resolution. For each clean check: state "no issues found."

**Step 4.3 — Wait for confirmation.**

Do not proceed to Phase 5 or Phase 6 until the human confirms all issues are resolved or explicitly accepted. Delegate any additional corrections via Task, re-present the affected content, and return to Step 4.2 until the human confirms.

---

### Phase 5 — Write files

**Phase 5 applies only to `behaviour-evolution` and `structural-addition`. Skip for `surgical-correction` and proceed directly to Phase 6.**

Delegate a Task to write every file approved in Phase 3 and verified in Phase 4. Write all files in a single Task delegation — do not split into multiple Tasks unless the agent returns an error on a specific file.

After the Task returns: confirm each file was written successfully. If any file write failed: report the error, identify which file was affected, and delegate a corrective Task before proceeding. Do not proceed to Phase 6 until all file writes are confirmed successful.

---

### Phase 6 — Test

**Phase 6 applies only to `behaviour-evolution` and `structural-addition`. Skip for `surgical-correction` and proceed directly to Phase 7.**

The files are now on disk. The test validates the actual behaviour produced by the written content — not a proposal.

**Step 6.1 — Propose the test.**

Ask the human to open a new Claude Code or OpenCode session with companion loaded. Provide the exact prompt or task to use to activate the changed or new workflow — concrete enough to copy directly. State what behaviour to observe: what the Companion should say, what steps it should follow, what it should not do.

Wait for the human to return with the result.

**Step 6.2 — Process a successful test result.**

If the human confirms the behaviour is correct: proceed to Phase 7.

**Step 6.3 — Process a failed test result.**

If the human reports a problem and provides a transcript:

**REANCHORING — on every re-entry into Phase 3 from the test loop:**

Emit: `[Re-anchoring — rereading SKILL.md, hard-stops.md, and the workflow under review before analyzing the transcript]`

Re-read directly in the Companion's own context — do not delegate:
- `.opencode/skills/companion/SKILL.md`
- `.opencode/skills/companion/hard-stops.md`
- The specific workflow file being tested

Only after completing these reads proceed with the transcript analysis:

**Analysis step 1 — What behaviour was observed?** Describe the Companion's actual behaviour: what it did, what it said, and where the deviation began.

**Analysis step 2 — What behaviour was expected?** State what the workflow instructions prescribe for the situation that was tested.

**Analysis step 3 — What caused the deviation?** Identify the specific instruction — or absence of instruction — responsible. Name the phase, step, or sentence.

**Analysis step 4 — What is the minimum correction?** Propose the smallest change that corrects the identified cause without introducing new inconsistencies. Verify against other workflow steps before proposing.

Present the full analysis to the human. Return to Phase 3 with the identified corrections. After corrections are co-created and approved, run Phase 4 again, then Phase 5 (re-write the corrected files) before re-entering the test loop.

**Step 6.4 — Track iterations and apply the stagnation check.**

After 5 test iterations without clear and significant progress, surface an observation to the human — adapt the wording to the session language and the specific context. The observation should convey, in substance: that after N iterations without clear progress, there may be something structural the test is not revealing — a conflict between files, an ambiguous instruction elsewhere in the system, or a model behaviour that does not respond well to this instruction structure — and that pausing to reassess the design before continuing may be worth considering.

Wait for the human's decision. Do not continue iterating without explicit direction.

---

### Phase 7 — SCM and commit

**Read SCM state at runtime. Do not use hardcoded branch names, repository names, or path assumptions.**

**Step 7.1 — Determine the repository structure.**

Delegate a Task to determine:
1. What is the current branch of the repository? Run `git branch --show-current`.
2. Is that branch `main` or `develop`?

Wait for the Task to return before proceeding.

**Step 7.2 — Apply the branch protection gate.**

If the current branch is `main` or `develop`: halt. State the branch name. Instruct the human to create a feature branch — suggest the format `chore/companion-<short-description>`. Wait for explicit confirmation before proceeding.

If the current branch is already a feature branch: proceed to Step 7.3.

**Step 7.3 — Execute the SCM pre-action checklist.**

Delegate a Task to read `docs/shared/architecture/scm.md` and execute the git pre-action checklist against the current state of the repository. Surface any failures to the human. Do not continue to Step 7.4 if any checklist item fails.

**Step 7.4 — Verify GIT state.**

If GIT is locked: present the complete list of files to be committed. Inform the human that GIT:ready is required. Wait for explicit authorisation. Do not proceed until granted.

**Step 7.5 — Stage and commit.**

Delegate a Task to:
1. Stage only the files modified in this maintenance cycle — exactly the set identified and approved in Phases 3 and 4.
2. Commit with a Conventional Commits message: `chore(companion): <description>` where `<description>` is a concise imperative statement of what changed.
3. Report the commit hash and the list of files committed.

**Step 7.6 — Ask about PR.**

After the commit is confirmed: ask the human whether to open a PR. If yes: delegate a Task to open a PR targeting the correct base branch per SCM rules. Report the PR URL. If no: stop.

---

## Expected output

1. **Modified files** — one or more files in `.opencode/skills/companion/` updated with approved content, written via delegated Task in Phase 5.
2. **Consistency-verified change set** — all affected files updated, including `workflows-index.md` if routing changed and any cross-referenced workflow files, confirmed by the Phase 4 consistency check.
3. **Test validation** (conditional — `behaviour-evolution` and `structural-addition` only) — human confirmation in Phase 6 that the changed behaviour works correctly in a live session with files already on disk.
4. **Commit** — one commit on a feature branch in Phase 7, following Conventional Commits: `chore(companion): <description>`.
5. **PR** (conditional — if human approves in Step 7.6) — pull request opened targeting the correct base branch, with the PR URL reported.

---

## D4 gate

After Phase 6 completes, ask the human what they want to do next. Surface options naturally — without framing any as a default or recommendation. Wait for an explicit decision before taking any action.

---

## Exceptions

| Condition | Response |
|---|---|
| Change request absent | Halt before Phase 1; state that a change request is required; wait |
| System file unreadable in Phase 1 | Halt at Step 1.1; report which file could not be read and its full path; wait for the human to resolve access before retrying |
| Change touches a hard-stop | Halt at Phase 2 Step 2.1 Question 3; explain the contradiction in product language — what would break and why it was built that way; wait for the human's explicit decision before proceeding |
| Change is valid but incomplete — cascading effects identified | Do not block; propose the expanded scope proactively at Phase 2 Step 2.1 Question 4; name each affected file, explain the necessity, and state the tradeoff of not expanding; wait for the human's decision on scope |
| Phase 3 co-creation reveals a new conflict mid-iteration | Pause immediately at Step 3.2; name the conflict in product language; wait for the human's decision; do not incorporate the conflicting instruction silently |
| Human rejects the same section repeatedly in Phase 3 | After three revision cycles on the same section, ask the human directly what the core issue is with the current draft; use the answer to reconstruct the section from scratch rather than patching it incrementally |
| Consistency check in Phase 4 finds an unresolved issue | Do not proceed to Phase 5 or Phase 6; present the issue and proposed resolution; wait for the human to confirm before continuing |
| Specialist agent Task returns an error or partial result when writing files in Phase 5 | Report the exact error and which file was affected; do not proceed to Phase 6 until all file writes are confirmed successful; delegate a corrective Task if a partial write occurred |
| Phase 6 test loop reaches 5 iterations without clear progress | Emit the stagnation observation at Step 6.4 in the session language; propose pausing to reassess the design; wait for the human's decision; do not continue iterating without explicit direction |
| Branch is `main` or `develop` | Halt at Phase 7 Step 7.2; state the branch name; instruct the human to create a feature branch with the suggested format; wait for explicit confirmation before proceeding |
| GIT locked when Phase 7 Step 7.4 is reached | Present the complete list of files to be committed; inform the human that GIT:ready is required; wait for explicit authorisation |
| Human requests removal of a reanchoring trigger or CoT step | State what risk the trigger or step mitigates and what class of failure it prevents; propose an alternative structure that preserves the mitigation if one exists; wait for the human's decision; do not remove the element silently |
| `.opencode/skills/companion/workflows/add-workflow.md` unreadable when Phase 3 reaches a `structural-addition` for a new workflow | Halt at Step 3.1; report the access failure and the file path; wait for the human to resolve access before retrying |
| SCM pre-action checklist in Step 7.3 fails | Surface all checklist failures before proceeding; do not continue to Step 7.4 until the human has resolved or explicitly accepted each failure |