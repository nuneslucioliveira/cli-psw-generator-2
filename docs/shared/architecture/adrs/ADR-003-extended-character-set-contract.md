---
id: ADR-003
title: "Extended Character Set Contract"
status: accepted
service: core-generator
milestone: v2
date: "2026-05-11"
deciders:
  - "Agent: Architect"
related-reqs:
  - REQ-003
impacts:
  - ADR-001
  - ADR-002
---

# ADR-003: Extended Character Set Contract

## Context and Problem Statement

The `core-generator` service currently maintains a character set registry of four identifiers as defined in ADR-001: `"lower"` (lowercase letters a–z), `"upper"` (uppercase letters A–Z), `"numeric"` (digits 0–9), and `"mixed"` (the union of lowercase, uppercase, and numeric). The existing API contract enforces a pure-function signature of `generate_password(charset: str, length: int) -> str` with input validation via `CharsetNotFoundError`.

REQ-003 (Special Characters Set) introduces production password policy requirements mandating special character support and a full charset combining all available character classes. The core-generator character set registry must expand from four identifiers to six identifiers — adding `"special"` (32 ASCII printable punctuation characters) and `"full"` (94 characters: the union of all alphanumeric classes and special characters) — while preserving backward compatibility with existing contracts.

The problem is one of additive expansion of a stable API surface: new charset identifiers must be integrated without modifying the `generate_password` function signature, without altering existing charset behaviour, without introducing stateful configuration, and without disrupting existing test coverage. This expansion directly supports the V2 milestone's security objectives while maintaining the ISO 25010 Usability and Maintainability quality attributes established in ADR-001.

The key quality attributes under consideration are:
- **Security (ISO 25010 — Confidentiality)**: Extended charsets increase per-character entropy from approximately 5.95 bits (mixed, 62 characters) to approximately 6.55 bits (full, 94 characters).
- **Maintainability (ISO 25010 — Modifiability)**: The additive expansion approach minimises regression risk by preserving existing function semantics.
- **Portability (ISO 25010 — Conformity)**: All new characters remain within ASCII printable range, ensuring cross-platform compatibility without Unicode or locale-dependent symbols.

## Considered Options

1. **Option A — Additive Contract Expansion** — Add `"special"` and `"full"` as new charset identifiers to the existing registry without modifying the `generate_password` function signature, parameter types, or internal generation logic.
2. **Option B — Modify Generation Logic** — Extend the `generate_password` function to accept a special-charset boolean parameter alongside the existing `charset` parameter, embedding special character logic within the existing charsets.
3. **Option C — Separate Function** — Create a distinct `generate_special_password` function to handle special character generation, leaving the original four charsets unchanged in the existing `generate_password` function.

**Evaluation of Option B (Rejected):** Modifying the generation logic introduces a new parameter to the function signature, violating the pure-function contract of immutability and explicit type safety established in ADR-001. Coupling special character behaviour to an existing charset parameter creates conditional logic paths that obscure the function's deterministic input–output mapping. This option increases cognitive complexity by conflating charset identity with feature flags, making the function harder to test and reason about.

**Evaluation of Option C (Rejected):** Creating a separate function fragments the API surface into two distinct interfaces, increasing coupling between `cli-interface` and `core-generator`. The caller would need to inspect password requirements and dispatch to the appropriate function, which introduces branching logic outside the core-generator's responsibility. This option also duplicates validation logic (length bounds, exception hierarchy) across two functions, violating the DRY principle.

**Evaluation of Option A (Selected):** Additive expansion adds new charset identifiers to the existing registry, requiring zero modifications to the function signature, parameter types, or internal generation logic. The `Literal` type annotation expands from four to six identifiers. Existing code using `"lower"`, `"upper"`, `"numeric"`, or `"mixed"` continues to produce identical behaviour. The uniform random selection mechanism via `secrets` module operates identically across all charsets — the registry simply has a larger lookup table. This approach is consistent with the forward-compatibility path already documented in ADR-001 Appendix C.

## Decision Outcome

Chosen option: **"Option A — Additive Contract Expansion"**, because it expands the charset registry to six identifiers while preserving full backward compatibility, modifying no function signatures, disturbing no existing test coverage, and requiring zero changes to the internal pure-function generation logic.

