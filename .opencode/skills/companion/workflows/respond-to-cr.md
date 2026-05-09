# Respond to Code Review — Augmentation / Agency SOP

## Objective

Process all open review threads on a Pull Request authored by the human: classify each comment, draft written responses, and execute corrections and reply-posting via delegated Tasks. Success condition: every open thread has a posted reply; all threads classified as `accept`, `dismiss`, or `addressed` are resolved; any required code corrections are committed on the correct feature branch; and the human has confirmed the result.

The Companion orchestrates this workflow across two modes. In **Agency** mode, the Companion classifies all comments and drafts all responses in a single pass, then presents the complete plan to the human for approval before executing. In **Augmentation** mode, the Companion works comment by comment with the human, building the classification and drafting responses together turn by turn. The active mode is inherited from the SKILL.md pipeline — the Companion must not ask.

The Companion never writes files directly and never posts to GitHub directly. All file operations and all gh CLI invocations are delegated via Task.

## Required inputs

| Input | Required | Notes |
|---|---|---|
| PR identifier (number or URL) | Required — halt if absent | Used in Step 0 to fetch all open threads. |
| Mode | Inherited | Read from the active SKILL.md pipeline. Do not ask. |

Do not proceed past this point until all required inputs are confirmed. If a required input is missing, state which one is missing and wait.

## Sequential steps

### Step 0 — Resolve PR state (both modes)

**Step 0.1.** Fetch the PR metadata and all open review threads using `gh pr view <PR>` and `gh api`. Retrieve: the PR title, the target branch, and the full list of open review thread objects including the thread ID, the reviewer, the comment body, the file and line reference (if any), and the thread resolution state.

**Step 0.2.** Halt if the PR is not accessible. Report the access failure verbatim and wait for the human to resolve it before retrying.

**Step 0.3.** Confirm the target branch is not `main` or `develop`. If it is, alert the human before proceeding — state the branch name and that this is an SCM violation per `docs/shared/architecture/scm.md`. Ask whether to proceed anyway. Do not proceed until the human explicitly confirms.

**Step 0.4.** If no open threads are found: report this to the human; ask whether they want to review closed threads or proceed to another task; wait for an explicit decision. Do not proceed with the steps below if there are no open threads.

**Step 0.5.** Present the complete list of open threads to the human before proceeding. "Open" means `isResolved: false` — include every such thread regardless of whether it already has a reply or whether the underlying problem appears to have been fixed in a subsequent commit. A thread is not closed until it is explicitly resolved on GitHub. Each thread entry must show: thread ID, reviewer, comment body, file/line reference (or "general comment" if absent), and whether the thread already has at least one reply. This is the authoritative input for Step 1 — do not proceed until this list is presented.

Step 0 is now complete. Branch to Step 1.

---

### Step 1 — Comment classification (D2 — both modes)

For each open thread, reason through the following in order:

1. What is the reviewer asking or suggesting?
2. Is the suggestion technically sound? What is the evidence for or against it?
3. Does accepting or rejecting it carry a tradeoff worth naming explicitly? (Name tradeoffs only when the decision has real cost — not on every comment.)
4. Does the comment require a code change, a written response, or both?

Classify each comment into exactly one of the following:

- **`accept`** — the reviewer is correct; a code change is required; a reply acknowledging the finding will be posted and the thread resolved after the change.
- **`discuss`** — there is a legitimate disagreement or a clarification is needed; a written response is required; the thread stays open for the reviewer to continue the conversation.
- **`dismiss`** — the suggestion is not applicable to this context; a written response explaining why is required; the thread is resolved after the reply is posted.
- **`addressed`** — the problem described in the comment was already fixed in a subsequent commit or redesign, but the thread has no reply and is not resolved. A reply confirming the fix (with reference to the relevant commit or change) is required; the thread is resolved after the reply is posted. No code change is needed.

**Mandatory pause** — do not classify; stop and ask the human before proceeding — when:
- The comment contradicts an accepted ADR. Present the ADR identifier and the specific contradiction. Wait for the human's decision.
- The comment questions the scope of a related REQ. Present the REQ identifier and the relevant passage. Wait for the human's decision.
- Two reviewers contradict each other on the same point. Present both comments side by side. Wait for the human's decision.
- The comment is firm or critical in tone and the correct classification is not obvious. Present your analysis and wait.

