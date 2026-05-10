# CLI Password Generator — Usage Guide

## Overview

A command-line tool for generating secure, customizable passwords based on user-defined length and character set constraints.

## Quick Start

```bash
# Generate a default-length password (16 chars, mixed charset)
python3 cli_interface/cli_main.py

# Generate a custom-length password
python3 cli_interface/cli_main.py --length 32

# Generate lowercase-only password
python3 cli_interface/cli_main.py --charset lower

# Generate uppercase-only password
python3 cli_interface/cli_main.py --charset upper

# Generate numeric-only password
python3 cli_interface/cli_main.py --charset numeric
```

## Command-Line Interface

### Available Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--length` | integer | 16 | Password length (1-128) |
| `--charset` | string | "mixed" | Character set: `lower`, `upper`, `numeric`, `mixed` |
| `--help` | boolean | - | Display help information |

### Character Sets

| Identifier | Characters | Use Case |
|------------|------------|----------|
| `lower` | a-z | Passwords requiring only lowercase letters |
| `upper` | A-Z | Passwords requiring only uppercase letters |
| `numeric` | 0-9 | Numeric-only passwords (PINs, codes) |
| `mixed` | a-z, A-Z, 0-9 | Standard mixed-case passwords |

**Note:** The `mixed` charset ensures all character types appear at least once when `--length >= 36`.

## Advanced Examples

### Generate Multiple Passwords

```bash
# Generate 5 passwords (run multiple times)
for i in {1..5}; do echo "---"; python3 cli_interface/cli_main.py --length 20; done
```

### Generate Passwords for Different Services

```bash
# Generate strong password for email provider
python3 cli_interface/cli_main.py --length 24 --charset mixed

# Generate password for a system that requires 16+ chars
python3 cli_interface/cli_main.py --length 16 --charset mixed

# Generate PIN for a numeric-only system
python3 cli_interface/cli_main.py --length 6 --charset numeric
```

### Pipe Output to Files or Scripts

```bash
# Save to file
python3 cli_interface/cli_main.py --length 24 > .password-store

# Pipe to another command
python3 cli_interface/cli_main.py --length 16 | head -c 15

# Append to a password list
python3 cli_interface/cli_main.py --length 20 >> ./my-passwords.txt
```

### Error Handling

The CLI handles errors gracefully with informative messages:

```bash
# Invalid length
$ python3 cli_interface/cli_main.py --length 0
Invalid password length: 0. Length must be between 1 and 128.

# Invalid charset
$ python3 cli_interface/cli_main.py --charset invalid
Invalid character set: 'invalid'. Use one of: lower, upper, numeric, mixed.
```

## Security Considerations

- **Cryptographically Secure**: Uses Python's `secrets` module for random character selection
- **No Predictability**: Each generation uses system entropy
- **Single Output**: Produces exactly one password per invocation
- **No Logging**: Passwords are not logged or cached

## Technical Details

### Service Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  cli-interface   │────▶│ core-generator   │
│  (argument       │     │ (pure logic)     │
│   parsing)       │     │ (secrets module) │
└─────────────────┘     └──────────────────┘
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - password generated and output to stdout |
| 1 | Error - invalid arguments or generation failure (stderr) |
| 130 | Interrupt - caught `SIGINT` (Ctrl+C) |

### Exit Code Usage

```bash
# Check if generation succeeded
python3 cli_interface/cli_main.py --length 16 && echo "Success!"

# Capture password if successful
password=$(python3 cli_interface/cli_main.py --length 24) && echo "Generated: $password"
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "ModuleNotFoundError: No module named 'core_generator'" | Run from project root directory: `cd /path/to/cli-psw-generator-2` |
| "Permission denied when writing to file" | Use `chmod +x` or write to writable location |
| Generator produces unexpected characters | Verify Python stdlib only (no custom character sets) |
| Help text doesn't display | Run with `--help` flag, not `-h` |

### Performance

- **Latency**: < 100ms for password generation (NFR-P-001)
- **Memory**: Minimal (< 10MB)
- **Dependencies**: None (stdlib only)

## Best Practices

1. **Never reuse passwords** - Generate a new password for each service
2. **Use longer passwords for sensitive accounts** - 24+ characters for email, banking
3. **Mix character sets** - Use `mixed` charset for general use
4. **Store passwords securely** - Consider password managers for multiple accounts
5. **Don't expose passwords** - Avoid piping passwords to untrusted scripts

## Changelog

### Version 0.1.0 (MVP)
- Initial release with alphanumeric character sets
- Two CLI flags: `--length` and `--charset`
- Cryptographically secure password generation
- POSIX-compliant I/O streams
- Full test coverage (24 tests)

## License

This CLI Password Generator is provided as-is for secure password generation.

## Contact

For issues or contributions, see the project repository.

```
