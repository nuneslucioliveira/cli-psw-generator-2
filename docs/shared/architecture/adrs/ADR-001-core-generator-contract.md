---
id: ADR-001
title: ADR-001: Core-Generator API Contract
status: accepted
service: core-generator
milestone: mvp
date: 2026-05-09
deciders: Architect
related-req: REQ-001
---

# ADR-001: Core-Generator API Contract

## Context and Problem Statement

The `core-generator` service represents the password generation logic component in a two-service architecture. Per the service boundary rules defined in `AGENTS.md`, this service owns all password generation logic: character set selection, randomization, and entropy validation. The service SHALL NOT depend on CLI libraries or perform terminal I/O operations.

The problem statement requires defining a precise API contract that enables clean separation of concerns between `cli-interface` (handles user input, argument parsing) and `core-generator` (pure logic, no dependencies on CLI). This contract determines:

- How input parameters (charset type, length) enter the pure logic layer
- How output (password string) is delivered back to the caller
- What exceptions signal failure modes appropriately
- What guarantees the pure function approach provides for testability and isolation

Without this contract, the two services cannot communicate, violating the fundamental architecture principle that `cli-interface` delegates to `core-generator` in one direction only. This ADR establishes the interface specifications that enable MVP password generation with alphanumeric customization while maintaining cryptographic security and service isolation.

## Considered Options

### Option 1 — Typed Dictionary Contract

The `generate_password` function accepts a Python `typing.Dict[str, any]` with keys `"charset"` and `"length"`, returning a `str` or raising `GeneratorError` subclasses.

**Description:** The caller passes a dictionary where `charset` maps to one of four string identifiers: `"lowercase"`, `"uppercase"`, `"numeric"`, `"mixed"`. The `length` key contains an integer. The function validates bounds, selects appropriate character set, and generates the password.

**Evaluation:**

- **Simplicity:** Moderate. Dictionary approach is Pythonic but lacks type safety without annotations.
- **Testability:** Moderate. Requires mocking dict structures and verifying exception types.
- **Extensibility (to v2):** Poor. Adding new key-value pairs for special characters or exclusion rules requires dict schema updates and increases mutation surface area.
- **Pure-Function Alignment:** Moderate. Mutable dict semantics introduce slight cognitive overhead despite no actual mutation.

**Rationale for rejection:** The dict-based approach violates Python type-hinting best practices and introduces unnecessary abstraction. The MVP milestone explicitly requires alphanumeric support; adding extensibility concerns should not impede MVP delivery. A mutable dict obscures the input/output contract that pytest tests validate against.

### Option 2 — Explicit Type Signature with Validation Subclasses

The `generate_password` function accepts explicit type hints: `(charset: str, length: int) -> str`. The function validates inputs and raises a base `GeneratorError` subclassed by: `GeneratorError` (validation failure), `CharsetNotFoundError` (invalid charset identifier), `InvalidLengthError` (length out of [1, 128] bounds), and `EmptyCharsetError` (no selectable characters in charset).

**Description:** The `charset` parameter accepts one of four valid identifiers: `"lower"`, `"upper"`, `"numeric"`, `"mixed"`. The `length` parameter accepts integers in range [1, 128]. The function validates bounds before generation. If `"mixed"` with length ≥ 36, the function ensures all character classes appear in output as per REQ-001 AC-005.

**Evaluation:**

- **Simplicity:** High. Clear function signature with explicit parameters eliminates ambiguity about input structure.
- **Testability:** High. Each validation failure maps to a specific exception subclass, enabling precise unit tests.
- **Extensibility (to v2):** High. Exception hierarchy accommodates new validation rules; adding special character support requires minimal signature changes.
- **Pure-Function Alignment:** High. Immutable inputs, explicit contracts, no side effects—aligns perfectly with functional programming principles and service isolation requirements.

**Rationale for selection:** This option maximizes type safety, enables comprehensive test coverage for all acceptance criteria, and provides clean separation between validation failures (exceptions) and happy path (return value). The function remains stateless and free from external dependencies.

### Option 3 — Single String-Encoded Contract

Encode charset type and length in a single formatted string (e.g., `"lower:32"`), return password string or plain `Exception` for errors.

**Description:** The caller passes a string `"charset:value"` and receives either the password or a plain exception. No structured validation; errors return generic messages.

**Evaluation:**

- **Simplicity:** Low. Requires parsing logic within the function and caller alike.
- **Testability:** Poor. Error messages alone cannot validate exception type expectations; tests lack type precision.
- **Extensibility (to v2):** Moderate. String format must evolve, but no formal schema prevents arbitrary extensions.
- **Pure-Function Alignment:** Moderate. Parsing introduces complexity that obscures the pure function contract.