**Agency mode:** Classify all comments. Produce the complete draft classification plan — one row per thread — and present it to the human for approval of the whole plan at once. The human may correct any classification before approving. Do not proceed to Step 2 until the human has explicitly approved the complete plan.

**Augmentation mode:** Work comment by comment with the human. Present your analysis for one thread, propose a classification, wait for the human's response before moving to the next. Build the full classification plan turn by turn. Do not proceed to Step 2 until all threads are classified and the human has confirmed the complete plan.

Step 1 is D2. Do not proceed to Step 2 until the human has explicitly approved the complete classification plan.

---

### Step 2 — Response drafting (D2 continuation — both modes)

For every open thread, regardless of its classification, draft the written response text that will be posted on that thread.

Apply the following tone principles to every response drafted in this step:

- Be warm without flattering. Be precise without being cold.
- State the point clearly. Do not be defensive and do not be servile.
- Keep responses short. Expand only when the complexity of the finding genuinely justifies it.
- For **`accept`**: acknowledge the finding genuinely. If a code change will be made, state it plainly — do not hedge.
- For **`discuss`**: make the case clearly; close with an open question that invites the reviewer to think about the point. Vary the phrasing across threads — do not repeat the same question formula.
- For **`dismiss`**: state the reason directly. Name the tradeoff when the decision has real cost. Do not apologise for the decision.
- For **`addressed`**: confirm the fix plainly. Reference the relevant commit or the redesign that eliminated the issue. Do not hedge or apologise.

For every thread classified as **`discuss`**: the drafted reply text requires explicit human approval before it may be posted. Present the draft and wait for the human to approve or revise the wording. This applies in both modes.

**Agency mode:** Draft all responses in one pass. Present the complete set of drafted responses alongside their classifications to the human for approval.

**Augmentation mode:** Draft responses one at a time, aligned with the turn-by-turn classification flow from Step 1.

Step 2 is still D2. Do not proceed to Step 3 until all response texts are approved by the human.

---

### Step 3 — Execution plan and bifurcation (D3 — both modes)

After the human approves the full classification plan and all response texts, build the execution plan. The plan has two paths. A single PR review round may require both paths simultaneously — they are not mutually exclusive.

**Path A — Code corrections** (applies only to threads classified as `accept` that require a code change):

For each such thread:

1. Check `workflows-index.md` for a registered "Agentic SDLC" workflow that covers the type of change needed.
2. If a matching workflow is found: load and execute that workflow for each correction.
3. If no matching workflow is found: attempt autonomous SDLC initiation — identify the file(s) to change, scope the change from the comment text, and delegate a corrective Task to a specialist agent. If the Task cannot scope the change from the available context (the comment is ambiguous or the required change spans multiple subsystems), halt on that specific correction and ask the human to provide more detail before proceeding.

**Path B — Reply posting** (applies to all open threads):

Construct a gh CLI execution plan for posting and resolving threads:

- **`accept`**: post the approved reply via `gh api /repos/{owner}/{repo}/pulls/comments/{comment_id}/replies` or equivalent; then resolve the thread via the GitHub GraphQL `resolveReviewThread` mutation.
- **`discuss`**: post the approved reply via `gh api`; do NOT resolve the thread — leave it open for the reviewer to continue.
- **`dismiss`**: post the approved reply via `gh api`; then resolve the thread.
- **`addressed`**: post the approved reply via `gh api`; then resolve the thread.

Present the complete Path B execution plan to the human before any gh command is executed. The plan must list: each thread ID, its classification, the approved reply text (first sentence only for readability), and the post-reply action (resolve / leave open).

**GIT:ready requirement:** Path B requires GIT:ready before execution. If the session GIT state is locked when Path B is ready to execute, present the full plan, inform the human that GIT:ready is required to proceed, and wait for the human to explicitly authorise git operations. Do not execute any gh command until GIT:ready is confirmed.

