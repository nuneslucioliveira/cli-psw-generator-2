---
id: REQ-002
title: CLI Interface Configuration
status: accepted
domain: cli-arguments
milestone: mvp
priority: must
author:
  - "Agent: Architect"
related-adrs:
  - ADR-001
requires:
  - REQ-001
---
# REQ-002 — CLI Interface Configuration

## 1. Problem Statement

The core generator defined in REQ-001 produces passwords through a pure function, but users currently have no standardised way to supply generation parameters through the terminal. The CLI interface SHALL bridge user intent to the core-generator API contract, translating command-line flags into validated function arguments. The CLI SHALL accept at minimum a password length and a character-set identifier, forward those values to the generator, and return the generated password to standard output. The CLI SHALL NOT contain password generation logic. The CLI SHALL NOT depend on external user input mechanisms beyond standard command-line arguments.

## 2. Functional Requirements

- **REQ-F-006**: The CLI SHALL accept a `--length` flag that receives an integer value representing the desired password length. The CLI SHALL treat the value 16 as the default length when the user omits the flag.

- **REQ-F-007**: The CLI SHALL accept a `--charset` flag that receives a string value representing the desired character set. The CLI SHALL restrict valid values to `lower`, `upper`, `numeric`, and `mixed`. The CLI SHALL treat `mixed` as the default character set when the user omits the flag.

- **REQ-F-008**: The CLI SHALL render help text for each supported flag that documents the flag name, its accepted value range, and its default value.

- **REQ-F-009**: The CLI SHALL return exit code 0 when a password generates successfully. The CLI SHALL return a non-zero exit code when the user supplies invalid input, the generator rejects the request, or an unexpected error occurs.

- **REQ-F-010**: The CLI SHALL translate core-generator exceptions into human-readable error messages. The CLI SHALL print the error message to standard error. The CLI SHALL display the message without leaking implementation details, stack traces, or internal exception types.

- **REQ-F-011**: The CLI SHALL write the generated password to standard output. The CLI SHALL output the password as a single unadorned string without labels, prompts, or decorative characters. The CLI SHALL terminate the output with a single newline character.

## 3. Non-Functional Requirements

### 3.1 Usability

| ID | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
| NFR-U-001 | Usability (Operability) | Help text render latency | Under 500 milliseconds | When the user invokes the help option |

### 3.2 Portability

| ID | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
| NFR-PT-001 | Portability (Adaptability) | Platform support | Unix, Linux, macOS | When invoked with Python 3.x standard library |

## 4. Acceptance Criteria

### AC-006 — Valid length flag produces correct output

**Given** the user supplies `--length 24`, **when** the CLI runs and invokes the generator, **then** the generator receives length 24 and the output password is exactly 24 characters in length.

### AC-007 — Default length applies when flag omitted

**Given** the user runs the CLI without the `--length` flag, **when** the CLI invokes the generator, **then** the generator receives length 16 and the output password is exactly 16 characters in length.

### AC-008 — Invalid length triggers error and non-zero exit

**Given** the user supplies `--length 0` or `--length 200` or `--length abc`, **when** the CLI runs, **then** the CLI prints a human-readable error message to standard error, the CLI exits with a non-zero exit code, and no password appears on standard output.

### AC-009 — Valid charset flag produces correct output

**Given** the user supplies `--charset lower`, **when** the CLI runs and invokes the generator, **then** the generator receives `lower` as the character set and every character in the output belongs to the lowercase alphabet a-z.

### AC-010 — Invalid charset triggers error and non-zero exit

**Given** the user supplies `--charset symbol` or `--charset Mixed`, **when** the CLI runs, **then** the CLI prints a human-readable error message to standard error, the CLI exits with a non-zero exit code, and no password appears on standard output.

### AC-011 — Help text displays flag definitions

**Given** the user invokes the CLI with the help option, **when** the CLI renders help, **then** the help text documents the `--length` flag name, its accepted integer range, its default value, the `--charset` flag name, its accepted values, and its default value.

### AC-012 — Successful generation exits with code 0

**Given** the user supplies valid arguments, **when** the CLI completes generation and prints the password, **then** the process terminates with exit code 0.

### AC-013 — Output contains bare password only

**Given** the CLI completes a successful generation, **when** the command finishes and standard output is captured, **then** standard output contains exactly the generated password followed by a single newline, with no labels, prompts, or decorative characters preceding or trailing the password.

### AC-014 — Generator exceptions surface as user-friendly messages

**Given** the core generator raises an exception in response to the CLI request, **when** the CLI receives the exception, **then** the CLI prints a human-readable error message to standard error and the message contains no stack traces, internal exception class names, or implementation paths.

## 5. Out of Scope

This requirement does not cover:

- Special character support beyond alphanumeric character sets
- Character exclusion rules for specific characters or ranges
- Batch generation producing multiple passwords simultaneously
- Configuration file persistence for user preferences
- Interactive prompts or confirmation dialogs
- Password entropy calculation or strength indicators
- Colour coding or styled terminal output
- Input redirection from external files

## 6. Dependencies

| Dependency | Type | Why |
| --- | --- | --- |
| REQ-001 | Internal, blocking | Provides the core generator API the CLI delegates to for password generation |
