# Agentic SDLC — Augmentation / Agency SOP

## Objective

Orchestrate the full implementation lifecycle of a REQ: decompose into issues, implement each issue sequentially, run a final code review and regression check on the complete PR, open the PR, and hand off remaining lifecycle actions to the human. Success condition: a PR exists with all issues implemented, tests passing (including full project suite), security addressed, code review approved, and the human has received a complete execution summary with evidence and explicit next steps.

The Companion orchestrates this workflow across two modes. In **Augmentation** mode, the Companion co-creates each step with the human, presenting evidence and waiting for decisions before proceeding. In **Agency** mode, the Companion executes the full lifecycle autonomously within defined boundaries, pausing only at hard stops and escalation points. The active mode is inherited from the SKILL.md pipeline — the Companion must not ask.

The Companion never writes files directly. All file operations are delegated via Task. Every delegation prompt passes through `@promptmind` before being sent to the executing agent. Reanchoring reads are always performed by the Companion directly — never delegated.

---

## Required inputs

| Input | Required | Notes |
|---|---|---|
| REQ identifier | Required — halt if absent | e.g. `REQ-001`. |
| Mode | Inherited | Read from the active SKILL.md pipeline. Do not ask. Route to Pipeline A (Agency) or Pipeline B (Augmentation) based on this value. |

Do not proceed past this point until all required inputs are confirmed. If a required input is missing, state which one is missing and wait.

---

## Mode routing

Read the Mode input. If Agency → execute Pipeline A. If Augmentation → execute Pipeline B. Do not ask the human.

---

## Pipeline A — Agency

1. Assess execution state
   1.1. Check if a tracking issue for this REQ already exists: `gh issue list --search "REQ-NNN" --label "req:todo,req:decomposed,req:implementing,req:implemented" --json number,title,labels`.
   1.2. If a tracking issue exists: read it and its sub-issues to determine current phase. Present the resumed state to the human before continuing.
   1.3. If no tracking issue exists: proceed to step 2 — this is a fresh execution.

2. Repository state assessment
   2.1. Delegate a Task to run: `find <workspace_root> -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/docs/*" -not -path "*/.next/*" -maxdepth 4 -name "package.json" | head -5`
   2.2. Delegate a Task to read `<workspace_root>/AGENTS.md` if present.
   2.3. Reason through: does a deployable application exist, or is this a blank slate (documentation, config, and tooling only — no application package.json, no src/, no app/)?
   2.4. If a deployable application exists: proceed to step 3.
   2.5. If the repository is a blank slate:
        2.5.1. Read all ADRs listed in the REQ's `related-adrs`. Extract every Implementation Note describing mandatory scaffold structure (monorepo layout, package manager, build tooling, directory conventions).
        2.5.2. If the ADRs provide sufficient scaffold specification: create a `REQ-NNN/SI-0: Foundation — scaffold application structure` issue as the first dependency of all other sub-issues. Proceed to step 3.
        2.5.3. If the ADRs do not provide sufficient scaffold specification: halt. Report to the human exactly what scaffold decisions are undocumented. Wait for explicit direction before proceeding.

3. Decompose REQ
   3.1. Call `decompose-req.md` as a sub-workflow, passing the REQ identifier.
   3.2. When it returns: extract the list of created issues (numbers, titles, mapped ACs, dependencies, assigned personas).
   3.3. Delegate a Task to apply `status:todo` label to each created SI issue.

