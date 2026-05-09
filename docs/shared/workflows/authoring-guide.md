# Authoring Guide: REQs and ADRs

> Step-by-step guidance for creating and validating requirements and architecture decisions with an AI agent.

This guide assumes you have OpenCode or Claude Code running in your terminal. If you haven't set that up yet, see [AI-Assisted Contribution](./ai-assisted.md#setup).

## Who is this for?

| Persona | Creates |
|---------|---------|
| **PM / PO** | REQs — product requirements |
| **Designer** | Figma Make prompts from REQs + UX Spec sections |
| **Software Architect** | ADRs — architecture decisions |
| **Developer** | Either, depending on the task |

---

## Before you start

- Check the next available ID before creating a file. For REQs: scan `requirements/index-<domain>.md`. For ADRs: scan `architecture/adrs/index-<service>.md`.
- New documents always start with `status: draft` (REQs) or `status: proposed` (ADRs). Never start with `accepted`.
- Vocabulary reference and quality attribute taxonomy: [`methodology.md`](../methodology.md).
- Authoring rules: [`requirements/guidelines.md`](../requirements/guidelines.md) and [`architecture/adrs/guidelines.md`](../architecture/adrs/guidelines.md).

---

## Writing a REQ

### Step 1 — Let the agent ask you the questions

Paste this prompt into your AI session. The agent will ask you one question at a time and build the draft as you answer.

```
I need to write a new product requirement. Read docs/shared/requirements/guidelines.md 
and docs/shared/requirements/000-template.md, then ask me the following questions  
one at a time — wait for my answer before moving to the next:

1. What user pain or business need does this solve? (one sentence)
2. What stays broken if we don't solve it? (cost of inaction)
3. What evidence do we have that this is a real problem? 
   (data, tickets, user feedback, observations)
4. What should the system DO? (observable behaviour — no library or 
   technology names)
5. What is explicitly out of scope? (behavioural descoping only — 
   not implementation choices)
6. Do other REQs need to be completed before this one? 
   If yes, which ones?
7. Are there non-functional constraints? If yes, name the 
   ISO 25010 subcategory (e.g. Time Behaviour, Accessibility, 
   Confidentiality). If no, skip.

After my last answer, create the REQ file using the next available 
REQ-NNN ID. Flag any field you had to infer — I will confirm before 
we finalise.
```

> The agent will generate a complete draft. You review and correct — do not fill a blank form.

### Step 2 — Validate before submitting a PR

Once the draft looks right, run this validation prompt:

```
Review my REQ draft against requirements/guidelines.md. Check:

- All mandatory frontmatter fields present and valid 
  (id, title, status, domain, milestone, priority, author)
- No TBD, TO-DO, or [to be defined] remaining in the body
- Every REQ-F-NNN has at least one corresponding AC-NNN
- NFRs (if present) name an ISO 25010 subcategory and use the 
  five-column table format (ID | Quality Attribute | Metric | Target | Condition)
- Out of Scope contains only behavioural descoping decisions — 
  no implementation choices (library names, deployment details)
- Dependencies section lists only REQs and external systems — 
  no ADRs (those go in related-adrs frontmatter)
- Policy constraints on the solution appear in Problem Statement, 
  not scattered across functional requirements
- REQ appears in the correct index-<domain>.md
- No two FRs describe the same behaviour from opposite angles (positive vs. negative
  constraint on the same condition) — they should be one FR with a sub-rule
- No NFR redescribes what the system does — it must add a measurable quality target
  to a behaviour already described by a FR
- No NFR repeats a policy constraint already stated in the Problem Statement

List each issue as [BLOCKER] or [RECOMMENDATION] with the specific fix.
```

### Step 3 — Update the index

```
Add this REQ to the correct index file. The domain is [domain]. 
Use the format: | [REQ-NNN](filename.md) | Title | status | priority | milestone |
```

---

## Writing an ADR

### Step 1 — Let the agent ask you the questions