The `core-generator` service SHALL extend its character set registry with two new identifiers:

1. **`"special"`** — 32 ASCII printable punctuation characters, as enumerated in REQ-003 §8 Character Set Inventory Table. Selectable via the existing `charset` parameter of the `generate_password` function.
2. **`"full"`** — 94 characters representing the union of lowercase (26), uppercase (26), numeric (10), and special (32). Selectable via the existing `charset` parameter of the `generate_password` function.

The character set registry SHALL now accept the following six identifiers:

| Identifier | Characters | Cardinality | Entropy per Draw |
| --- | --- | --- | --- |
| `"lower"` | a–z | 26 | ≈ 4.70 bits |
| `"upper"` | A–Z | 26 | ≈ 4.70 bits |
| `"numeric"` | 0–9 | 10 | ≈ 3.32 bits |
| `"mixed"` | a–z, A–Z, 0–9 | 62 | ≈ 5.95 bits |
| `"special"` | 32 ASCII printable punctuation | 32 | ≈ 4.00 bits |
| `"full"` | All alphanumeric + special | 94 | ≈ 6.55 bits |

The existing four identifiers — `"lower"`, `"upper"`, `"numeric"`, `"mixed"` — SHALL remain unchanged in their character composition and behaviour. No existing charset SHALL include special characters as a consequence of this decision.

The `"special"` charset SHALL consist exclusively of the 32 ASCII printable punctuation characters defined in REQ-003.

The `"full"` charset SHALL be the union of lowercase (a–z), uppercase (A–Z), numeric (0–9), and special (32 characters), totalling 94 unique characters.

The uniform distribution invariant established in ADR-001 SHALL continue to apply: the secrets module SHALL select from any charset with equal probability across all available characters in the selected set. No charset SHALL receive preferential weighting.

### Consequences

#### Good, because the function signature remains unchanged

The `generate_password(charset: str, length: int) -> str` interface requires zero modifications. Pre-V2 code using the original four charset identifiers continues to function identically. The `Literal` type annotation expands from four to six values — a purely additive change that maintains the type-safe contract. Downstream consumers parse new identifiers through the existing delegation path without behavioural ambiguity.

#### Good, because existing test coverage remains fully valid

All acceptance criteria tests derived from REQ-001 — including charset exclusivity (AC-001), mixed-class coverage (AC-005), length bounds enforcement (AC-003, AC-004), cryptographic source validation (AC-007), and uniform distribution (AC-010) — continue to pass without modification. The additive expansion introduces no regressions in existing test behaviour.

#### Good, because the additive approach requires minimal implementation scope

The core-generator modification is limited to the charset registry lookup table. The generation logic, validation rules, exception hierarchy, and entropy mechanics require no alteration. The `@coder` agent implements this decision by updating the internal charset constant and appending new test cases for the two additional identifiers.

#### Good, because the expanded registry enables the entropy targets defined in REQ-003

The full charset provides approximately 6.55 bits per character, exceeding the NFR-S-004 target of 6 bits minimum. A password of length 32 drawn from `"full"` yields approximately 209.6 bits of total entropy — well above the threshold commonly required by enterprise password policies.

#### Good, because the existing four charsets remain isolated from special characters

The `"lower"`, `"upper"`, `"numeric"`, and `"mixed"` identifiers SHALL not include special characters. Users who do not require special characters can continue using the original charsets without ambiguity. This isolation aligns with REQ-003 AC-005 (Backward Compatibility of Existing Charsets).

#### Bad, because the core-generator module's internal charset registry grows in size

The registry doubles from four identifiers to six identifiers, with the total character pool growing from 62 unique characters (in the widest existing set) to 94 unique characters (in the new full set). — mitigated/acceptable: the charset registry is initialized once at module load time as an immutable constant. The memory overhead is approximately 94 ASCII characters, which is negligible relative to Python's runtime overhead. No performance impact is measurable within the NFR-P-001 budget of 100 milliseconds per generation.

#### Bad, because ADR-001's documentation requires updating

