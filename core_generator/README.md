# Core Password Generator

This module implements the password generation logic without CLI dependencies.

## Functions

### `generate_password(charset: str, length: int) -> str`
Generate a single cryptographically secure password.

### `generate_batch(charset: str, length: int, count: int) -> list[str]`
Generate a batch of cryptographically secure passwords.

## Character Sets

- `lower`: lowercase letters (a-z)
- `upper`: uppercase letters (A-Z)  
- `numeric`: digits (0-9)
- `mixed`: all alphanumeric characters (a-z, A-Z, 0-9)
- `special`: special characters (!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~)
- `full`: all characters including special characters

## Security

All password generation uses the `secrets` module for cryptographically secure randomization.