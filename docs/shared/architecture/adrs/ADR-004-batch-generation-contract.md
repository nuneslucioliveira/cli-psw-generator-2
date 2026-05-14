---
id: ADR-004
title: "Batch Generation Contract"
status: accepted
service: core-generator
milestone: v2
date: 2026-05-13
deciders:
  - "Agent: Architect"
related-reqs:
  - REQ-004
impacts:
  - ADR-001
  - ADR-002
---

# ADR-004: Batch Generation Contract

## Context and Problem Statement

REQ-004 (Batch Generation Mode) is in draft status and introduces the capability for the CLI Password Generator to produce N independent passwords within a single invocation. The current architectural baseline governing the system is:

- ADR-001 (Core-Generator API Contract) defines generate_password as a pure function with explicit type hints, an exception hierarchy rooted in GeneratorError, and an additive expansion framework documented in Appendix C.
- ADR-002 (CLI Interface Architecture) establishes argparse-based flag parsing, strict POSIX stream routing, minimal exit codes, an exhaustive error-mapping table, and the uni-directional delegation pattern from cli-interface to core-generator.
- ADR-003 (Extended Character Set Contract) expanded the charset registry from four to six identifiers through additive expansion, demonstrating a precedent for evolving the core-generator contract without breaking existing behavior.

The architectural problem is: **where shall the batch iteration logic reside?** More precisely, does core-generator introduce a dedicated batch function that handles multi-password generation as a first-class API capability, or does cli-interface manage the iteration by calling generate_password N times within a loop?

This decision determines the service boundary for batch orchestration, the public API surface of core-generator, the test topology for all batch acceptance criteria, and the extensibility path for future batch-related capabilities. It must satisfy the seven functional requirements, four non-functional requirement categories, and twelve acceptance criteria defined in REQ-004 while respecting the invariant that core-generator owns all business logic and cli-interface owns all I/O concerns.

### Quality Attribute Drivers

| Attribute | ISO 25010 Subcategory | Relevance |
| --- | --- | --- |
| Maintainability — Modifiability | Modifiability | The chosen pattern must permit future batch features without re-architecting service boundaries |
| Performance — Time behaviour | Time behaviour | Batch generation must exhibit linear O(N) scaling; the measurement target must be free of I/O noise |
| Security — Confidentiality | Confidentiality | Each password in the batch must be independently generated via the secrets module with zero cross-password derivation |
| Reliability — Maturity | Maturity | The existing single-password contract must remain fully operational with zero regressions |

## Considered Options

1. **Option A — Dedicated generate_batch Function** — Introduce generate_batch as a first-class public function in core-generator, accepting charset, length, and count parameters, returning a list of N independently generated passwords, with batch count validation and a dedicated exception type.
2. **Option B — Iterative Delegation** — Keep the core-generator API unchanged; cli-interface manages iteration by calling generate_password N times within a loop, performing batch count validation locally, and collecting results for multi-line output.

### Option A — Dedicated generate_batch Function

**Description:** A new public function is added to core-generator accepting the same charset and length parameters as generate_password plus a count parameter (integer, range 1 to 128). It validates all three parameters and returns a list of N independently generated passwords. Batch count validation occurs within the function, raising a new InvalidBatchCountError exception when count is outside bounds. The function delegates internally to generate_password for individual password generation.

**Alignment with ADR-001:** This represents an additive expansion of the core-generator public API, consistent with the framework established in ADR-001. The existing generate_password signature and behavior remain entirely unchanged. A new function is introduced alongside it, which ADR-001's additive expansion principle explicitly permits.

**Alignment with ADR-002:** The cli-interface adds a batch flag, parses the count value, and conditionally delegates to generate_batch when count exceeds 1 or to generate_password otherwise. The delegation pattern extends from single-call delegation to conditional delegation. Error mapping extends to handle InvalidBatchCountError using the existing ADR-002 Decision Area 4 pattern.