4. Implement issues sequentially (repeat for each issue in dependency order)

   **State tracking convention:** Throughout this section, each SI carries a status header with six fields: `Dev`, `Sec`, `QA`, `Review`, `Commit`, and `rewriter`. All fields except `rewriter` start as `no` at the beginning of each SI. When a loop-back occurs, the reset pattern is cumulative — resetting a phase also resets every phase that follows it in the pipeline (Dev → Sec → QA → Review → Commit). This is the **cascade reset rule**.

   **Task failure convention:** If any delegated Task returns a non-complete status (error, timeout, or tool failure), halt the SI, post the failure details as a comment on the SI issue, and escalate to the human. Do not retry automatically unless the failure is a transient network error (in which case retry once, then escalate).

   --- Reanchor ---

   4.1. Before starting this SI, read section 4 of this file directly
        (not via Task) — from "4. Implement issues sequentially" to
        "5. Final regression check". Read it against this SI's issue
        profile: ACs covered, ADRs listed, Figma reference present or
        absent, dependencies, complexity.
        Check each of the following:
        - Figma reference present → Dev must call `get_design_context`
          before implementing
        - SI has dependencies → verify all carry `status:implemented`
          before proceeding
        - SI complexity is L or higher → confirm DoD items are
          observable and testable, not just "file exists"
        Emit: `[REANCHOR §4: SI-N — <finding per item above, or
        "standard" if nothing applies>]`
   4.2. Emit the SI-N header with all fields set to `no` and the appropriate
        `rewriter` and `figma-ref` values for this SI.

   --- Label management ---

   4.5. If this is the first SI in the REQ (no SI for this REQ has label `status:wip` or `status:implemented` yet): delegate a Task to update the REQ tracking issue label: `gh issue edit $TRACKING_ISSUE_NUMBER --remove-label 'req:decomposed' --add-label 'req:implementing'`
   4.6. Delegate a Task to apply the in-progress label: `gh issue edit $ISSUE_NUMBER --remove-label 'status:todo' --add-label 'status:wip'`

   --- Dependency gate ---

   4.7. Verify that all issues listed in this SI's `depends-on` field (if any) carry the label `status:implemented`. If any dependency does not carry `status:implemented`:
   - Check whether a hard stop label (`status:blocked`) is active on the current SI. If yes, halt and escalate to human.
   - If the dependency is `status:wip`, halt and wait — do not proceed until it reaches `status:implemented`.
   - If the dependency is `status:todo`, halt and escalate to human — the dependency order is violated.

   --- Dev phase ---

   4.8. Resolve Figma reference: if the SI issue body references a Figma node (fileKey + nodeId), record the fileKey and nodeId as figma-ref context for this SI. The Companion does NOT call Figma APIs — the Dev and QA agents call them directly using the fileKey and nodeId passed in their delegation prompts.

   4.9. Construct the Dev delegation prompt. The prompt MUST:
         - Reference the GitHub issue by URL or number
         - Include relevant skill names for the executing agent to load
         - Include Figma fileKey + nodeId if figma-ref exists — the Dev agent calls `get_design_context` and `get_screenshot` itself
         - NOT contain markdown code blocks with implementation code, file structures, or solution prescriptions
         - NOT transcribe ADR Implementation Notes — the issue body lists Related ADRs; the Dev agent reads them directly
         - BDD first: for each AC mapped to this SI, write at least one test that fails if the described behaviour is absent; tests must verify observable runtime behaviour — not function existence or file structure
         - TDD second: unit tests for internal contracts not covered by BDD tests
         - Confirm the application starts: run `pnpm dev`, confirm it serves on the expected port without errors. If it does not start, fix the startup error before committing — a non-starting application is a Dev failure, not a QA finding

   4.10. Pass the Dev prompt through `@promptmind`. This is a Task delegation — wait for `TASK_RESULT: complete` before proceeding. If the rewriter returns any status other than `complete`, halt and escalate.

   4.11. Take the optimised prompt returned by the rewriter. Append the TASK_RESULT block (defined in SKILL.md § Execution via Task) to the end of the optimised prompt. Delegate the combined prompt via Task to the selected Dev agent.

   4.12. When the Dev Task returns `TASK_RESULT: complete`:
         a. Delegate a Task to run the project test suite.
         b. If tests pass (green): proceed to 4.13.
         c. If tests fail (red): construct a correction prompt that includes the failing test names and error output. Delegate a correction Task back to the Dev agent. Return to step 4.12a (re-run tests). Repeat this loop for a maximum of 3 correction attempts. If tests remain red after 3 attempts, halt and escalate to human.

   4.13. Set `Dev:yes`. Emit the updated SI-N header with the current value of each field.

   --- Security phase ---

   4.14. Construct the Security delegation prompt. Pass through `@promptmind` via Task. Wait for `TASK_RESULT: complete` before proceeding.

   4.15. Take the optimised prompt. Append the TASK_RESULT block. Delegate via Task to the Security agent.

   4.16. When Security returns:
         - If no findings or informational-only findings: proceed to 4.17.
         - If findings require a code fix: apply the **cascade reset rule** — set `Dev:no`, `Sec:no`, `QA:no`, `Review:no`. Emit the updated header. Return to step 4.9 with the security findings as additional context for the Dev prompt. Loop until Security returns with no actionable findings. Maximum 3 Dev↔Security loops; if unresolved after 3, halt and escalate to human.

   4.17. Delegate a Task to post security findings (or "no findings") as a comment on the SI issue.

   4.18. Set `Sec:yes`. Emit the updated SI-N header with the current value of each field.

   --- QA phase ---

   4.19. Construct the QA delegation prompt. The prompt MUST:
         - State explicitly: QA operates independently — do not assume the Dev phase produced correct tests, working code, or a functioning application
         - BLOCKED conditions (return BLOCKED, not MATCH/MISMATCH):
           1. Application does not start: `pnpm dev` fails or does not serve on the expected port
           2. Test suite fails: run `pnpm test` independently — if any test fails, return BLOCKED with failing test names and output
           3. An AC mapped to this SI is not verifiable in the running application: route missing, feature absent, or runtime error when accessing it
           4. If Figma reference exists: the relevant route does not render in the running application, making screenshot capture impossible
         - MISMATCH conditions (application runs but diverges):
           1. Observed behaviour in the running application diverges from what the AC describes
           2. If Figma reference exists: visual implementation diverges from the Figma node — requires screenshot as evidence; a verdict without a screenshot is not valid
         - MATCH condition: all ACs verified in the running application, and if Figma reference exists, screenshot captured and visual implementation conforms
         - If Figma reference exists: include fileKey and nodeId — the QA agent calls `get_screenshot` itself

   4.20. Pass through `@promptmind` via Task. Wait for `TASK_RESULT: complete` before proceeding.

   4.21. Take the optimised prompt. Append the TASK_RESULT block. Delegate via Task to the QA agent. This MUST be a separate Task — not bundled with the Dev or Security delegation.

   4.22. When QA returns:
         - If all verdicts are `MATCH` and all Acceptance Criteria pass: proceed to 4.23.
         - If any verdict is `MISMATCH` or any AC fails: apply the **cascade reset rule** — set `Dev:no`, `Sec:no`, `QA:no`, `Review:no`. Emit the updated header. Return to step 4.9 with the QA failure details (MISMATCH screens, failed ACs) as additional context. Maximum 3 Dev↔QA loops; if unresolved after 3, halt and escalate to human.
         - If QA returns `BLOCKED`: apply the **cascade reset rule** — set `Dev:no`, `Sec:no`, `QA:no`, `Review:no`. Emit the updated header. Return to step 4.9 with the BLOCKED reason (startup error, failing tests, missing route, or screenshot failure) as context. This counts as one Dev correction attempt toward the maximum of 3.

   4.23. Set `QA:yes`. Emit the updated SI-N header with the current value of each field.

   --- Review phase ---

   4.24. Construct the Code Review delegation prompt. Pass through `@promptmind` via Task. Wait for `TASK_RESULT: complete` before proceeding.

   4.25. Take the optimised prompt. Append the TASK_RESULT block. Delegate via Task to the Code Review agent.

   4.26. When Review returns, evaluate the verdict:
         - `APPROVE` or `APPROVE WITH COMMENTS`: proceed to 4.27.
         - `REQUEST CHANGES`: apply the **cascade reset rule** — set `Dev:no`, `Sec:no`, `QA:no`, `Review:no`. Emit the updated header. Return to step 4.9 with the reviewer's change requests as additional context. Maximum 3 Dev↔Review loops; if unresolved after 3, halt and escalate to human.
         - `BLOCKED`: escalate to human immediately. Halt this SI until human unblocks.

   4.27. Set `Review:yes`. Emit the updated SI-N header with the current value of each field.

   --- Augmentation mode gate (Pipeline B only) ---

   4.27a. **This step executes only when operating in Pipeline B (Augmentation mode).** In Pipeline A (Agency mode), skip directly to 4.28.

   Present the complete SI summary to the human:
   - Dev results (test status, files changed)
   - Security findings (posted in 4.17)
   - QA evidence (screenshots, MATCH/MISMATCH verdicts, AC results; including Figma comparison if applicable)
   - Code Review verdict

   Wait for explicit human approval before proceeding. If the human requests changes, apply the **cascade reset rule** and return to step 4.9 with the human's feedback as context.

   --- Commit phase ---

   4.28. **Pre-commit verification.** Confirm the header shows exactly: `Dev:yes Sec:yes QA:yes Review:yes Commit:no`. Check each field individually:
         - If `Dev`, `Sec`, `QA`, or `Review` is not `yes` → a phase was skipped or a loop-back did not complete. Halt and identify the incomplete phase.
         - If `Commit` is already `yes` → this SI has already been committed. Halt — do not double-commit.
         - If `Commit` is `no` and all four preceding fields are `yes` → proceed.

   4.29. **GIT lock check.** Verify GIT:ready. If locked: present a summary of the pending commit to the human and wait for authorisation.

   4.30. Delegate a Task to commit and push. The commit message MUST:
         - Follow Conventional Commits format (e.g., `feat(auth): ...`, `fix(security): ...`)
         - Include `closes #ISSUE_NUMBER` in the body or footer
         - Include the trailer `[AI-assisted: companion]`

   4.31. Delegate a Task to update the SI label: `gh issue edit $ISSUE_NUMBER --remove-label 'status:wip' --add-label 'status:implemented'`

   4.32. Set `Commit:yes`. Emit the SI-N header — all fields must now be `yes`. If any field is not `yes` at this point, halt — a step was completed out of order.

   4.33. Delegate a Task to post implementation evidence on the REQ tracking issue. Evidence MUST include: commit hash, test results summary, security findings summary, QA screenshots, and the signature footer `--- *Posted with AI assistance — companion*`.

   4.34. Notify human: SI number, commit hash, test status (pass/fail with count), security findings (count or "none"), QA verdict (MATCH/MISMATCH summary).

   --- Next SI ---

   4.35. Return to step 4.1 for the next SI in dependency order. The reanchor in 4.1–4.3 is mandatory for every SI — do not skip it even if the files were read for the previous SI.
   4.36. If no more SIs are pending for this REQ: proceed to step 5.

