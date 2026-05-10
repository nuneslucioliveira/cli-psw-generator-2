---
id: ADR-002
title: CLI Interface Architecture
status: draft
service: cli-interface
milestone: mvp
date: 2026-05-10
deciders:
  - "Agent: Architect"
related-reqs:
  - REQ-002
impacts:
  - ADR-001
---
# ADR-002: CLI Interface Architecture

## Context and Problem Statement

REQ-002 (CLI Interface Configuration) holds `accepted` status, defining the functional requirements and acceptance criteria for bridging user terminal input to the `core-generator` API contract established in ADR-001. The `core-generator` API is fixed: `generate_password(charset: str, length: int) -> str` with documented exception types (`GeneratorError`, `CharsetNotFoundError`, `InvalidLengthError`). 

The problem is structural: the `cli-interface` service must translate human command-line intent — flags, positional arguments, and terminal I/O conventions — into machine-oriented function calls against the `core-generator` contract. That translation layer requires concrete architectural decisions across five areas: argument parser selection, standard I/O routing, exit code conventions, error message mapping, and help text strategy. These choices determine whether the CLI interface remains testable, POSIX-compliant, and maintainable throughout the MVP milestone.

The quality attributes under consideration are Usability (ISO 25010 Subcategory: Operability) and Portability (ISO 25010 Subcategory: Adaptability), driven by NFR-U-001 and NFR-PT-001 respectively in REQ-002.

## Considered Options

### Decision Area 1 — Argument Parser Framework

| Criterion | `argparse` (stdlib) | `click` (third-party) | `typer` (third-party) |
| --- | --- | --- | --- |
| Stdlib-only compliance | Satisfied | Violated | Violated |
| Automatic `--help` generation | Built-in | Built-in | Built-in |
| POSIX compatibility | Native | Via Python runtime | Via Python runtime |
| Dependency management overhead | None | pip / lockfile / virtualenv required | pip / lockfile / virtualenv required |
| API verbosity | Moderate — explicit `add_argument` calls | Low — fluent decorator syntax | Low — decorator syntax |
| Error formatting customization | Manual | Built-in style hooks | Built-in style hooks |
| Maintenance burden | Zero — ships with Python | Package updates, vulnerability surface | Package updates, vulnerability surface |

1. **`argparse` (stdlib)** — Use Python's standard library argument parser with explicit `add_argument` declarations for `--length`, `--charset`, and built-in `--help`.
2. **`click` (third-party)** — Use decorated functions for argument parsing with automatic help generation and styled error output.
3. **`typer` (third-party)** — Use type-annotated decorated functions with automatic validation and help generation.

### Decision Area 2 — I/O Patterns for Output Formatting

| Pattern | Password Output (stdout) | Error Output (stderr) | Help Output (stdout) | Trailing Newline |
| --- | --- | --- | --- | --- |
| **Option A: Strict POSIX Streams** | Bare string + `\n` | Mapped error message + `\n` | Automatic via parser | Yes, always |
| **Option B: Buffered Composite** | Formatted string with label prefix | Raw exception text | Hard-coded string | Conditional |
| **Option C: Dual-mode (verbose/silent)** | Bare string in silent; JSON in verbose | Mapped or structured error | Automatic | Variable |

All three options satisfy REQ-F-011 (bare password on stdout) and REQ-F-010 (errors on stderr). Option A enforces the simplest stream contract. Option B violates REQ-F-011's "no labels or decorative characters" constraint. Option C introduces a feature flag not in REQ-002 scope.

### Decision Area 3 — Exit Code Conventions

| Option | Success | Invalid Args | Generator Error | Interrupt | Rationale |
| --- | --- | --- | --- | --- | --- |
| **A: Minimal (0 / 1)** | 0 | 1 | 1 | 1 | Single error code covers all failure modes; POSIX convention for shell scripts |
| **B: Distinguished (0 / 1 / 2)** | 0 | 1 | 2 | 1 | Distinguishes user input errors from generator failures |
| **C: POSIX-sys/nerr (0 / 1 / 64–78)** | 0 | 64 (USAGE) | 70 (SOFTWARE) | 130 | Full POSIX `sysexits.h` mapping |

Option B adds implementation complexity to map exception types to distinct codes without proportional user benefit in an MVP CLI tool. Option C is over-engineered for a single-command-line utility. Option A satisfies REQ-F-009 (non-zero exit on any error) with minimal complexity.

### Decision Area 4 — Error Message Mapping