**Evaluation against service boundary rules:**

- **Service boundary compliance:** High. Batch iteration logic, count validation, list construction, and cross-password independence enforcement reside entirely within core-generator. cli-interface remains a purity-preserving I/O layer responsible only for flag parsing, conditional routing, and stream output.
- **API surface expansion:** Moderate. One new function and one new exception type are added. The Literal type annotation for charset requires no modification (already six values per ADR-003).
- **Test topology:** High fidelity. Batch logic is testable in isolation via unit tests against generate_batch. Each batch acceptance criterion maps cleanly to either a happy-path assertion or an exception assertion without requiring CLI integration scaffolding.
- **Future extensibility:** High. Batch-level capabilities — deduplication, entropy aggregation reporting, streaming output for large batches — extend naturally from a dedicated batch function. The architectural anchor already exists.
- **Performance measurement:** Clean. O(N) scaling benchmarks wrap generate_batch directly, eliminating stdout I/O overhead from timing measurements.

### Option B — Iterative Delegation

**Description:** The core-generator API remains entirely unchanged. cli-interface adds a batch flag and, when the parsed count exceeds 1, loops N times calling generate_password with the same charset and length parameters, collecting results and writing each to stdout. Batch count validation (bounds checking 1 to 128) occurs in cli-interface before the loop begins.

**Alignment with ADR-001:** No modification to core-generator's public contract. generate_password is reused N times per invocation. No new public functions or exception types are introduced.

**Alignment with ADR-002:** The delegation pattern extends to include optional iteration. cli-interface gains responsibility for deciding how many times to call the generator, collecting results, and formatting multi-line output. Batch count validation and iteration control are introduced as new business logic within the I/O layer.

**Evaluation against service boundary rules:**

- **Service boundary compliance:** Low. cli-interface gains significant business logic responsibility: deciding iteration count, performing batch count validation, collecting results, and managing multi-line output formatting. This introduces a structural violation of the invariant that core-generator owns all business logic and cli-interface owns only I/O concerns.
- **API surface expansion:** None. This is the primary advantage — zero modifications to core-generator's public contract.
- **Test topology:** Reduced fidelity. Batch-specific behavior (count validation, multi-line output correctness, iteration count verification) must be exercised through cli-interface integration tests, which conflate parser behavior with generation behavior and are harder to isolate than pure-function unit tests.
- **Future extensibility:** Low. Future batch features require further expansion of cli-interface business logic, compounding the original boundary violation. Each new batch concern introduces additional logic into what should be an I/O-only layer.
- **Performance measurement:** Noisy. O(N) scaling benchmarks require end-to-end CLI invocation that conflates generation time with argument parsing, stdout writes, and shell overhead.

### Causal Trace Against All Acceptance Criteria

| AC | Option A Effect | Option B Effect |
| --- | --- | --- |
| AC-001 (N passwords produced) | generate_batch returns a list of length N — single assertion point, deterministic | cli-interface loop produces N stdout lines — verified via output line counting, requires stdout capture |
| AC-002 (charset correctness) | Each password generated via generate_password internally — validated by existing charset coverage inherited through delegation | Same delegation mechanism, but verification requires end-to-end cli test with character validation per line |
| AC-003 (all six charsets) | generate_batch accepts charset with six-identifier Literal — inherits ADR-003 coverage directly | cli-interface passes charset through — same path, verified end-to-end |
| AC-004 (batch count bounds) | Validated within generate_batch, raises InvalidBatchCountError — pure unit test, no I/O involved | Validated in cli-interface — requires argparse integration test with bounds checking |
| AC-005 (cryptographic source) | Internal delegation to generate_password guarantees secrets module usage — inherits AC coverage structurally | Same path, but verification requires mocking secrets module in integration test or end-to-end analysis |
| AC-006 (O(N) complexity) | Benchmark wraps generate_batch directly — clean measurement, no I/O noise, high fidelity | Benchmark measures full CLI invocation — conflates generation time with output formatting, lower fidelity |
| AC-007 (backward compat) | generate_password unchanged — direct structural guarantee of zero regressions | Single-password path unchanged — direct satisfaction, equivalent guarantee |
| AC-008 (default to 1) | cli-interface calls generate_password when batch absent — unchanged path, zero overhead | cli-interface loops with count 1 — equivalent behavior but introduces unnecessary iteration overhead |
| AC-009 (independence) | Each call to generate_password is stateless and independent — inherits REQ-001 guarantees structurally | Same mechanism, verified via end-to-end test with deduplication checks |
| AC-010 (one per line) | cli-interface iterates the returned list and prints each entry — straightforward I/O operation | cli-interface prints per-iteration — same I/O path, equivalent result |
| AC-011 (help text) | argparse add_argument for batch flag — identical to Option B, no differentiation | Identical to Option A |
| AC-012 (user-friendly error) | InvalidBatchCountError mapped in cli-interface error handler — same pattern as ADR-002 Decision 4 | argparse validation plus custom range check — same pattern, equivalent result |