```
I need to write a new architecture decision record. Read 
architecture/adrs/guidelines.md and architecture/adrs/000-template.md, 
then ask me the following questions one at a time — wait for my answer 
before moving to the next:

1. What decision needs to be made and why now?
2. Does this decision address a specific quality concern? 
   If yes, which ISO 25010 subcategory? (e.g. Time Behaviour, 
   Resource Utilisation, Confidentiality)
3. Does this decision affect a specific architectural layer?
   If yes, which one: Computational (interfaces/contracts), 
   Engineering (infrastructure/distribution), or Technology 
   (concrete library or platform choice)?
4. What options did you consider? (minimum two — one sentence each, 
   including the option you rejected)
5. Which option did you choose and why?
6. What are the trade-offs? For each downside: what is the 
   mitigation or acceptance statement?

After my last answer, create the ADR file using the next available 
ADR-NNN ID and the correct service value. Flag anything you had to infer.
```

> The agent will generate a complete draft. You review and correct.

### Step 2 — Validate before submitting a PR

```
Review my ADR draft against architecture/adrs/guidelines.md. Check:

- All mandatory frontmatter fields present and valid 
  (id, title, status, service, date, deciders)
- No TBD, TO-DO, or [to be defined] remaining in the body
- H1 heading format is # ADR-NNN: Title (colon, not em-dash)
- At least two options listed in Considered Options
- Chosen option appears in the Considered Options list
- Every "Bad, because" entry has an explicit mitigation or 
  acceptance statement
- If the decision imposes a specific code pattern or has a known 
  naive-implementation failure mode: Implementation Notes section present
- deciders field reflects actual decision-makers (not template default)
- ADR appears in the correct index-<service>.md

List each issue as [BLOCKER] or [RECOMMENDATION] with the specific fix.
```

### Step 3 — Update the index

```
Add this ADR to the correct index file. The service is [service]. 
Use the format: | [ADR-NNN](NNN-filename.md) | Title | status |
```

---

## Generating a Figma Make Prompt (Designer)

Use this when you have a REQ (or any requirements document) and want to start
UI exploration in Figma Make.

### Step 1 — Generate the TC-EBC prompt

Open your AI session in the repository and run:

```
Convert the REQ at [path/to/REQ-NNN.md] into a Figma Make TC-EBC prompt.
```

The agent uses the `req-to-figma-make` skill
to extract and structure the prompt. If the REQ has a `## UX Intent` section,
the agent prioritizes that content for the best results.

> **Verify the skill was used:** The output should contain exactly five labelled
> fields — **Task**, **Context**, **Elements**, **Behavior**, and **Constraints** —
> followed by a note suggesting to paste into Figma Make. If the output is
> free-form prose without these five fields, the skill was not triggered. Run the
> prompt again explicitly referencing the skill:
> ```
> Use the req-to-figma-make skill to convert [path/to/REQ-NNN.md] into a TC-EBC prompt.
> ```

### Step 2 — Paste into Figma Make

Copy the generated prompt and paste it directly into Figma Make.

**Tips:**
- Attach your design system library (Make Kit) before prompting for on-brand output.
- Use Claude Sonnet in Figma Make for best results with layered, contextual prompts.
- Iterate from the first draft — revision prompts refine details faster than restarting.

### Step 3 — Complete the UX Spec

After your Figma Make exploration, fill in the `## UX Spec` section of the REQ
with your interaction decisions. You have full autonomy over this section.
When done, open a PR.

---

## What the AI agent will never do for you

| Task | Why it stays with you |
|------|----------------------|
| Set `status: accepted` on a REQ | Requires product/business approval — not a formatting decision |
| Set `status: accepted` on an ADR | Requires architectural validation — not a formatting decision |
| Fill in `deciders` | Must reflect who actually made the decision |
| Decide what goes in Out of Scope | Requires deliberate product judgment about stakeholder expectations |
| Choose between ADR options | The trade-off analysis is yours — the agent documents it |
| Approve a PR | Human approval always required per [`architecture/scm.md`](../architecture/scm.md) |