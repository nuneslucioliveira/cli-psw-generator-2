---
id: REQ-003
title: Special Characters Set
status: accepted
domain: password-logic
milestone: v2
priority: must
related-adrs:
  - ADR-001
  - ADR-002
requires:
  - REQ-001
  - REQ-002
author:
  - "Agent: Architect"
---

# REQ-003 — Special Characters Set

## 1. Problem Statement

REQ-001 established the core-generator character sets as lowercase (a-z), uppercase (A-Z), numeric (0-9), and mixed alphanumeric. Production password policies commonly mandate inclusion of special characters to increase entropy and resist dictionary attacks. This requirement extends the generator engine with a dedicated special character set and a full charset combining all available character classes.

The special character set SHALL consist of ASCII printable punctuation characters, selected to maximize entropy while remaining compatible with the broadest possible policy landscape. The full charset SHALL represent the union of all four alphanumeric character classes and the special character class. Unicode characters, extended ASCII, and locale-dependent symbols SHALL be excluded to guarantee standard library compliance and deterministic behaviour.

The core-generator service boundary SHALL remain intact: all new character sets SHALL be internal to core-generator, requiring zero changes to CLI argument parsing structure. The generator function signature SHALL expand additively by introducing new charset identifiers while preserving backward compatibility with existing four-identifier contracts.

Policy constraints:
- This requirement SHALL NOT introduce third-party dependencies.
- This requirement SHALL NOT alter the existing charset identifiers or their behaviour.
- This requirement SHALL NOT modify the entropy source (secrets module).

## 2. Functional Requirements

- **REQ-F-001**: The generator engine SHALL maintain a new special character set containing the 32 ASCII printable punctuation characters defined in the character set inventory table, selectable via the charset identifier `"special"`.

- **REQ-F-002**: The generator engine SHALL maintain a new full character set representing the union of lowercase (a-z), uppercase (A-Z), numeric (0-9), and special characters, selectable via the charset identifier `"full"`.

- **REQ-F-003**: The generator engine SHALL select characters from the special or full character set with uniform probability distribution, ensuring each available character in the selected set has an equal chance of selection on every draw.

- **REQ-F-004**: The generator engine SHALL produce passwords configured with the special character set containing exclusively characters from the special set, with no alphanumeric characters appearing in the output.

- **REQ-F-005**: The generator engine SHALL produce passwords configured with the full character set containing exclusively characters from the full set (lowercase, uppercase, numeric, and special combined), with no characters outside the defined set appearing in output.

- **REQ-F-006**: The generator engine SHALL accept the special and full charset identifiers through the existing function contract without modifying parameter count, type signature, or positional semantics.

## 3. Non-Functional Requirements

### 3.1 Security

| ID | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
| NFR-S-003 | Security — Confidentiality | Entropy per character for special set | 4 bits minimum | Special set contains 32 characters; log2(32) = 4 bits per draw |
| NFR-S-004 | Security — Confidentiality | Entropy per character for full set | 6 bits minimum | Full set contains 94 characters; log2(94) ≈ 6.55 bits per draw |
| NFR-S-005 | Security — Tamper resistance | Character set mutability | Immutable at runtime | Character sets SHALL not be modifiable after module initialization |

### 3.2 Performance

| ID | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
| NFR-P-003 | Performance — Time behaviour | Generation latency | Under 100 milliseconds | For password lengths 1 to 128 characters using special or full charset |

### 3.3 Portability

| ID | Quality Attribute (ISO 25010) | Metric | Target | Condition |
| --- | --- | --- | --- | --- |
| NFR-PT-003 | Portability — Conformity | Character encoding | ASCII 33–126 ( printable punctuation only) | Zero Unicode, zero extended ASCII, zero locale-dependent symbols |

## 4. Acceptance Criteria

### AC-001 — Special-only character set

**Given** the engine is configured with the special character set identifier `"special"`, **when** a password is generated, **then** all characters in the output SHALL be ASCII printable punctuation characters from the special set inventory, excluding all lowercase letters, uppercase letters, and numerals.