### Key Differentiators

The causal trace reveals that both options satisfy all twelve acceptance criteria behaviorally. The differentiators are structural, not behavioral:

1. **Service boundary compliance** is the primary differentiator. Option A preserves the core business logic within core-generator; Option B leaks batch orchestration logic into cli-interface.
2. **Test fidelity** is the secondary differentiator. Option A enables pure-function unit testing of batch logic; Option B requires end-to-end integration testing for batch-specific behavior.
3. **Future extensibility** is the tertiary differentiator. Option A provides an architectural anchor for additional batch features; Option B shifts future batch logic into cli-interface, compounding the boundary violation iteratively.

## Decision Outcome

Chosen option: **"Option A — Dedicated generate_batch Function"**, because it preserves the service boundary invariant that core-generator owns all business logic and cli-interface owns all I/O concerns, enabling batch-specific validation, deterministic unit testing, and future extensibility without polluting the CLI layer with orchestrational logic.

The core-generator service SHALL introduce a new public function accepting charset, length, and count parameters and returning a list of N independently generated passwords. The function SHALL:

- Accept charset mapped to any of the six identifiers defined in ADR-003.
- Accept length within the bounds established in ADR-001.
- Accept count within bounds 1 to 128.
- Validate all three parameters before generation begins.
- Raise existing CharsetNotFoundError and InvalidLengthError for charset and length violations respectively.
- Raise a new InvalidBatchCountError for count violations.
- Return a list containing N independently generated passwords.
- Internally delegate to generate_password for individual password generation.

The existing generate_password function SHALL NOT be modified in signature, behavior, or exception handling.

The cli-interface service SHALL:

- Add a batch flag via argparse with integer type, a default of None, and an explicit bounds check within the valid range.
- When the batch flag is absent, delegate to generate_password (preserving backward compatibility per AC-007 and AC-008).
- When the batch flag is present, delegate to generate_batch with the parsed count.
- Extend the error mapping table per ADR-002 Decision Area 4 to include InvalidBatchCountError.
- Iterate the returned list and write each password to stdout on its own line.

### Consequences

**Data flow — batch generation path:**

```mermaid
componentDiagram
    direction TB

    package cli-interface {
        [CLI Parser] -- parses flags -- [Parsed Args]
        [Parsed Args] -- conditionally routes -- [Dispatch Logic]
        [Dispatch Logic] -- batch absent -- [generate_password call]
        [Dispatch Logic] -- batch present -- [generate_batch call]
        [generate_password call] -- returns str -- [stdout: single line]
        [generate_batch call] -- returns list -- [Iterate and Write]
        [Iterate and Write] -- N passwords -- [stdout: N lines]
    }

    package core-generator {
        [generate_password] -- validates -- [Result or Exception]
        [generate_batch] -- validates count -- [Loop: N calls to generate_password]
        [Loop] -- collects results -- [list of N strings]
    }

    [CLI Parser] -- depends on -- [generate_password]
    [CLI Parser] -- depends on -- [generate_batch]

    package error-flow {
        [Exception Caught] -- maps to human message -- [stderr: error + newline]
        [InvalidBatchCountError] -- maps to batch error -- [stderr: error + newline]
    }

    [generate_password] -- raises -- [Exception Caught]
    [generate_batch] -- raises -- [InvalidBatchCountError]
```

