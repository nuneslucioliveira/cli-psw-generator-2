---
name: promptmind
description: Rewrites prompts by applying prompt engineering techniques from peer-reviewed research (FactTrack, ECoT, EmotionPrompt, CoT, Role Prompting, Global PIQA awareness). Accepts raw prompt text or a file path. Returns the optimized prompt prefixed with the suggested agent to execute it, or bare when no agent matches.
disable-model-invocation: true
argument-hint: "[prompt text | file-path]"
---

# promptmind

Rewrites a prompt by applying prompt engineering techniques from peer-reviewed
research. Every execution must complete all five steps below in order before
producing any output. Do not skip or merge steps.

Supporting files in this skill directory:
- `techniques.md` — full technique catalogue with apply/not-apply criteria

---

## Step 1 — Input Resolution

If `$ARGUMENTS` is a file path that exists on disk, read its contents using the
Read tool. If `$ARGUMENTS` contains text, treat it as the raw prompt text.

If `$ARGUMENTS` is empty, DO NOT stop or ask the user for input. Instead, immediately extract the `<raw_intent>` and `<context>` from the Orchestrator's prompt provided in the current task/conversation context, and treat that as your input for refinement.

---

## Step 2 — Domain Classification

Classify the prompt into one or more of the following dimensions. A prompt may
belong to multiple dimensions (hybrid).

| Dimension | Indicators |
|---|---|
| `technical` | Audits, reviews, engineering instructions, ADRs, REQs, code, architecture |
| `relational` | Feedback, coaching, emotional support, onboarding, team communication |
| `multilingual` | Cross-cultural audience, multiple languages, regional behaviour assumptions |
| `hybrid` | Two or more dimensions present with roughly equal weight |

Record the classification explicitly — it drives technique selection in Step 4.

---

## Step 3 — FactTrack World-State

Regardless of domain, map the current state of the prompt before rewriting.
This step prevents rewriting from introducing contradictions or losing implicit
intent.

Build a `World-State` block with the following fields:

```
World-State:
  explicit_request:   what the prompt asks for directly
  implicit_intent:    what the author clearly wants but did not write
  missing_elements:   information absent that would improve precision
  contradictions:     internal conflicts or ambiguities found
  validity_note:      any fact in the prompt with limited temporal validity
```

Refer to `techniques.md §1 — FactTrack world-state` for the full specification.

---

## Step 4 — Technique Selection and Rewrite

Open `techniques.md` and select techniques according to the domain classified
in Step 2.

Selection rules:

- `technical` → FactTrack (always), CoT or PhysicsArena-style decomposition,
  Role Prompting / Expert Framing
- `relational` → ECoT (always), EmotionPrompt (select 1–2 phrases), Role
  Prompting if authority helps
- `multilingual` → Global PIQA awareness (always), mark `[CULTURAL ASSUMPTION]`
  on any non-universal physical behaviour assumed in the prompt
- `hybrid` → apply all rules above weighted by the dominant dimension; do not
  drop a technique because it belongs to a secondary dimension

Apply the selected techniques to produce the rewritten prompt. The rewrite must:

1. Preserve the original intent exactly — do not change what is being asked
2. Apply techniques in the body naturally — do not expose framework names like
   "use FactTrack" or "apply EP05" inside the rewritten prompt itself
3. Be self-contained — the rewritten prompt must work without this skill loaded

---

## Step 5 — Agent Discovery and Output

### 5a — Agent Discovery

Use Glob to find all agent definition files:

```
.claude/agents/*.md
.opencode/agents/*.md
```

For each file found, read the `description` field from the YAML frontmatter.
Match agent descriptions against the domain and subject matter of the optimized
prompt. Select the single best semantic match, or none if no agent is clearly suited.

Deduplication: `.claude/agents/` and `.opencode/agents/` contain equivalent
definitions. Prefer the `.claude/agents/` name when both exist.

After finding the best semantic match, verify the agent has the tools required
to execute the optimized prompt. Derive tool requirements from the prompt content:

| Signal in prompt | Required capability |
|---|---|
| create/write/edit a file, add content to a file | write or edit access |
| run commands, execute scripts, install packages | bash access |
| fetch URLs, search the web | webfetch access |
| read, inspect, summarize files only | no restriction — any agent compatible |

Apply these rules conservatively — only when the prompt explicitly or clearly
implies the action. Do not infer tool requirements from domain alone.

**For Claude Code agents** (`.claude/agents/*.md`): read the `tools` field from
the YAML frontmatter. It is an explicit list (e.g. `tools: Read, Write, Glob`).
An absent `tools` field means no tools declared — treat as incompatible with any
write or bash requirement.

**For OpenCode agents** (`.opencode/agents/*.md`): read the `permission` field
from the YAML frontmatter. An explicit `permission: { edit: deny, bash: deny }`
means read-only. An absent `permission` field means capabilities are unknown —
treat as incompatible with any write or bash requirement.

**Decision tree:**

```
semantic match found?
    NO  → skip to fallback persona
    YES → check tool compatibility
            compatible? → suggest @agent-name normally
            not compatible? → reject match → fallback persona
```

**Fallback persona format** (used when match fails tool check or no match exists):

```
## Suggested Agent

No matched agent has the required capabilities ([list missing capabilities]).
Suggested executor: [one-paragraph role description derived from prompt domain,
naming required tools explicitly: Read, Write, Edit, Glob, Bash, or WebFetch
as applicable].
```

The fallback persona has no `@` prefix. It is never a named agent.
Do not ask the human when falling back — produce the persona autonomously.

### 5b — Output Format

Produce output in this exact structure:

```markdown
## Optimized Prompt

@<agent-name> <rewritten prompt here>
```

When no agent matches:

```markdown
## Optimized Prompt

<rewritten prompt here>
```

Then append:

```markdown
## Techniques Applied

| Technique | Source | Why applied |
|-----------|--------|-------------|
| <name>    | <paper or author + year> | <one sentence rationale> |

## Suggested Agent

@<agent-name> — <one-line reason>
```

Or when none:

```markdown
## Suggested Agent

None — <one-line reason explaining why no agent matched>
```

---

## Hard constraints

- Never skip a step. Steps 2, 3, and 4 must complete before Step 5.
- Never expose technique names (FactTrack, ECoT, EP05, etc.) inside the
  rewritten prompt body. Techniques are applied structurally, not labelled.
- Never change the intent of the original prompt during rewrite.
- Never suggest more than one agent. If two agents are equally suited, pick
  the more specialised one.
- The `## Techniques Applied` table is mandatory in every execution.