### AC-002 — Full character set composition

**Given** the engine is configured with the full character set identifier `"full"`, **when** a password of length 100 or greater is generated, **then** the output SHALL contain characters drawn from all four classes: lowercase a-z, uppercase A-Z, numeric 0-9, and ASCII printable punctuation from the special set.

### AC-003 — Special character uniform distribution

**Given** the engine generates 1000 passwords with the special character set and length 20, **when** analyzing the observed frequency of each special character across all positions, **then** each of the 32 special characters SHALL appear within normal statistical variance, with no character absent from the distribution.

### AC-004 — Full character set exclusivity

**Given** the engine is configured with the full character set identifier `"full"`, **when** a password is generated, **then** no character SHALL appear in the output that is outside the defined full set of 94 characters (26 lowercase + 26 uppercase + 10 numeric + 32 special).

### AC-005 — Backward compatibility of existing charsets

**Given** the engine receives any of the four original charset identifiers (`"lower"`, `"upper"`, `"numeric"`, `"mixed"`), **when** a password is generated, **then** the output SHALL conform to the character set constraints defined in REQ-001, and zero special characters SHALL appear in the output.

### AC-006 — Invalid charset identifier rejection

**Given** the engine receives a charset identifier that is not one of the six valid identifiers (`"lower"`, `"upper"`, `"numeric"`, `"mixed"`, `"special"`, `"full"`), **when** the generation process initiates, **then** the engine SHALL raise a validation exception and SHALL NOT produce a password output.

### AC-007 — Cryptographic source maintained

**Given** the engine generates a password using either the special or full character set, **when** the generation process completes, **then** all character selection SHALL use the secrets module, and the random module SHALL NOT be used for character selection.

### AC-008 — Special set character set inventory completeness

**Given** the special character set is initialized within the generator engine, **when** the set contents are enumerated, **then** the set SHALL contain exactly 32 characters matching the inventory table defined in this document.

### AC-009 — Full set character set inventory completeness

**Given** the full character set is initialized within the generator engine, **when** the set contents are enumerated, **then** the set SHALL contain exactly 94 unique characters representing the union of lowercase (26), uppercase (26), numeric (10), and special (32) classes.

## 5. Out of Scope

This requirement does not cover:

- Character exclusion rules for individual characters or character ranges (REQ-004 domain)
- Custom user-defined character sets beyond the predefined six identifiers
- Unicode supplementary characters or multibyte symbol support
- Locale-aware character classification or territory-dependent symbol sets
- Password entropy calculation or bit-strength assessment output
- Batch generation producing multiple passwords in a single invocation (REQ-004 domain)
- Output formatting, file writing, or clipboard integration (REQ-005 domain)
- CLI flag additions or help text modifications for new charset identifiers (REQ-002 scope)
- Password strength indicators or policy compliance reporting
- Character frequency analysis tools or bias diagnostic reports

## 6. Dependencies

| Dependency | Type | Why |
| --- | --- | --- |
| REQ-001 | Internal, blocking | Defines the base character sets (lower, upper, numeric, mixed), function contract, and uniform distribution invariant that REQ-003 extends |
| REQ-002 | Internal, blocking | Provides CLI interface contract; new charset identifiers must be parseable by the existing argument handling framework without structural changes |
| REQ-004 | Internal, downstream | Batch generation logic may leverage the special and full charsets; REQ-003 establishes the character sets REQ-004 can reference |
| REQ-005 | Internal, downstream | Output formatting may affect display of passwords containing special characters; REQ-003 establishes the character composition REQ-005 must handle |

## 7. References

- REQ-001 — Password Generation Logic: Defines base character sets, uniform distribution requirement, function contract, and length bounds [1, 128].
- ADR-001 — Core-Generator API Contract: Governs the function signature expansion path; states V2 will add new charset identifiers additively without breaking existing contract.
- ADR-002 — CLI Interface Architecture: Governs the separation of argument parsing (cli-interface) from generation logic (core-generator); confirms new identifiers flow through existing delegation path.
- ASCII Standard (ISO/IEC 646): Defines printable punctuation characters in code points 33 through 126 that comprise the special character set.
- Python string.punctuation: Standard library reference for the 32-character ASCII punctuation string used as the special character set source.