Good, because the service boundary invariant is preserved. All batch logic — iteration, count validation, list construction, and cross-password independence — resides within core-generator. cli-interface remains a pure I/O layer: it parses flags, calls the appropriate core-generator function, and routes output to the correct stream. No business logic leaks into the CLI layer, satisfying the fundamental architecture principle defined in AGENTS.md and enforced through ADR-001 and ADR-002.

Good, because batch logic is testable in isolation. generate_batch is a pure function: given identical inputs, it produces a deterministic output structure — a list of N strings with specified length from the specified charset. This enables precise unit tests for each batch acceptance criterion without requiring CLI integration scaffolding. AC-001 through AC-006 each map to a clean unit test against generate_batch. AC-004 (bounds validation) maps directly to an InvalidBatchCountError assertion.

Good, because the O(N) performance benchmark has a clean measurement target. NFR-P-004-002 and NFR-P-004-003 require measuring batch generation latency across sizes 1, 16, 64, and 128. With a dedicated function, the benchmark wraps generate_batch directly, eliminating stdout write overhead from timing measurements. Option B would conflate generation time with I/O formatting overhead, reducing measurement fidelity and introducing nondeterminism from operating system scheduling.

Good, because future batch features extend naturally. Deduplication, batch-level entropy aggregation, and streaming output for large batches all require batch-aware logic. A dedicated generate_batch function provides the architectural anchor for these extensions without requiring cli-interface boundary violations. Option B would need progressive expansion of cli-interface business logic for each new batch feature, compounding the original boundary cost with each iteration.

Good, because backward compatibility is structurally guaranteed. generate_password remains unchanged. The cli-interface conditional delegation ensures the default path exercises the exact same code path as pre-REQ-004. This directly satisfies NFR-BC-004-001 and AC-007 with zero regression risk in single-password mode.

Bad, because the core-generator public API surface expands. A new function and a new exception type are added to core-generator's public interface. This increases the module's exported surface area and creates an additional import dependency for cli-interface. — mitigated/acceptable: ADR-001's additive expansion framework explicitly permits new functions alongside existing ones. The new function does not modify generate_password and introduces no breaking changes. The exception hierarchy extends naturally by subclassing the existing GeneratorError base class, and the new exception maps to an existing error messaging path in cli-interface.

Bad, because the batch function introduces internal delegation complexity. generate_batch must internally call generate_password N times, manage result collection, and handle both existing exception types and the new batch count exception. The function has two distinct failure modes — individual password generation failures via existing exceptions and batch count failures via the new exception — requiring careful exception handling discipline. — mitigated/acceptable: The internal delegation is deterministic and sequential. The function validates count first, then delegates to generate_password in a loop. The existing exception types propagate naturally without additional wrapping. The implementation is bounded and auditable.

Bad, because ADR-001's documentation requires updating. ADR-001 Appendix A documents the core-generator public API contract and must be extended to include generate_batch in the Input/Output Contract table. ADR-001 Appendix C must be updated to note that batch generation is now available. — mitigated/acceptable: ADR-003 established the precedent of additive ADR documentation updates (ADR-001 was updated when charsets expanded from four to six). The update scope is bounded to one additional function signature and one additional exception type in existing appendix tables. The @operator agent executes this update as part of the same PR.