The ground truth for exception types comes from ADR-001's API contract. Each exception type from `core-generator` SHALL be mapped to exactly one human-readable message:

| Exception Type | Human-Readable Message | Stderr Format |
| --- | --- | --- |
| `CharsetNotFoundError` | `Invalid character set: '<value>'. Use one of: lower, upper, numeric, mixed.` | Single line + newline |
| `InvalidLengthError` | `Invalid password length: <value>. Length must be between 1 and 128.` | Single line + newline |
| `GeneratorError` (base catch-all) | `Password generation failed. Check arguments and try again.` | Single line + newline |
| `argparse` validation error | Delegated to `argparse` built-in error handling | `argparse` prints to stderr automatically |
| `KeyboardInterrupt` | Empty message (silent) | Process terminates with `sys.exit(130)` |

This mapping is exhaustive: two documented `core-generator` exceptions, one base-class safety net, one framework-native handler, and one signal handler. No exception type SHALL pass unmapped, satisfying REQ-F-010.

### Decision Area 5 — Help Text Strategy

| Option | Maintenance | Clarity | Customizability | REQ-002 Alignment |
| --- | --- | --- | --- | --- |
| **A: argparse auto-generation with per-flag `help` strings** | Low — help evolves with `add_argument` declarations | High — consistent formatting across flags | Moderate — `help` parameter per argument | Satisfies REQ-F-008 and AC-011 |
| **B: Hard-coded help block** | High — manual sync required when flags change | Variable — depends on author discipline | High — full control | Satisfies REQ-F-008 partially |
| **C: External help file** | High — file management overhead | Moderate — requires I/O at runtime | High — editable without code changes | Satisfies REQ-F-008 but violates stdlib simplicity |

Option A generates help automatically from the same source of truth as argument definitions, eliminating drift between help text and actual behavior.

## Decision Outcome

Chosen option: **"argparse (stdlib) with strict POSIX stream routing, minimal exit codes, exhaustive error mapping, and auto-generated help"**, because it is the only combination that satisfies the stdlib-only constraint while delivering full POSIX compliance, zero dependency overhead, and exhaustive testability for every REQ-002 acceptance criterion.

The `cli-interface` service SHALL adopt the following decisions for each area:

**Decision 1 — Argument Parser:** `argparse` from the Python standard library SHALL be used as the sole argument parsing framework. Each CLI flag (`--length`, `--charset`) SHALL be declared via `add_argument` with explicit `type`, `default`, `choices`, and `help` parameters. This resolves REQ-F-006, REQ-F-007, REQ-F-008, and REQ-F-009.

**Decision 2 — I/O Streams:** The generated password SHALL be written to standard output as a bare string terminated by a single newline character. All error messages SHALL be written to standard error and terminated by a single newline character. Help text SHALL use `argparse`'s built-in `--help` rendering to standard output. This resolves REQ-F-011 and REQ-F-010.

**Decision 3 — Exit Codes:** The CLI SHALL return exit code 0 on successful password generation and exit code 1 on any failure condition (invalid arguments, generator rejection, or unexpected error). This resolves REQ-F-009.

**Decision 4 — Error Message Mapping:** The `cli-interface` SHALL catch each `core-generator` exception type and map it to the human-readable message defined in Decision Area 4 above. All mapped messages SHALL be written to standard error without stack traces, exception class names, or implementation paths. `KeyboardInterrupt` SHALL result in a silent exit with code 130. This resolves REQ-F-010.

**Decision 5 — Help Text:** The CLI SHALL use `argparse`'s automatic `--help` generation enhanced with descriptive `help` strings on each `add_argument` call. The program-level `description` parameter SHALL state the tool purpose and default behavior. This resolves REQ-F-008.

### Consequences

#### Data Flow Diagram

```mermaid
componentDiagram
    direction TB

    package cli-interface {
        [CLI Parser] -- parses flags -- [Parsed Args]
        [Parsed Args] -- forwards charset, length -- [Core-Generator Call]
        [Core-Generator Call] -- returns password -- [stdout: bare string + newline]
    }

    package core-generator {
        [generate_password] -- validates -- [Result or Exception]
    }

    [CLI Parser] -- depends on -- [generate_password]

    package error-flow {
        [Exception Caught] -- maps to human message -- [stderr: error + newline]
        [stderr output] -- sets exit code -- [sys.exit(1)]
    }

    [generate_password] -- raises -- [Exception Caught]
```

Good, because stdlib compliance eliminates all dependency management overhead. No virtual environment bootstrapping, lockfile synchronization, or transitive vulnerability scanning is required, reducing operational surface area to zero for the CLI interface.

