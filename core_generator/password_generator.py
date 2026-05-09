"""
Core password generator module for CLI Password Generator.
This module implements the password generation logic without CLI dependencies.
"""
from typing import Literal
from secrets import choice
from .exceptions import GeneratorError, CharsetNotFoundError, InvalidLengthError


def generate_password(
    charset: Literal["lower", "upper", "numeric", "mixed"],
    length: int
) -> str:
    """
    Generate a cryptographically secure password with specified character set and length.
    
    Args:
        charset: The character set to use ("lower", "upper", "numeric", or "mixed")
        length: The length of the password (1-128 characters)
        
    Returns:
        A randomly generated password string
        
    Raises:
        CharsetNotFoundError: If charset is not one of the supported values
        InvalidLengthError: If length is not between 1 and 128 (inclusive)
    """
    # Validate inputs
    if length < 1 or length > 128:
        raise InvalidLengthError(f"Password length must be between 1 and 128. Got {length}")
    
    # Define character sets
    char_sets = {
        "lower": "abcdefghijklmnopqrstuvwxyz",
        "upper": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "numeric": "0123456789",
        "mixed": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    }
    
    # Validate charset
    if charset not in char_sets:
        raise CharsetNotFoundError(f"Invalid charset '{charset}'. Must be one of: lower, upper, numeric, mixed")
    
    # Get the character set for the specified charset
    char_set = char_sets[charset]
    
    # For mixed charset with length >= 36, ensure all character types are present
    if charset == "mixed" and length >= 36:
        # Generate a password that contains at least one character from each set
        password_chars = []
        
        # Ensure at least one character from each set
        password_chars.append(choice("abcdefghijklmnopqrstuvwxyz"))  # lowercase
        password_chars.append(choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ"))  # uppercase
        password_chars.append(choice("0123456789"))  # digit
        
        # Fill the rest with random characters from the full set
        remaining_length = length - 3
        for _ in range(remaining_length):
            password_chars.append(choice(char_set))
        
        # Shuffle the list to avoid predictable patterns using secrets
        for _ in range(100):
            insert_pos = choice(range(len(password_chars)))
            password_chars.insert(insert_pos, password_chars.pop())
        
        return ''.join(password_chars)
    else:
        # For all other charsets, generate normally
        return ''.join(choice(char_set) for _ in range(length))