ADR-001 Appendix A (Input/Output Contract) documents the four-identifier Literal type annotation. ADR-001 Appendix B (Character Set Mapping) documents the four-charset inventory table. Both appendices must be updated to reflect the six-identifier contract. — mitigated/acceptable: the `@operator` agent updates ADR-001 documentation as part of the same PR that creates ADR-003, per the index file atomic commit rule. This is a bounded documentation change with zero implementation risk.

#### Bad, because ADR-002's error message mapping must extend

ADR-002 Decision Area 4 defines the error message for `CharsetNotFoundError` as listing the four valid identifiers. This message must expand to list six valid identifiers. — mitigated/acceptable: the error message string update is a single-point change in the cli-interface error mapping layer. The message format evolves additively and does not alter the error routing path or exit code conventions.

#### Neutral, because the cli-interface argparse `choices` list must update

The `--charset` argument in `cli-interface` declares exactly the valid charset identifiers via argparse's `choices` parameter. This list expands from four to six values. — This change is mechanically straightforward and follows the same `add_argument` pattern already established. The help text output renders automatically without manual intervention, per ADR-002 Decision 5.

#### Neutral, because the expanded charset alphabet increases password length for equivalent entropy

A password of length 20 drawn from `"mixed"` yields approximately 119 bits of total entropy (20 × 5.95). The same entropy using `"full"` requires approximately 18 characters (18 × 6.55 ≈ 118 bits). — This is an inherent property of the larger search space and does not represent a defect. The existing length bounds [1, 128] remain appropriate. Users seeking maximum entropy per character should use `"full"`; users requiring shorter passwords with equivalent entropy benefit from the higher per-character entropy of `"full"`.

#### Neutral, because the special charset alone has lower per-character entropy than mixed

The `"special"` charset provides 4 bits per character (32 characters), which is less than `"mixed"`'s 5.95 bits. — This is expected and intentional: special characters alone are not designed to maximize entropy in isolation. The `"full"` charset exists for that purpose. Users requiring high entropy with special characters should use `"full"` rather than `"special"`.

## Sources

- [ADR-001: Core-Generator API Contract](ADR-001-core-generator-contract.md) — Defines the existing four-identifier charset registry, function signature, pure-function constraint, exception hierarchy, and the forward-compatibility note stating V2 will add new charset identifiers additively.
- [REQ-003: Special Characters Set](../requirements/REQ-003-special-character-set.md) — Defines the functional requirements for special and full charsets, the 32-character inventory table, and all nine acceptance criteria.
- [Python Standard Library — secrets module](https://docs.python.org/3/library/secrets.html) — Confirms cryptographically secure random selection is available for any iterable, including the expanded charset registry.
- [Python Standard Library — string.punctuation](https://docs.python.org/3/library/string.html#string.punctuation) — Defines the 32-character ASCII printable punctuation string used as the source of truth for the `"special"` charset.
- [ISO/IEC 25010:2011 System and Software Quality Models](https://www.iso.org/standard-66450.html) — Quality attributes referenced: Security (Confidentiality), Maintainability (Modifiability), Portability (Conformity).
- [RFC 2119: Key words for use in RFCs to Indicate Requirement Levels](https://www.rfc-editor.org/rfc/rfc2119.html) — Keywords SHALL, SHOULD, MAY as used in this document.

## Implementation Notes

This ADR defines the structural expansion of the charset registry. The following constraints apply during implementation:

- The charset registry SHALL be implemented as an immutable mapping (e.g., a module-level constant), consistent with the pure-function constraint of ADR-001. No runtime mutation of the registry is permitted.
- The `Literal` type annotation for the `charset` parameter SHALL be updated from `Literal["lower", "upper", "numeric", "mixed"]` to `Literal["lower", "upper", "numeric", "mixed", "special", "full"]`. This is the sole type signature modification permitted by this decision.
- The existing four charsets SHALL produce identical output to pre-V2 behaviour. Adding `"special"` and `"full"` SHALL NOT alter `"lower"`, `"upper"`, `"numeric"`, or `"mixed"` in any observable way.
- The `CharsetNotFoundError` exception SHALL list all six valid identifiers in its error message, consistent with the additive update required in ADR-002's error mapping.
- Backward compatibility SHALL be verified by confirming that REQ-001's existing acceptance criteria continue to pass without modification after this decision's implementation.
