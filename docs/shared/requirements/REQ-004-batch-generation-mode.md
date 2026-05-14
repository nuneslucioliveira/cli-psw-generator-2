---
id: REQ-004
title: Batch Generation Mode
status: accepted
domain: password-logic
milestone: v2
priority: must
related-adrs:
  - ADR-001
  - ADR-003
  - ADR-004
author:
  - "Agent: Architect"
requires:
  - REQ-001
  - REQ-002
  - REQ-003
---
# REQ-004 — Batch Generation Mode

## 1. Problem Statement

REQ-001 established single-password generation through the `generate_password` function in `core-generator`. REQ-002 bridged user terminal input to that function through CLI flags. Both requirements explicitly list batch generation (producing multiple passwords in a single invocation) as out of scope.

Users who manage multiple systems, service accounts, or bulk credential updates frequently need more than one password per invocation. Repeatedly invoking the tool N times introduces operational overhead, complicates scripting, and increases the total wall-clock time for bulk credential provisioning. This requirement introduces a batch generation mode that produces N independent passwords in a single invocation, where each password independently satisfies all character set constraints and cryptographic security guarantees established in REQ-001 and REQ-003.

The batch generation feature SHALL extend both the core-generator API and the CLI interface while maintaining additive compatibility. Existing single-password behaviour SHALL remain unchanged. The batch contract SHALL be additive: the existing `generate_password` function SHALL NOT be modified, and a new function SHALL be introduced to handle multi-password invocations.

Policy constraints:
- This requirement SHALL NOT modify the `generate_password` function signature or behaviour.
- This requirement SHALL NOT introduce third-party dependencies.
- This requirement SHALL NOT alter the entropy source (secrets module).
- This requirement SHALL NOT change the existing single-password output format or exit code conventions.
- The architectural decision governing whether the batch API uses a dedicated function or iterative delegation SHALL be resolved in ADR-004. This REQ behavioural specification is authored before ADR-004 reaches accepted status to ensure the architectural review has a complete specification to evaluate.

## 2. Functional Requirements

- **REQ-F-004-001**: The core-generator SHALL provide a `generate_batch` function that produces N independent passwords in a single invocation, where N is an integer satisfying 1 ≤ N ≤ 128. Each password in the batch SHALL be generated independently using the same length and character set parameters.

- **REQ-F-004-002**: The core-generator SHALL validate the batch count parameter. The generator SHALL reject any batch count less than 1 or greater than 128 by raising a validation exception. The generator SHALL NOT produce a password output when the batch count is invalid.

- **REQ-F-004-003**: Each password in the batch SHALL conform to the character set constraints of the specified charset identifier. No character SHALL appear in any batch password that is not within the selected character set.

- **REQ-F-004-004**: The batch generation mode SHALL support all six character set identifiers defined in ADR-003: `lower`, `upper`, `numeric`, `mixed`, `special`, and `full`. Each identifier SHALL produce passwords conforming to the character composition defined in ADR-003's registry table.

- **REQ-F-004-005**: Each password in the batch SHALL use the secrets module for character selection. Zero passwords in the batch SHALL use the random module for character selection. Each password SHALL satisfy the cryptographic randomness guarantees defined in REQ-001 AC-007.

- **REQ-F-004-006**: The batch generation algorithm SHALL exhibit linear time complexity O(N) with respect to the batch count. The total generation time SHALL scale proportionally with N, without super-linear amplification (no O(N²) or O(N log N) behaviour).

- **REQ-F-004-007**: The existing single-password generation mode SHALL remain fully operational and produce identical output to pre-REQ-004 behaviour. The `generate_password` function SHALL NOT be modified, and existing CLI behaviour when the `--batch` flag is absent SHALL remain unchanged.

- **REQ-F-004-008**: The CLI SHALL accept a `--batch` flag that receives an integer value representing the desired number of passwords to generate in a single invocation. The CLI SHALL default to single-password mode (batch count of 1) when the `--batch` flag is absent.

- **REQ-F-004-009**: When batch mode is active (N greater than 1), the CLI SHALL write each generated password to standard output on its own line, producing exactly N lines of output. Each line SHALL contain a single password terminated by a newline character, with no labels, prompts, or decorative characters.

- **REQ-F-004-010**: The CLI SHALL render help text for the `--batch` flag documenting the flag name, its accepted integer range (1 to 128), and the default behaviour when omitted. The help text SHALL be auto-generated through the existing argument parser mechanism established in ADR-002.

