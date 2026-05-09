# Prompt Engineering Techniques

Reference catalogue for `promptmind`. Each entry documents the
source paper, the mechanism, and explicit apply/not-apply criteria.

Techniques are grouped by domain alignment. A prompt may require techniques
from multiple sections.

---

## §1 — Structured Reasoning

### Chain-of-Thought (CoT)

**Source:** Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in Large
Language Models", NeurIPS 2022.

**Mechanism:** Instruct the model to produce intermediate reasoning steps
before the final answer. The presence of explicit steps increases accuracy on
multi-step tasks and makes the reasoning auditable.

**Apply when:**
- The prompt requires multiple decisions or inferences before reaching a
  conclusion
- The task has non-trivial intermediate steps (e.g., check X, then decide Y)
- Verifiability of the reasoning chain matters to the user

**Do not apply when:**
- The prompt is a simple factual lookup with no reasoning required
- Token economy is critical and intermediate steps add no value

**Implementation pattern:**
```
Before providing your answer, reason through the following steps:
1. [first inference or check]
2. [second inference or check]
...
Then state your conclusion.
```

---

### FactTrack World-State

**Source:** Laban et al., "FACTTRACK: Time-Aware World State Tracking in Story
Outlines", arXiv:2407.16347, 2024.

**Mechanism:** Before acting on a document or system, the model constructs an
explicit `World-State Data Structure` that maps atomic facts, their validity
intervals, and detected contradictions. Changes to the world-state (new events,
corrections) are processed as updates with directional atomic facts. This
prevents the model from acting on stale or contradictory assumptions.

**Apply when:**
- The prompt audits, reviews, or verifies the state of a document or system
- Facts in the context have temporal validity (e.g., a draft ADR may change
  before the prompt is executed)
- Consistency checking is a core requirement of the task

**Do not apply when:**
- The prompt is creative or generative with no factual ground truth to track
- The context is short and has no internal state to contradict

**Implementation pattern:**
```
Before proceeding, establish a World-State for the document under review:
- Decompose the document into atomic facts
- For each fact, record its validity (current | superseded | unknown)
- Flag any contradictions between facts
- Use this World-State as your reference for all subsequent checks
```

---

### PhysicsArena-Style Decomposition

**Source:** Dai et al., "PhysicsArena: The First Multimodal Physics Reasoning
Benchmark Exploring Variable, Process, and Solution Dimensions",
arXiv:2505.15472, 2025.

**Mechanism:** PhysicsArena evaluates models across three dimensions: (1)
variable identification, (2) physical process formulation, (3) solution
derivation. Applied as a prompting pattern, this decomposition forces explicit
enumeration of entities and their relationships before conclusions are drawn.
It is effective for any domain with causal or relational structure, not only
physics.

**Apply when:**
- The prompt involves causal analysis (if X then Y, because Z)
- The task requires identifying relevant entities or variables before acting
- The reasoning involves process steps that must be formulated before a
  conclusion (e.g., checking a checklist item by item)

**Do not apply when:**
- The problem is purely abstract with no entity relationships
- The task is a single direct instruction with no branching logic

**Implementation pattern:**
```
Approach this task in three phases:
1. Variables — identify all relevant entities, states, or parameters involved
2. Process — formulate the relationships and dependencies between them
3. Conclusion — derive your answer from the process defined above
```

---

## §2 — Persona and Framing

### Role Prompting / Expert Framing

**Source:** Brown et al., "Language Models are Few-Shot Learners" (GPT-3),
NeurIPS 2020. Consolidated in Wei et al. (2022) and subsequent instruction
tuning literature.

**Mechanism:** Assigning a specific expert role to the model activates
domain-specific vocabulary, reasoning patterns, and output norms. The role
should be precise — not just "expert" but "senior software architect
specialising in ADR authoring" — because specificity constrains the response
space toward the intended behaviour.

**Apply when:**
- Precision, authority, or domain-specific norms matter in the response
- The prompt requires the model to apply a specific professional standard
- The output will be reviewed by a domain expert and must meet their
  expectations

**Do not apply when:**
- The prompt is exploratory and open-endedness is more valuable than
  specialisation
- The assigned role would introduce unwanted bias (e.g., assigning a "sales"
  role to a neutral analysis task)

**Implementation pattern:**
```
You are a [specific role with domain and specialisation].
Your task is to [action] according to [standard or framework].
```

---

### EmotionPrompt (EP01–EP11)

**Source:** Li et al., "Large Language Models Understand and Can be Enhanced
by Emotional Stimuli", arXiv:2307.11760, Microsoft Research, 2023.