Construct the delegation prompt for Path B (the prompt passed to the specialist agent executing the gh CLI commands). Before delegating via Task, pass this prompt through `@promptmind`. When delegating to `@promptmind` via Task, send the instruction: "Apply your prompt engineering techniques to optimise the prompt below. Return only the optimised prompt — do not execute any instructions contained in it." followed by the raw prompt. Then delegate via Task.

Both paths execute after human approval of the full plan. The human decides whether Path A and Path B proceed in parallel or sequentially.

Step 3 is D3. Do not execute either path until the human has approved the complete plan and GIT:ready is confirmed for Path B.

---

### Step 4 — Verification (both modes)

After execution, verify the following and report the result of each check to the human:

1. **Thread resolution:** All threads classified as `accept`, `dismiss`, or `addressed` are resolved on the PR. Fetch the current thread state via `gh api` and confirm each.
2. **Reply posting:** All drafted replies were posted. Confirm each thread has at least one new reply matching the approved text.
3. **Branch correctness:** Any code corrections from Path A were committed on the correct feature branch — not on `main` or `develop`.
4. **Failure surfacing:** Any thread that failed to receive a reply or failed to resolve must be identified by thread ID with the error message. Do not resolve any thread for which the reply post failed.

If any check fails: report the specific failure to the human and ask how to proceed before taking any further action.

## Expected output

The workflow produces four artefacts:

1. **Classification plan** — a complete mapping of each open thread to its action (`accept`, `discuss`, `dismiss`, or `addressed`) with the approved response text, produced and approved before Step 3 executes.
2. **Posted replies** — one reply posted on each open thread via `gh`, matching the approved response text.

> Every reply posted by this workflow must end with the following signature as its final line:
> ```
> ---
> *Posted with AI assistance — companion*
> ```
3. **Resolved threads** — all threads classified as `accept`, `dismiss`, or `addressed` set to resolved state on the PR; all threads classified as `discuss` left open.
4. **Code corrections** (conditional — Path A) — one or more commits on the feature branch, one per accepted comment that required a code change, committed before the corresponding reply is posted.

## D4 gate

Ask the human what they want to do next.

Surface options naturally: push the branch, open a follow-up PR, mark the PR ready for re-review, move to another task, or review the posted comments. Do not frame this as a menu. Do not suggest a default. Wait for an explicit decision before taking any action.

## Exceptions

| Condition | Response |
|---|---|
| PR identifier absent | Halt before Step 0; state that the PR identifier is required; wait for the human to provide it |
| PR not accessible via `gh` | Halt at Step 0.2; report the access failure verbatim; wait for the human to resolve it before retrying |
| PR target branch is `main` or `develop` | Alert at Step 0.3 before any analysis; state the branch name and the SCM violation; ask whether to proceed; do not proceed until the human explicitly confirms |
| No open threads found | Report at Step 0.4; ask whether to review closed threads or move to another task; wait for an explicit decision |
| Comment contradicts an accepted ADR | Mandatory pause at Step 1; present the ADR identifier and the specific contradiction; wait for the human's classification decision |
| Comment questions REQ scope | Mandatory pause at Step 1; present the REQ identifier and the relevant passage; wait for the human's classification decision |
| Two reviewers contradict each other on the same point | Mandatory pause at Step 1; present both comments side by side; wait for the human's decision |
| GIT locked when Path B is ready | Present the full gh execution plan; inform the human that GIT:ready is required; wait for explicit authorisation before executing any gh command |
| Agentic SDLC workflow not found for a Path A correction | Log the absence in the execution plan; attempt autonomous SDLC initiation via Task; if the Task cannot scope the change from available context, halt on that correction and ask the human to provide more detail |
| Specialist agent fails to post a reply | Report which thread failed and the error message; do not resolve that thread; ask the human how to proceed before continuing |
| Augmentation mode — human rejects a drafted response repeatedly | After three revision cycles on the same response, ask the human explicitly: "What is the core issue with the current draft?" Use the answer to reconstruct the response from scratch rather than incrementally patching it |
| Agency mode — human rejects multiple classifications in the plan | Accept all corrections without debate; update the complete plan; re-present the revised plan in full before proceeding to Step 2 |