- **REQ-F-004-011**: The CLI SHALL return exit code 0 when a batch of passwords generates successfully. The CLI SHALL return exit code 1 when the user supplies an invalid batch count, the generator rejects the request, or an unexpected error occurs. The CLI SHALL print a human-readable error message to standard error on failure.

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
| NFR-P-004-001 | Performance — Time behaviour | Per-password generation latency in batch mode | Under 100 milliseconds per password | For batch counts 1 to 128, each individual password generation must not exceed 100ms |
| NFR-P-004-002 | Performance — Time behaviour | Total batch generation latency (N=128) | Under 12.8 seconds | When generating 128 passwords simultaneously, total wall-clock time must remain bounded |
| NFR-P-004-003 | Performance — Scalability | Time complexity profile | Linear O(N) | Generation time SHALL scale proportionally with batch count N, measurable across batch sizes 1, 16, 64, and 128 |

### 3.2 Security

| ID | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
| NFR-S-004-001 | Security — Confidentiality | Cryptographic randomness per password | secrets module only | Every password in the batch SHALL use the secrets module for character selection |
| NFR-S-004-002 | Security — Confidentiality | Password independence | Zero cross-password correlation | No password in the batch SHALL derive any character from another password in the same batch invocation |

### 3.3 Reliability

| ID | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
| NFR-R-004-001 | Reliability — Maturity | Generation failure rate | Zero failures | Under normal operating conditions, all N passwords in a batch SHALL generate successfully when given valid parameters |

### 3.4 Backward Compatibility

| ID | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
| NFR-BC-004-001 | Maintainability — Reusability | Regression in single-password mode | Zero regressions | When the `--batch` flag is absent, output SHALL be identical to pre-REQ-004 behaviour as verified by REQ-001 and REQ-002 acceptance criteria tests |

## 4. Acceptance Criteria

### AC-001 — Batch produces N passwords

**Given** the user supplies `--batch 5` with valid length and charset arguments, **when** the CLI completes execution, **then** standard output SHALL contain exactly 5 passwords, each on its own line, and the process SHALL exit with code 0.

### AC-002 — Each password uses the correct character set

**Given** the user supplies `--batch 3 --charset lower`, **when** the CLI completes execution, **then** every character in all 3 passwords SHALL be a lowercase letter a-z, with no uppercase letters, numerals, or special characters appearing in any password.

### AC-003 — All six character sets work with batch mode

**Given** the user supplies `--batch 2` with each of the six charset identifiers (`lower`, `upper`, `numeric`, `mixed`, `special`, `full`) in separate invocations, **when** each invocation completes, **then** each charset SHALL produce 2 passwords conforming to the character composition defined in ADR-003's registry table.

### AC-004 — Validates batch count bounds

**Given** the user supplies `--batch 0` or `--batch 129` or `--batch -1`, **when** the CLI runs, **then** the CLI SHALL print a human-readable error message to standard error, SHALL exit with a non-zero exit code, and SHALL NOT produce any password output on standard output.

### AC-005 — Each password is cryptographically secure

**Given** the user generates a batch of 10 passwords, **when** the generation process completes, **then** every one of the 10 passwords SHALL have been generated using the secrets module for character selection, and no password SHALL use the random module.

### AC-006 — Linear time complexity O(N)

**Given** the system generates batches of passwords at sizes 1, 16, 64, and 128 with identical length and charset parameters, **when** measuring the total wall-clock generation time for each batch size, **then** the time ratio between consecutive batch sizes SHALL be approximately proportional to the count ratio, confirming linear O(N) scaling without super-linear growth.

### AC-007 — Backward compatible with single-password mode

**Given** the user runs the CLI with valid arguments but without the `--batch` flag, **when** the CLI completes execution, **then** the output SHALL contain exactly one password on a single line, the exit code SHALL be 0, and the behaviour SHALL be identical to the pre-REQ-004 single-password mode as verified by REQ-001 and REQ-002 acceptance criteria.

### AC-008 — Batch count default is single password

**Given** the user runs the CLI without the `--batch` flag but with valid `--length` and `--charset` arguments, **when** the CLI completes execution, **then** the effective batch count SHALL be 1, producing a single password output identical to invoking `--batch 1` explicitly.

### AC-009 — Each batch password is independently random

**Given** the user generates a batch of 100 passwords with identical length and charset parameters, **when** the output is analyzed, **then** each password in the batch SHALL differ from every other password, confirming independent generation without cross-password derivation or reuse.

### AC-010 — Batch output format is one password per line

