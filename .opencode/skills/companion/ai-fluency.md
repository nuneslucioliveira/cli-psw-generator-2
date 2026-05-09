# AI Fluency Framework — Operational Reference
## §1 — Three Collaboration Modes
| Mode | What it means | When to suggest it |
|---|---|---|
| **Automation** | AI executes a well-defined task with clear inputs and outputs. Human reviews the result. | Task has defined acceptance criteria, a known template, or a checklist. Little ambiguity. |
| **Augmentation** | Human and AI think together as partners before and during execution. | Task involves architectural decisions, creative judgment, ambiguous scope, or significant consequences. |
| **Agency** | AI is configured with a behavioural pattern and operates more autonomously within it. | Recurring task type where a pattern has been established. |
### Mode signals in the SDD context
| What the human says or implies | Suggested mode | Reasoning |
|---|---|---|
| "Create an ADR for X" | Augmentation | ADR authoring involves architectural trade-off decisions that require the human's domain judgment |
| "Write a REQ for X" | Augmentation | Problem statement, scope decisions, and AC writing require product judgment |
| "Implement task X / write the code for REQ-F-NNN" | Automation or Agency | Task has defined ACs — can be delegated with clear instructions |
| "Review this PR / check if this ADR is correct" | Automation | Checklist-based, result is binary pass/fail |
| "We need to decide how to approach X" | Augmentation | Ambiguity signals the need for partnership before action |
| "Whenever I need to review a REQ, I want you to..." | Agency | Recurring pattern — configure once, reuse |
| "Fix this typo / update this status" | Automation | Minimal judgment required, clear scope |
---
## §2 — The 4Ds as a Conversation Pipeline
### D1 — Delegation: Strategy of Work Division
Before acting, establish who does what and why. Questions that represent this concept:
- What exactly are we trying to accomplish? What does success look like?
- Which parts of this task require exclusively human judgment?
- Which parts are purely operational and can be delegated?
**In Automation:** Quick — confirm the task is well-defined. One or two exchanges.
**In Augmentation:** Richer — surface what the human knows and doesn't know.
**In Agency:** Structural — define the boundaries of autonomy.
---
### D2 — Description: Building a Thinking Environment
Three pillars, each a conversation turn:
**Product — the "What":**
- What exactly needs to be created?
- Who will use or read this? What do they need from it?
- What format, length, or structure is appropriate?
- What are the hard constraints?
**Process — the "How":**
- Is there a specific order or structure the agent should follow?
- Are there data sources, references, or prior context it should use?
- Should it reason step by step before concluding, or work from examples?
**Performance — the "Behaviour":**
- Does the human want the agent to challenge their assumptions or follow their lead?
- Should the agent explain its reasoning or just deliver the result?
- What level of detail is appropriate?
**In Automation:** Companion drafts all three pillars directly and presents the prompt for quick validation.
**In Augmentation:** Companion works through each pillar with the human in genuine conversation.
**In Agency:** Companion works through D2 with the agent via a calibration invocation.
---
### D3 — Discernment: Quality Control and Alignment
**Moment 1 — Before execution (prompt validation):**
Present the optimised prompt: "This prompt represents what we discussed — does it capture what you want done?"
- Human corrects → identify which D2 pillar was misunderstood, return to that specific point.
- Human approves → execute via Task.
**Moment 2 — After execution (result evaluation):**
**Product discernment:** Is the content factually correct? Does it resolve the actual problem?
**Process discernment:** Did the agent follow the logical path? Did it shortcut in a way that hides a problem?
**Performance discernment:** Was the collaboration efficient? Is there something in D2 to calibrate?
---
### D4 — Diligence: Responsibility and Ethics
Three sub-dimensions:
**Creation diligence:**
- Is the system being used appropriate for this content?
- Are there sensitive data or proprietary information in the context?
**Transparency diligence:**
- Who needs to know that AI was involved in producing this?
- Is the level of AI involvement visible to those who will use or approve this?
**Deployment diligence:**
- Have all facts and references been verified?
- Is the human prepared to take full responsibility for this output?
---
## §3 — Discernment Failure Actions
| What failed | Return to | Focus of the return |
|---|---|---|
| Product — content is wrong or misses the point | D2 Product | Redefine what needs to be created and for whom |
| Product — format or structure is wrong | D2 Product | Redefine constraints and format |
| Process — agent skipped steps or reasoned poorly | D2 Process | Redefine how the agent should approach the task |
| Process — wrong data or references used | D2 Process | Redefine the sources and context to use |
| Performance — tone is wrong | D2 Performance | Redefine the behavioural contract |
| Performance — too verbose or too sparse | D2 Performance | Redefine the level of detail expected |
| Prompt validation failed — misunderstood intent | D2 (specific pillar) | Address only the misunderstood part |
---
## §4 — Irreplaceable Human Responsibilities
| Decision | Why it is irreplaceable |
|---|---|
| Setting `status: accepted` on a REQ | Requires product/business judgment about whether the problem is well-defined |
| Setting `status: accepted` on an ADR | Requires architectural judgment about trade-offs, risks, and long-term consequences |
| Choosing what goes in Out of Scope | Requires understanding of stakeholder expectations and product strategy |
| Filling in `deciders` | Must reflect who actually made the decision and is accountable for it |
| Setting `ux-spec: complete` | Requires the Designer's professional judgment about interaction quality |
| Approving a PR | Requires human accountability for what enters the codebase |
| Deciding which ADRs are needed | Requires architectural knowledge to assess what decisions have systemic consequences |
| Choosing between ADR options | The trade-off analysis is a human judgment call |
---
## §5 — Signals of Collaboration Quality
### Signs the collaboration is working well
- The human's requests become more precise over time
- Delegations produce better results with fewer D3 corrections
- The human engages actively in D3 discernment instead of just approving
- D4 is treated as meaningful, not as a box to check
### Signs the collaboration is drifting
- The human accepts every output without questioning
- Delegations become increasingly generic
- The human re-explains the same context in every session
- D4 is treated as a formality