Bad, because the cli-interface error mapping table requires a new entry. ADR-002 Decision Area 4 defines an exhaustive mapping from core-generator exceptions to human-readable messages. A new entry for InvalidBatchCountError must be added. — mitigated/acceptable: This follows the exact same pattern established by ADR-003's impact on ADR-002 (the CharsetNotFoundError message was extended to list six identifiers instead of four). The addition is additive and mechanically straightforward, requiring no changes to the error routing mechanism or exit code conventions.

Neutral, because batch validation bounds mirror single-password length bounds. The batch count range 1 to 128 matches the length bounds established in ADR-001. This alignment provides a consistent mental model for users and reduces cognitive load. The upper bound is sufficient for all identified use cases without requiring dynamic memory allocation concerns at scale.

Neutral, because generate_batch is a composition rather than an original algorithm. The function does not introduce a novel generation algorithm — it composes N calls to generate_password. This means the cryptographic security guarantees of individual passwords (AC-005, NFR-S-004-001) are inherited rather than re-established. The independence guarantee (NFR-S-004-002) follows from the sequential nature of the calls and the stateless design of generate_password.

Neutral, because the function adds a conditional delegation path in cli-interface. When the batch flag is absent, cli-interface calls generate_password. When the batch flag is present, it calls generate_batch. The conditional delegation introduces a branching path in the CLI orchestrator. — This is minimal overhead (a single conditional check on the parsed batch value) and the existing ADR-002 delegation pattern accommodates this extension naturally.

### Implementation Notes

This ADR defines the structural contract for batch generation. The following constraints apply during implementation:

- generate_batch SHALL be a pure function with no terminal I/O, no global state mutation, and no side effects other than returning the list result.
- The function SHALL validate count before any password generation begins. An invalid count SHALL raise InvalidBatchCountError and SHALL NOT produce partial results.
- The function SHALL internally delegate to generate_password for individual password generation, leveraging the existing validation logic for charset and length.
- cli-interface SHALL implement conditional delegation: route to generate_password when the batch flag is absent, route to generate_batch when the batch flag is present.
- The return type annotation SHALL use the standard list type annotation for a collection of strings.
- InvalidBatchCountError SHALL subclass GeneratorError and include the invalid value and valid range in its message.
- The cli-interface error mapping SHALL extend ADR-002 Decision Area 4 with a new entry for InvalidBatchCountError.
- The single-password default path must exercise the existing generate_password call path without wrapping it in batch logic.

## Sources

- [ADR-001: Core-Generator API Contract](ADR-001-core-generator-contract.md) — Defines the existing function signature, exception hierarchy, pure-function constraint, and the additive expansion framework that permits new functions alongside generate_password.
- [ADR-002: CLI Interface Architecture](ADR-002-cli-interface-architecture.md) — Defines the delegation pattern, error mapping table, argparse framework, and POSIX stream routing conventions that extend to batch mode.
- [ADR-003: Extended Character Set Contract](ADR-003-extended-character-set-contract.md) — Defines the six-identifier charset registry supporting batch mode and the additive expansion precedent for contract extensions.
- [REQ-004: Batch Generation Mode](../requirements/REQ-004-batch-generation-mode.md) — Defines the twelve acceptance criteria, non-functional requirements, and functional requirements that this ADR supports.
- [Python Standard Library — typing](https://docs.python.org/3/library/typing.html) — Confirms list type annotations are the standard approach for collection return types in typed function signatures.
- [Python Standard Library — secrets module](https://docs.python.org/3/library/secrets.html) — Confirms cryptographically secure random selection is inherited by generate_batch through internal delegation to generate_password.
- [ISO/IEC 25010:2011 System and Software Quality Models](https://www.iso.org/standard-66450.html) — Quality attributes referenced: Performance (Time Behaviour, Scalability), Security (Confidentiality), Reliability (Maturity), Maintainability (Modifiability, Reusability).
- [RFC 2119: Key words for use in RFCs to Indicate Requirement Levels](https://www.rfc-editor.org/rfc/rfc2119.html) — Keywords SHALL, SHOULD, MAY as used in this document.