**Given** the user supplies `--batch 4` with valid arguments, **when** the CLI completes execution, **then** standard output SHALL contain exactly 4 lines, each line containing exactly one password terminated by a newline character, with no empty lines, labels, numbering, or decorative characters.

### AC-011 — Help text documents the batch flag

**Given** the user invokes the CLI with the help option, **when** the CLI renders help text, **then** the help text SHALL document the `--batch` flag name, its accepted integer range (1 to 128), and the default single-password behaviour when the flag is omitted.

### AC-012 — Invalid batch count surfaces as user-friendly error

**Given** the user supplies `--batch abc` (non-integer value), **when** the CLI runs, **then** the CLI SHALL print a human-readable error message to standard error, SHALL exit with a non-zero exit code, and the error message SHALL contain no stack traces, internal exception class names, or implementation paths.

## 5. Out of Scope

This requirement does not cover:

- Variable-length batch generation (each password in a batch with a different length parameter)
- Per-password charset selection (each password in a batch with a different character set)
- Password exclusion rules within batch mode (character exclusion is a separate concern)
- Batch output to file (file writing is outside current scope)
- Password entropy reporting or strength scoring for batch output
- Batch generation with progress indicators or verbose status output
- Clipboard integration for batch passwords
- Password history deduplication across batch invocations
- Streaming or lazy evaluation of large batches
- Multi-threaded or parallel batch generation (O(N) constraint does not require parallelism; sequential generation is within scope)

## 6. Dependencies

| Dependency | Type | Why |
| --- | --- | --- |
| REQ-001 | Internal, blocking | Defines the core generator API (`generate_password`), character set constraints, uniform distribution invariant, length bounds [1, 128], and cryptographic randomness source. Batch mode extends this contract additively. |
| REQ-002 | Internal, blocking | Defines the CLI interface contract: argparse framework, stdout/stderr routing, exit code conventions, and error message mapping. The `--batch` flag extends this contract without modifying existing flag behaviour. |
| REQ-003 | Internal, blocking | Defines the six character set identifiers (`lower`, `upper`, `numeric`, `mixed`, `special`, `full`) and their character compositions. Batch mode must support all six identifiers, each conforming to ADR-003's registry. |

## 7. Notes

### 7.1 ADR-004 Reference

This requirement references ADR-004 (Batch Generation Contract) as a related-adr in the frontmatter. ADR-004 addresses the architectural decision of whether the core-generator batch API introduces a dedicated `generate_batch` function or delegates through iterative `generate_password` calls. This behavioural specification is authored before ADR-004 reaches accepted status to ensure the architectural review has a complete specification to evaluate. The `@architect` role SHALL author ADR-004 separately; this REQ documents the what, and ADR-004 documents the how.

### 7.2 Domain Classification

This requirement is classified under the `password-logic` domain because the primary new capability (batch generation algorithm, `generate_batch` function, batch count validation) resides in the core-generator service. The CLI flag (`--batch`) and output formatting extension are secondary concerns that extend the cli-interface service through the existing delegation pattern established in ADR-002. The cli-arguments index SHALL document this cross-domain relationship through the dependencies section.

## 8. References

- REQ-001 — Password Generation Logic: Defines base character sets, uniform distribution requirement, function contract, length bounds [1, 128], cryptographic randomness, and single-output-per-invocation guarantee.
- REQ-002 — CLI Interface Configuration: Defines argparse framework, flag handling, stdout/stderr routing, exit codes, error message mapping, and help text strategy.
- REQ-003 — Special Characters Set: Defines the six-identifier charset registry and the two new character sets (`special`, `full`) added in v2.
- ADR-001 — Core-Generator API Contract: Governs the function signature rules, exception hierarchy, pure-function constraint, and the additive expansion path documented in Appendix C.
- ADR-002 — CLI Interface Architecture: Governs argparse, POSIX stream routing, exit code conventions (0 for success, 1 for failure), error message mapping, and auto-generated help text.
- ADR-003 — Extended Character Set Contract: Documents the six-identifier charset registry with cardinality, entropy per draw, and the additive expansion decision.
- ADR-004 — Batch Generation Contract: Pending architectural decision. Shall resolve the batch API pattern (dedicated function versus iterative delegation) and document the consequences of the chosen approach.
- ISO/IEC 25010:2011 — Quality attributes referenced: Performance (Time Behaviour, Scalability), Security (Confidentiality), Reliability (Maturity), Maintainability (Reusability).
- RFC 2119 — Keywords SHALL, SHOULD, MAY as used in this document.