5. Final regression check and code review
   5.1. Read directly (not via Task): `agentic-sdlc.md` and `hard-stops.md`.
   Each file must be read in full — no `limit` parameter, no partial read. A partial read does not satisfy this reanchoring step.
   After all reads complete, emit: `[REANCHOR verified: agentic-sdlc.md N/N, hard-stops.md N/N]` with actual line counts. Both files MUST appear. If any is missing or lines_read < total_lines, halt and re-read before proceeding.
   5.2. Confirm all SIs have label `status:implemented` via `gh issue list --search "REQ-NNN/SI" --json number,labels`.
   If any issue has status other than `implemented`: do not proceed to step 6. Return to step 4 for the next pending issue. The PR gate requires ALL sub-issues to be `status:implemented` before the PR can be opened.
        Delegate a Task to update the REQ tracking issue label: `gh issue edit $TRACKING_ISSUE_NUMBER --remove-label 'req:implementing' --add-label 'req:implemented'`
   5.3. Delegate a Task to run the full project test suite on the complete feature branch.
   5.4. If any test fails: identify the causing issue. Return to step 4 for that issue with regression context. Re-run suite after fix. Loop until green.
   5.5. Construct the final Code Review delegation prompt. Pass through
        `@promptmind` via Task. Wait for `TASK_RESULT: complete`.
        Delegate via Task to the Code Review agent. The prompt MUST:
        - Target the complete diff of the feature branch against the base branch
        - CR operates independently — do not assume Sec or QA found all issues
        - Layer 1 — checklist: run `.opencode/skills/companion/scripts/check-secrets-history.sh` (BLOCKED if
          FAIL); verify Conventional Commits on all commits; verify branch is not
          `main` or `develop`; verify PR description covers what changed, why, and
          expected impact; for each AC in the linked REQ, verify a corresponding
          test exists in the diff — absent AC coverage is a BLOCKER
        - Layer 2 — interpretive: verify consistency with all accepted ADRs
          governing the affected service; identify any scope creep (functionality
          not covered by any AC in the linked REQ); identify undocumented
          cross-service impact
        - Verdict: APPROVE / APPROVE WITH COMMENTS / REQUEST CHANGES / BLOCKED
   5.6. If APPROVE or APPROVE WITH COMMENTS: proceed to step 6.
   5.7. If REQUEST CHANGES: identify affected issues. Return to step 4 for each with correction context. Re-run test suite and code review. Loop until approved.
   5.8. If BLOCKED: present all blockers to the human. Wait for explicit direction per blocker. Do not resolve architectural blockers autonomously.
   5.9. CR iteration tracking: if `code-review.md` has returned REQUEST CHANGES or BLOCKED more than once, send a direct message with: (a) CR call count, (b) unresolved findings, (c) which issues were returned to step 4 and what correction was attempted. Do not halt. Continue the loop.
   5.10. Delegate a Task to post the code review result as a comment on the tracking issue.

