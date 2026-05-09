"""
Exception definitions for the password generator.
"""
class GeneratorError(Exception):
    """Base exception for all generator-related errors."""
    pass


class CharsetNotFoundError(GeneratorError):
    """Raised when an invalid charset is provided."""
    pass


class InvalidLengthError(GeneratorError):
    """Raised when password length is not between 1 and 128."""
    pass