## 8. Character Set Inventory

The following table documents every character included in the special character set, grouped by category for traceability. Each character is included because it is part of ASCII standard printable punctuation, has broad cross-platform support, and contributes to password entropy without introducing encoding ambiguity.

| Character | Code Point | Category | Inclusion Rationale |
| --- | --- | --- | --- |
| `!` | U+0021 | Punctuation — modifier | High-frequency password policy requirement; broad system compatibility |
| `"` | U+0022 | Punctuation — quote | ASCII standard; included for charset completeness |
| `#` | U+0023 | Punctuation — symbol | High entropy contributor; common in password policies |
| `$` | U+0024 | Punctuation — currency | Widely accepted in password policies; increases search space |
| `%` | U+0025 | Punctuation — symbol | ASCII standard; included for charset completeness |
| `&` | U+0026 | Punctuation — modifier | Common symbol; contributes to entropy |
| `'` | U+0027 | Punctuation — quote | ASCII standard; included for charset completeness |
| `(` | U+0028 | Punctuation — grouping | ASCII standard; included for charset completeness |
| `)` | U+0029 | Punctuation — grouping | ASCII standard; included for charset completeness |
| `*` | U+002A | Punctuation — modifier | High entropy contributor; common in password policies |
| `+` | U+002B | Math — operator | ASCII standard; included for charset completeness |
| `,` | U+002C | Punctuation — separator | ASCII standard; included for charset completeness |
| `-` | U+002D | Punctuation — dash | High entropy contributor; common in password policies |
| `.` | U+002E | Punctuation — separator | ASCII standard; included for charset completeness |
| `/` | U+002F | Punctuation — separator | ASCII standard; included for charset completeness |
| `:` | U+003A | Punctuation — separator | ASCII standard; included for charset completeness |
| `;` | U+003B | Punctuation — separator | ASCII standard; included for charset completeness |
| `<` | U+003C | Punctuation — bracket | ASCII standard; included for charset completeness |
| `=` | U+003D | Math — operator | High entropy contributor; widely accepted |
| `>` | U+003E | Punctuation — bracket | ASCII standard; included for charset completeness |
| `?` | U+003F | Punctuation — separator | High entropy contributor; common in password policies |
| `@` | U+0040 | Punctuation — symbol | Extremely common in password policies; high recognition value |
| `[` | U+005B | Punctuation — bracket | ASCII standard; included for charset completeness |
| `\` | U+005C | Punctuation — separator | ASCII standard; included for charset completeness |
| `]` | U+005D | Punctuation — bracket | ASCII standard; included for charset completeness |
| `^` | U+005E | Punctuation — modifier | ASCII standard; included for charset completeness |
| `_` | U+005F | Punctuation — connector | High entropy contributor; widely accepted in policies |
| `` ` `` | U+0060 | Punctuation — quote | ASCII standard; included for charset completeness |
| `{` | U+007B | Punctuation — grouping | ASCII standard; included for charset completeness |
| `|` | U+007C | Punctuation — separator | ASCII standard; included for charset completeness |
| `}` | U+007D | Punctuation — grouping | ASCII standard; included for charset completeness |
| `~` | U+007E | Punctuation — modifier | ASCII standard; included for charset completeness |

### Summary Statistics

| Metric | Value |
| --- | --- |
| Special set size | 32 characters |
| Full set size | 94 characters (26 lower + 26 upper + 10 numeric + 32 special) |
| Special set code point range | U+0021 through U+007E (non-contiguous; punctuation subset only) |
| Full set code point range | U+0021 through U+007E (all ASCII printable, excluding space U+0020) |
| Minimum entropy per character (special) | 4.00 bits |
| Minimum entropy per character (full) | 6.55 bits |
| Source | Python `string.punctuation` constant |
| Unicode status | All characters are ASCII subset (BMP plane 0, no multibyte) |