6. Open PR
   6.1. Read directly (not via Task): `agentic-sdlc.md` and `hard-stops.md`.
   Each file must be read in full — no `limit` parameter, no partial read. A partial read does not satisfy this reanchoring step.
   After all reads complete, emit: `[REANCHOR verified: agentic-sdlc.md N/N, hard-stops.md N/N]` with actual line counts. Both files MUST appear. If any is missing or lines_read < total_lines, halt and re-read before proceeding.
   6.1a. Emit the PR gate verification:
   ```
   [PR-GATE] SIs implemented: N/M | all:yes/no | proceed:yes/no
   ```
   If `all:no`, do not proceed. Return to step 4 for the next pending SI.
   6.2. Verify GIT:ready. If locked: present the PR summary, state GIT:ready is required, wait for authorisation.
   6.3. Delegate a Task to read `docs/shared/architecture/scm.md` and extract the correct base branch.
   6.4. Security findings report: read the comments on each SI issue to collect all security findings recorded during implementation. If any findings exist:
      a. Classify each finding: severity (LOW/MEDIUM/HIGH), SI affected, status (resolved — with commit hash — or unresolved).
      b. Prepare the findings report body as a formatted table. This report will be posted as a PR comment in step 6.6 — after the PR is created in step 6.5. Store the report body for use in step 6.6.
      c. If any finding is unresolved: delegate a Task to add label `needs-work` to the PR (`gh issue edit $PR_NUMBER --add-label 'needs-work'`).
      d. If all findings are resolved: the comment is informational only. No label added.
   6.5. Pass the PR creation prompt through `@promptmind`. Delegate a Task to open a PR via `gh pr create` with: title `feat: implement REQ-NNN — <REQ title>`; body with all issues, commit hashes, test evidence, screenshots, and tracking issue reference; target branch from SCM rules.
   6.6. When PR is created: if a security findings report was prepared in step 6.4, delegate a Task to post it as a PR comment: `gh pr comment $PR_NUMBER --body "<prepared findings report>"`. Then present the PR URL to the human as a direct message.
   6.7. Delegate a Task to update the tracking issue label: `gh issue edit $TRACKING_ISSUE_NUMBER --add-label 'pr:open'`

7. Final summary and handoff
   7.1. Present complete execution summary: REQ identifier, tracking issue link, sub-issues with status, commit hashes, test evidence, screenshots, design fidelity evidence (if any `implement-issue` call reported it), security findings, code review result, PR link.
   7.2. State explicitly: the human must review and approve the PR; merge the PR; after merge set REQ to `implemented`; after production deploy set REQ to `delivered`; close the tracking issue. The Companion does not perform any of these.

8. Post-merge handoff
   8.1. After PR merge, the human is responsible for: closing all sub-issues, closing the REQ tracking issue, setting REQ status to `implemented`, and after production deploy setting REQ status to `delivered`. The Companion does not perform any of these.

---

## Pipeline B — Augmentation

1. Assess execution state
   1.1. Check if a tracking issue for this REQ already exists: `gh issue list --search "REQ-NNN" --label "req:todo,req:decomposed,req:implementing,req:implemented" --json number,title,labels`.
   1.2. If a tracking issue exists: read it and its sub-issues to determine current phase. Present the resumed state to the human before continuing.
   1.3. If no tracking issue exists: proceed to step 2 — this is a fresh execution.