Good, because automatic `--help` generation from `argparse` declarations ensures help text can never drift from actual argument definitions. The same `add_argument` call that defines a flag also defines its help string, default, type, and valid choices — a single source of truth, resolving REQ-F-008 and AC-011 with no additional maintenance.

Good, because explicit exception mapping to human-readable messages enforces the service boundary principle: `core-generator` communicates through a type-safe contract, and `cli-interface` is the sole authority on what the user sees. Stack traces and internal class names never leak, satisfying REQ-F-010 and AC-014.

Good, because POSIX stream routing (stdout for success output, stderr for errors) enables standard shell piping and redirection conventions. A user can pipe the password output to another command without capturing error messages, and vice versa. This satisfies REQ-F-011 and AC-013.

Bad, because `argparse` requires more boilerplate than `click` or `typer` for equivalent flag definitions — each flag requires an explicit `add_argument` call with named parameters rather than a concise decorator. — mitigated/acceptable: the MVP has only two flags (`--length`, `--charset`), so the verbosity cost is bounded and negligible. The codebase remains readable and the explicit declarations improve IDE auto-completion.

Bad, because exit code 1 is overloaded across all error types, preventing shell scripts from distinguishing user input errors from generator failures. — mitigated/acceptable: the MVP CLI tool serves interactive terminal usage, not scripted pipelines. Distinguished exit codes can be introduced in v2 if integration use cases emerge. AC-008, AC-010, and AC-012 are satisfied with this minimal scheme.

Bad, because error messages are static strings rather than dynamically formatted from `argparse`'s built-in validation. — mitigated/acceptable: all `argparse` validation errors (invalid types, missing values) already route to stderr automatically via the framework. The `core-generator` exceptions use explicit, user-friendly mappings defined in Decision 4 above. Both paths are covered.

Neutral, because the minimal exit code scheme (0 / 1) is consistent with how most POSIX single-purpose utilities behave (e.g., `wc`, `tr`, `date`), making the tool familiar to experienced terminal users without requiring documentation of exit codes.

Neutral, because help text quality depends on the clarity of `help` strings authored during implementation. This shifts a writing burden to the `@coder` agent during Gate D4 execution. The REQ-002 AC-011 acceptance criterion will validate help text completeness at test time.

## Sources

- [Python Documentation: argparse](https://docs.python.org/3/library/argparse.html) — Confirms `--help` is generated automatically and error messages route to stderr by default.
- [POSIX.1-2017: Utility Conventions](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html) — Confirms stdout for normal output, stderr for diagnostics, exit code 0 for success and non-zero for failure.
- [Python Enhancement Proposal 343 (System Exit Codes)](https://peps.python.org/pep-0343/) — Confirms `sys.exit(1)` is the Pythonic convention for general failure.
- [ISO/IEC 25010:2011 System and Software Quality Models](https://www.iso.org/standard/66450.html) — Quality attributes referenced: Usability (Operability), Portability (Adaptability).

## Non-Functional Requirements Compliance

| NFR ID | Attribute (ISO 25010) | This Decision's Impact | Satisfied? | Notes |
| --- | --- | --- | --- | --- |
| NFR-U-001 | Usability (Operability) | `argparse` built-in `--help` renders instantly from in-memory argument definitions; no file I/O or external calls required | Yes | Help text renders well within 500ms target; actual latency is sub-millisecond for two flags |
| NFR-PT-001 | Portability (Adaptability) | `argparse` is part of Python stdlib shipped on all supported platforms (Unix, Linux, macOS); no platform-specific branches required | Yes | POSIX stream routing (stdout/stderr) is universal across all target platforms |

## Implementation Notes

This ADR defines architectural boundaries and flow patterns. The following constraints apply during implementation:

- The `cli-interface` module SHALL import `generate_password` from `core-generator` exclusively. No direct imports of `core-generator`'s exception modules are required — catching the base `GeneratorError` class is sufficient, with type dispatch to specific subclasses for message precision.
- The `argparse` `ArgumentParser` instance SHALL be configured at module level or within a `get_parser()` factory function. This supports pytest integration through `ArgumentParser.parse_args()` with explicit test arguments.
- `KeyboardInterrupt` handling SHALL use Python's default signal behavior followed by `sys.exit(130)`, matching Unix convention for user-initiated interruption (SIGINT).
- All help strings SHALL document the flag name, value type, accepted range/values, and default behavior, as required by AC-011.