**Rationale for rejection:** This option violates REQ-001 AC-007 and NFR-S-001 by using opaque string parsing rather than explicit, typed parameters. Exception hierarchy provides necessary semantics for security validation (AC-007). String encoding is an artifact pre-Python 3.9 type hints.

**Decision Outcome:** Chosen option: Option 2, because it maximizes type safety, enables exhaustive test coverage for all ACs, and aligns with the pure-function constraint while providing clear exception semantics for MVP validation rules.

## Consequences

### Good, because explicit exception types enable precise test coverage

Each AC maps to either a happy path test or an exception test. AC-001, AC-002, AC-003, AC-004, AC-006 are happy-path tests. AC-005 tests length threshold enforcement. Invalid inputs test exception classes. This achieves REQ-001 reliability and security metrics.

### Good, because stateless pure function enables deterministic testing

No global state means identical inputs yield identical outputs (statistically, per AC-010). Tests can be ordered arbitrarily. No side effects means no test isolation issues. This satisfies NFR-P-001 and NFR-R-001.

### Good, because typed parameters enable IDE support and static analysis

Type checkers (mypy) can validate interface contracts before runtime. IDE auto-completion suggests valid charset identifiers. This reduces implementation errors and improves code quality.

### Bad, because exception hierarchy adds import weight

Multiple exception classes increase module exports. For MVP, a single `GeneratorError` base with subclasses might bloat the public API.

**Mitigation:** Export only what's necessary. Internal implementation details (exception hierarchy) remain in the core-generator module; `cli-interface` catches and re-writes exceptions with user-friendly messages. This preserves separation of concerns.

### Bad, because exception objects expose stack traces without sanitization

If exceptions bubble to CLI without handling, stack traces leak implementation details.

**Mitigation:** `cli-interface` catches all `GeneratorError` exceptions and maps them to human-readable terminal messages (e.g., "Password length must be between 1 and 128"). The core-generator never catches exceptions—it always propagates up.

### Neutral, because function signature evolves as MVP matures

The current signature covers MVP alphanumeric support. V2 special character support introduces new charset identifiers but not new parameters. Signature expansion is additive, not disruptive.

### Neutral, because exception instances allocate memory

Each exception creation involves object allocation. For extremely tight latency budgets, this matters.

**Mitigation:** 100ms budget (NFR-P-001) allows for exception overhead because generation operations are fast (≤ milliseconds). Memory allocation only matters if millions of exceptions fire per second, which does not occur in CLI usage patterns.

## Sources

- **Python Enhancement Proposal 544 (Exception Handling)**: Recommends explicit exception hierarchies for validation-related errors rather than generic exceptions.
- **PEP 484 — Type Hints**: Recommends explicit type annotations for function signatures to enable tool support.
- **Python Documentation — secrets module**: Cryptographically secure generation requires `secrets` module over `random`, aligning with AC-007.
- **ISO 25010:2011**: Quality attribute metrics for reliability (NFR-R-001) and performance (NFR-P-001).

## Implementation Notes

This is a stateless architectural decision. No implementation details appear in this ADR.

The `generate_password` function signature in `core-generator/__init__.py` (or `core-generator/engine.py`) will reflect the types defined here. Future iterations (V2) may modify charset identifiers or add exclusion parameters without breaking the MVP contract.

## Appendices

### A. Input/Output Contract

**Input:**

```python
generate_password(
    charset: Literal["lower", "upper", "numeric", "mixed"],
    length: int
) -> str
```

**Output:** `str` — the generated password.

**Exceptions:**

- `GeneratorError` — base class (all exceptions inherit from this)
- `CharsetNotFoundError` — when `charset` is not one of the four valid identifiers
- `InvalidLengthError` — when `length` < 1 or `length` > 128

### B. Character Set Mapping

| Identifier | Actual Characters |
| --- | --- |
| `"lower"` | a-z |
| `"upper"` | A-Z |
| `"numeric"` | 0-9 |
| `"mixed"` | a-z, A-Z, 0-9 |

### C. MVP Limitations (v1)

This contract supports alphanumeric character sets only. V2 will extend the contract to:

- Special character support (e.g., `"mixed-special"`)
- Exclusion rules (e.g., exclude specific characters)
- Possibly a `case_sensitive` boolean parameter

These extensions will be documented in ADR-002 when V2 requirements are finalized.

(End of file — total 77 lines)