2. Repository state assessment
   2.1. Delegate a Task to run: `find <workspace_root> -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/docs/*" -not -path "*/.next/*" -maxdepth 4 -name "package.json" | head -5`
   2.2. Delegate a Task to read `<workspace_root>/AGENTS.md` if present.
   2.3. Reason through: does a deployable application exist, or is this a blank slate (documentation, config, and tooling only — no application package.json, no src/, no app/)?
   2.4. If a deployable application exists: proceed to step 3.
   2.5. If the repository is a blank slate:
        2.5.1. Report to the human: "This repository has no deployable application yet. Before decomposing REQ-NNN, a foundation issue is needed to scaffold the application structure. The ADRs [list them] document [summary of what they cover]. Shall I create a foundation issue as SI-0, or do you want to handle the scaffold separately?"
        2.5.2. Wait for explicit decision before proceeding to step 3.

3. Decompose REQ
   3.1. Call `decompose-req.md` as a sub-workflow, passing the REQ identifier.
   3.2. When it returns: extract the list of created issues (numbers, titles, mapped ACs, dependencies, assigned personas).
   3.3. Delegate a Task to apply `status:todo` label to each created SI issue.

4. Implement issues sequentially (repeat for each issue in dependency order)

   **State tracking convention:** Throughout this section, each SI carries a status header with six fields: `Dev`, `Sec`, `QA`, `Review`, `Commit`, and `rewriter`. All fields except `rewriter` start as `no` at the beginning of each SI. When a loop-back occurs, the reset pattern is cumulative — resetting a phase also resets every phase that follows it in the pipeline (Dev → Sec → QA → Review → Commit). This is the **cascade reset rule**.

   **Task failure convention:** If any delegated Task returns a non-complete status (error, timeout, or tool failure), halt the SI, post the failure details as a comment on the SI issue, and escalate to the human. Do not retry automatically unless the failure is a transient network error (in which case retry once, then escalate).

   --- Reanchor ---

   4.1. Before starting this SI, read section 4 of this file directly
        (not via Task) — from "4. Implement issues sequentially" to
        "5. Final regression check". Read it against this SI's issue
        profile: ACs covered, ADRs listed, Figma reference present or
        absent, dependencies, complexity.
        Check each of the following:
        - Figma reference present → Dev must call `get_design_context`
          before implementing
        - SI has dependencies → verify all carry `status:implemented`
          before proceeding
        - SI complexity is L or higher → confirm DoD items are
          observable and testable, not just "file exists"
        Emit: `[REANCHOR §4: SI-N — <finding per item above, or
        "standard" if nothing applies>]`
   4.2. Emit the SI-N header with all fields set to `no` and the appropriate
        `rewriter` and `figma-ref` values for this SI.

   --- Label management ---

   4.5. If this is the first SI in the REQ (no SI for this REQ has label `status:wip` or `status:implemented` yet): delegate a Task to update the REQ tracking issue label: `gh issue edit $TRACKING_ISSUE_NUMBER --remove-label 'req:decomposed' --add-label 'req:implementing'`
   4.6. Delegate a Task to apply the in-progress label: `gh issue edit $ISSUE_NUMBER --remove-label 'status:todo' --add-label 'status:wip'`

   --- Dependency gate ---

   4.7. Verify that all issues listed in this SI's `depends-on` field (if any) carry the label `status:implemented`. If any dependency does not carry `status:implemented`:
   - Check whether a hard stop label (`status:blocked`) is active on the current SI. If yes, halt and escalate to human.
   - If the dependency is `status:wip`, halt and wait — do not proceed until it reaches `status:implemented`.
   - If the dependency is `status:todo`, halt and escalate to human — the dependency order is violated.

   --- Dev phase ---

   4.8. Resolve Figma reference: if the SI issue body references a Figma node (fileKey + nodeId), record the fileKey and nodeId as figma-ref context for this SI. The Companion does NOT call Figma APIs — the Dev and QA agents call them directly using the fileKey and nodeId passed in their delegation prompts.

   4.9. Construct the Dev delegation prompt. The prompt MUST:
         - Reference the GitHub issue by URL or number
         - Include relevant skill names for the executing agent to load
         - Include Figma fileKey + nodeId if figma-ref exists — the Dev agent calls `get_design_context` and `get_screenshot` itself
         - NOT contain markdown code blocks with implementation code, file structures, or solution prescriptions
         - NOT transcribe ADR Implementation Notes — the issue body lists Related ADRs; the Dev agent reads them directly
         - BDD first: for each AC mapped to this SI, write at least one test that fails if the described behaviour is absent; tests must verify observable runtime behaviour — not function existence or file structure
         - TDD second: unit tests for internal contracts not covered by BDD tests
         - Confirm the application starts: run `pnpm dev`, confirm it serves on the expected port without errors. If it does not start, fix the startup error before committing — a non-starting application is a Dev failure, not a QA finding

   4.10. Pass the Dev prompt through `@promptmind`. This is a Task delegation — wait for `TASK_RESULT: complete` before proceeding. If the rewriter returns any status other than `complete`, halt and escalate.

   4.11. Take the optimised prompt returned by the rewriter. Append the TASK_RESULT block (defined in SKILL.md § Execution via Task) to the end of the optimised prompt. Delegate the combined prompt via Task to the selected Dev agent.

   4.12. When the Dev Task returns `TASK_RESULT: complete`:
         a. Delegate a Task to run the project test suite.
         b. If tests pass (green): proceed to 4.13.
         c. If tests fail (red): construct a correction prompt that includes the failing test names and error output. Delegate a correction Task back to the Dev agent. Return to step 4.12a (re-run tests). Repeat this loop for a maximum of 3 correction attempts. If tests remain red after 3 attempts, halt and escalate to human.

   4.13. Set `Dev:yes`. Emit the updated SI-N header with the current value of each field.

   --- Security phase ---

   4.14. Construct the Security delegation prompt. Pass through `@promptmind` via Task. Wait for `TASK_RESULT: complete` before proceeding.

   4.15. Take the optimised prompt. Append the TASK_RESULT block. Delegate via Task to the Security agent.

   4.16. When Security returns:
         - If no findings or informational-only findings: proceed to 4.17.
         - If findings require a code fix: apply the **cascade reset rule** — set `Dev:no`, `Sec:no`, `QA:no`, `Review:no`. Emit the updated header. Return to step 4.9 with the security findings as additional context for the Dev prompt. Loop until Security returns with no actionable findings. Maximum 3 Dev↔Security loops; if unresolved after 3, halt and escalate to human.

   4.17. Delegate a Task to post security findings (or "no findings") as a comment on the SI issue.

   4.18. Set `Sec:yes`. Emit the updated SI-N header with the current value of each field.

   --- QA phase ---

   4.19. Construct the QA delegation prompt. The prompt MUST:
         - State explicitly: QA operates independently — do not assume the Dev phase produced correct tests, working code, or a functioning application
         - BLOCKED conditions (return BLOCKED, not MATCH/MISMATCH):
           1. Application does not start: `pnpm dev` fails or does not serve on the expected port
           2. Test suite fails: run `pnpm test` independently — if any test fails, return BLOCKED with failing test names and output
           3. An AC mapped to this SI is not verifiable in the running application: route missing, feature absent, or runtime error when accessing it
           4. If Figma reference exists: the relevant route does not render in the running application, making screenshot capture impossible
         - MISMATCH conditions (application runs but diverges):
           1. Observed behaviour in the running application diverges from what the AC describes
           2. If Figma reference exists: visual implementation diverges from the Figma node — requires screenshot as evidence; a verdict without a screenshot is not valid
         - MATCH condition: all ACs verified in the running application, and if Figma reference exists, screenshot captured and visual implementation conforms
         - If Figma reference exists: include fileKey and nodeId — the QA agent calls `get_screenshot` itself

   4.20. Pass through `@promptmind` via Task. Wait for `TASK_RESULT: complete` before proceeding.

   4.21. Take the optimised prompt. Append the TASK_RESULT block. Delegate via Task to the QA agent. This MUST be a separate Task — not bundled with the Dev or Security delegation.

   4.22. When QA returns:
         - If all verdicts are `MATCH` and all Acceptance Criteria pass: proceed to 4.23.
         - If any verdict is `MISMATCH` or any AC fails: apply the **cascade reset rule** — set `Dev:no`, `Sec:no`, `QA:no`, `Review:no`. Emit the updated header. Return to step 4.9 with the QA failure details (MISMATCH screens, failed ACs) as additional context. Maximum 3 Dev↔QA loops; if unresolved after 3, halt and escalate to human.
         - If QA returns `BLOCKED`: apply the **cascade reset rule** — set `Dev:no`, `Sec:no`, `QA:no`, `Review:no`. Emit the updated header. Return to step 4.9 with the BLOCKED reason (startup error, failing tests, missing route, or screenshot failure) as context. This counts as one Dev correction attempt toward the maximum of 3.

   4.23. Set `QA:yes`. Emit the updated SI-N header with the current value of each field.

   --- Review phase ---

   4.24. Construct the Code Review delegation prompt. Pass through `@promptmind` via Task. Wait for `TASK_RESULT: complete` before proceeding.

   4.25. Take the optimised prompt. Append the TASK_RESULT block. Delegate via Task to the Code Review agent.

   4.26. When Review returns, evaluate the verdict:
        - `APPROVE` or `APPROVE WITH COMMENTS`: proceed to 4.27.
        - `REQUEST CHANGES`: apply the **cascade reset rule** — set `Dev:no`, `Sec:no`, `QA:no`, `Review:no`. Emit the updated header. Return to step 4.9 with the reviewer's change requests as additional context. Maximum 3 Dev↔Review loops; if unresolved after 3, halt and escalate to human.
        - `BLOCKED`: escalate to human immediately. Halt this SI until human unblocks.

   4.27. Set `Review:yes`. Emit the updated SI-N header with the current value of each field.

   --- Augmentation mode gate (Pipeline B only) ---

   4.27a. **This step executes only when operating in Pipeline B (Augmentation mode).** In Pipeline A (Agency mode), skip directly to 4.28.

   Present the complete SI summary to the human:
   - Dev results (test status, files changed)
   - Security findings (posted in 4.17)
   - QA evidence (screenshots, MATCH/MISMATCH verdicts, AC results; including Figma comparison if applicable)
   - Code Review verdict

   Wait for explicit human approval before proceeding. If the human requests changes, apply the **cascade reset rule** and return to step 4.9 with the human's feedback as context.

   --- Commit phase ---

   4.28. **Pre-commit verification.** Confirm the header shows exactly: `Dev:yes Sec:yes QA:yes Review:yes Commit:no`. Check each field individually:
        - If `Dev`, `Sec`, `QA`, or `Review` is not `yes` → a phase was skipped or a loop-back did not complete. Halt and identify the incomplete phase.
        - If `Commit` is already `yes` → this SI has already been committed. Halt — do not double-commit.
        - If `Commit` is `no` and all four preceding fields are `yes` → proceed.

   4.29. **GIT lock check.** Verify GIT:ready. If locked: present a summary of the pending commit to the human and wait for authorisation.

   4.30. Delegate a Task to commit and push. The commit message MUST:
        - Follow Conventional Commits format (e.g., `feat(auth): ...`, `fix(security): ...`)
        - Include `closes #ISSUE_NUMBER` in the body or footer
        - Include the trailer `[AI-assisted: companion]`

   4.31. Delegate a Task to update the SI label: `gh issue edit $ISSUE_NUMBER --remove-label 'status:wip' --add-label 'status:implemented'`

   4.32. Set `Commit:yes`. Emit the SI-N header — all fields must now be `yes`. If any field is not `yes` at this point, halt — a step was completed out of order.

   4.33. Delegate a Task to post implementation evidence on the REQ tracking issue. Evidence MUST include: commit hash, test results summary, security findings summary, QA screenshots, and the signature footer `--- *Posted with AI assistance — companion*`.

   4.34. Notify human: SI number, commit hash, test status (pass/fail with count), security findings (count or "none"), QA verdict (MATCH/MISMATCH summary).

   --- Next SI ---

   4.35. Return to step 4.1 for the next SI in dependency order. The reanchor in 4.1–4.3 is mandatory for every SI — do not skip it even if the files were read for the previous SI.
   4.36. If no more SIs are pending for this REQ: proceed to step 5.