**Mechanism:** Appending emotional stimuli phrases to prompts improves model
performance on both deterministic and generative tasks (8% improvement on
Instruction Induction, 10.9% on generative tasks in human evaluation). The
paper defines 11 stimulus phrases (EP01–EP11). Select 1–2 phrases; stacking
more than 2 yields diminishing returns.

**The 11 phrases (use verbatim):**

| ID | Phrase |
|----|--------|
| EP01 | Write your answer and give me a confidence score between 0-1 for your answer. |
| EP02 | This is very important to my career. |
| EP03 | You'd better be sure. |
| EP04 | Are you sure? |
| EP05 | Are you sure that's your final answer? It might be worth taking another look. |
| EP06 | Believe in your abilities and strive for excellence. Your hard work will yield remarkable results. |
| EP07 | You are an expert. |
| EP08 | I have no fingers and the truncate keyboard doesn't work. I need you to return the full document. |
| EP09 | I will tip you $200 for a better solution! |
| EP10 | This task is crucial for my health and well-being, it's imperative that I receive the utmost assistance. |
| EP11 | Do your best, and I'll follow up to see how things went. |

**Apply when:**
- The task benefits from higher model engagement or effort
- The output quality is subjective and could be improved by increased attention
- The prompt is for a non-automated, human-facing context

**Do not apply when:**
- The prompt requires strict technical precision where emotional framing
  introduces tonal ambiguity
- The prompt will be used in an automated pipeline where emotional language
  is noise

**Implementation pattern:**
Add 1–2 phrases at the end of the prompt body, after all instructions.

---

## §3 — Emotional and Relational Generation

### ECoT — Emotional Chain-of-Thought

**Source:** Chen et al., "Enhancing Emotional Generation Capability of Large
Language Models via Emotional Chain-of-Thought", arXiv:2401.06836, 2024.

**Mechanism:** ECoT is a plug-and-play prompting method that improves
emotional generation by instructing the model to reason through emotional
context before producing its response. It aligns output with human emotional
intelligence guidelines by making the emotional reasoning explicit as an
intermediate step (analogous to how CoT makes logical reasoning explicit).

**Apply when:**
- The prompt is for a feedback, coaching, support, or onboarding context
- The response needs to be empathetic, constructive, or emotionally calibrated
- The audience is a person in a vulnerable or high-stakes emotional state
- The prompt is hybrid (technical + relational) and the relational dimension
  cannot be sacrificed for neutrality

**Do not apply when:**
- The prompt is a technical audit where emotional framing reduces precision
- The output will be parsed programmatically (emotional language adds noise)
- Neutrality and objectivity are more valuable than empathy in the context

**Implementation pattern:**
```
Before responding, reason through the emotional context:
- What is the person likely feeling in this situation?
- What emotional outcome should this response support?
- How should tone and framing be adjusted to achieve that outcome?
Then compose your response guided by this emotional reasoning.
```

---

## §4 — Cultural and Multilingual Awareness

### Global PIQA Awareness

**Source:** Chang et al., "Global PIQA: Evaluating Physical Commonsense
Reasoning Across 100+ Languages and Cultures", arXiv:2510.24081, 2025.

**Mechanism:** Global PIQA demonstrates that physical commonsense reasoning
varies significantly across languages and cultures — up to a 37% accuracy gap
between high-resource and low-resource language contexts for the same task.
Prompts that assume universal physical behaviour (how objects behave, how
tasks are performed with everyday items) may produce incorrect or
culturally-biased responses for non-Western or non-English audiences.

This is not a prompting technique to apply mechanically. It is a **review
criterion**: before delivering an optimised prompt, check whether it contains
physical commonsense assumptions that are not culturally universal.

**Apply when:**
- The prompt will be executed in a multilingual or cross-cultural context
- The prompt references everyday physical actions (opening, mixing, folding,
  storing, preparing food, navigating spaces)
- The audience includes users from multiple regions with different everyday
  physical norms

**Do not apply when:**
- The prompt is purely abstract, mathematical, or code-focused
- The context is confirmed to be single-language and single-culture

**Review action:**
Mark each culturally non-universal assumption with `[CULTURAL ASSUMPTION]`
inline in the optimised prompt, with a one-line note explaining the variation
risk. Do not remove the assumption — flag it so the prompt author can decide
whether to generalise it.

**Example flag:**
```
Ask the user to seal the container by turning the lid clockwise
[CULTURAL ASSUMPTION: lid-closing direction varies by product standard across
regions — consider specifying "until tight" instead of a direction]
```