5. Final regression check and code review
   5.1. Read directly (not via Task): `agentic-sdlc.md` and `hard-stops.md`.
   Each file must be read in full — no `limit` parameter, no partial read. A partial read does not satisfy this reanchoring step.
   After all reads complete, emit: `[REANCHOR verified: agentic-sdlc.md N/N, hard-stops.md N/N]` with actual line counts. Both files MUST appear. If any is missing or lines_read < total_lines, halt and re-read before proceeding.
   5.2. Confirm all SIs have label `status:implemented` via `gh issue list --search "REQ-NNN/SI" --json number,labels`.
   If any issue has status other than `implemented`: do not proceed to step 6. Return to step 4 for the next pending issue. The PR gate requires ALL sub-issues to be `status:implemented` before the PR can be opened.
        Delegate a Task to update the REQ tracking issue label: `gh issue edit $TRACKING_ISSUE_NUMBER --remove-label 'req:implementing' --add-label 'req:implemented'`
   5.3. Delegate a Task to run the full project test suite on the complete feature branch.
   5.4. If any test fails: identify the causing issue. Return to step 4 for that issue with regression context. Re-run suite after fix. Loop until green.
   5.5. Construct the final Code Review delegation prompt. Pass through
        `@promptmind` via Task. Wait for `TASK_RESULT: complete`.
        Delegate via Task to the Code Review agent. The prompt MUST:
        - Target the complete diff of the feature branch against the base branch
        - CR operates independently — do not assume Sec or QA found all issues
        - Layer 1 — checklist: run `scripts/check-secrets-history.sh` (BLOCKED if
          FAIL); verify Conventional Commits on all commits; verify branch is not
          `main` or `develop`; verify PR description covers what changed, why, and
          expected impact; for each AC in the linked REQ, verify a corresponding
          test exists in the diff — absent AC coverage is a BLOCKER
        - Layer 2 — interpretive: verify consistency with all accepted ADRs
          governing the affected service; identify any scope creep (functionality
          not covered by any AC in the linked REQ); identify undocumented
          cross-service impact
        - Verdict: APPROVE / APPROVE WITH COMMENTS / REQUEST CHANGES / BLOCKED
   5.6. If APPROVE or APPROVE WITH COMMENTS: present the review to the human. Wait for explicit confirmation before proceeding to step 6.
   5.7. If REQUEST CHANGES: identify affected issues. Return to step 4 for each with correction context. Re-run test suite and code review. Loop until approved.
   5.8. If BLOCKED: present all blockers to the human. Wait for explicit direction per blocker. Do not resolve architectural blockers autonomously.
   5.9. CR iteration tracking: if `code-review.md` has returned REQUEST CHANGES or BLOCKED more than once, send a direct message with: (a) CR call count, (b) unresolved findings, (c) which issues were returned to step 4 and what correction was attempted. Do not halt. Continue the loop.
   5.10. Delegate a Task to post the code review result as a comment on the tracking issue.

6. Open PR
   6.1. Read directly (not via Task): `agentic-sdlc.md` and `hard-stops.md`.
   Each file must be read in full — no `limit` parameter, no partial read. A partial read does not satisfy this reanchoring step.
   After all reads complete, emit: `[REANCHOR verified: agentic-sdlc.md N/N, hard-stops.md N/N]` with actual line counts. Both files MUST appear. If any is missing or lines_read < total_lines, halt and re-read before proceeding.
   6.1a. Emit the PR gate verification:
   ```
   [PR-GATE] SIs implemented: N/M | all:yes/no | proceed:yes/no
   ```
   If `all:no`, do not proceed. Return to step 4 for the next pending SI.
   6.2. Verify GIT:ready. If locked: present the PR summary, state GIT:ready is required, wait for authorisation.
   6.3. Delegate a Task to read `docs/shared/architecture/scm.md` and extract the correct base branch.
   6.4. Security findings report: read the comments on each SI issue to collect all security findings recorded during implementation. If any findings exist:
      a. Classify each finding: severity (LOW/MEDIUM/HIGH), SI affected, status (resolved — with commit hash — or unresolved).
      b. Prepare the findings report body as a formatted table. This report will be posted as a PR comment in step 6.6 — after the PR is created in step 6.5. Store the report body for use in step 6.6.
      c. If any finding is unresolved: delegate a Task to add label `needs-work` to the PR (`gh issue edit $PR_NUMBER --add-label 'needs-work'`).
      d. If all findings are resolved: the comment is informational only. No label added.
   6.5. Pass the PR creation prompt through `@promptmind`. Delegate a Task to open a PR via `gh pr create` with: title `feat: implement REQ-NNN — <REQ title>`; body with all issues, commit hashes, test evidence, screenshots, and tracking issue reference; target branch from SCM rules.
   6.6. When PR is created: if a security findings report was prepared in step 6.4, delegate a Task to post it as a PR comment: `gh pr comment $PR_NUMBER --body "<prepared findings report>"`. Then present the PR URL to the human as a direct message.
   6.7. Delegate a Task to update the tracking issue label: `gh issue edit $TRACKING_ISSUE_NUMBER --add-label 'pr:open'`

7. Final summary and handoff
   7.1. Present complete execution summary: REQ identifier, tracking issue link, sub-issues with status, commit hashes, test evidence, screenshots, design fidelity evidence (if any `implement-issue` call reported it), security findings, code review result, PR link.
   7.2. State explicitly: the human must review and approve the PR; merge the PR; after merge set REQ to `implemented`; after production deploy set REQ to `delivered`; close the tracking issue. The Companion does not perform any of these.

8. Post-merge handoff
   8.1. After PR merge, the human is responsible for: closing all sub-issues, closing the REQ tracking issue, setting REQ status to `implemented`, and after production deploy setting REQ status to `delivered`. The Companion does not perform any of these.

---

## Expected output

1. **Decomposed issues** — GitHub issues created by `decompose-req`, linked to tracking issue.
3. **Implemented code** — all issues implemented via `implement-issue`, tests passing, security addressed.
4. **Regression check** — full project test suite passing on the complete feature branch.
5. **Code review** — final CR approved via `code-review.md`.
6. **PR** — opened via `gh` with full summary, evidence, and tracking references.
7. **Execution summary** — presented to the human with all evidence and next steps.

---

## D4 gate

**Notification hook:**

Before asking the human what to do next:

**REANCHOR — Read directly (not via Task):** `SKILL.md`. This is the only point in the agentic-sdlc workflow where SKILL.md is read — it governs the D4 diligence and the return to the main pipeline.
After the read, emit: `[REANCHOR verified: SKILL.md N/N]` with actual line count.

After step 7, the human owns the remaining lifecycle (PR approval, merge, status transitions, tracking issue closure). Ask the human what they want to do next. Surface options naturally. Do not suggest a default. Wait.

---

## Exceptions

| Condition | Response |
|---|---|
| REQ identifier absent | Halt before step 1; state requirement; wait |
| Tracking issue already exists for this REQ | Read at step 1 via `gh issue view`; present resumed state from labels and comments; ask whether to continue or restart; wait |
| `decompose-req` fails any SDD gate | The sub-workflow handles gate failures internally and halts. This workflow waits for it to return successfully. |
| Dev/Sec/QA/Review loop exceeds 3 iterations on one SI | Escalate to human at step 4; present full failure context including loop count and all previous correction attempts; do not skip the SI; wait |
| Full test suite regression at step 5 | Identify the causing issue; return to step 4 for that issue; re-run suite after fix; loop until green |
| Final code review returns REQUEST CHANGES | Identify affected issues at step 5; return to step 4 for targeted corrections; re-run code review; loop until approved |
| Final code review returns BLOCKED | Present all blockers to human at step 5; wait for explicit decision; do not resolve architectural blockers autonomously |
| GIT locked at step 6 | Present PR creation summary; inform human GIT:ready is required; wait |
| PR creation fails | Report the error; ask human how to proceed; wait |
| GitHub API unavailable | Report at step 1; present what is known from conversation context; wait for connectivity before proceeding |
| Human requests SDLC restart with partial implementation | Warn that restarting will not undo existing commits; ask for explicit confirmation; if confirmed, start from step 3 |
| Session interrupted | On restart: step 1 queries the tracking issue and sub-issues via GitHub API and resumes — primary recovery mechanism |