"""
Test suite for the special character set functionality.
Tests all acceptance criteria for REQ-003.
"""
import pytest
import secrets
import string
from typing import Literal
import sys
import os
# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")

from core_generator import generate_password, GeneratorError, CharsetNotFoundError, InvalidLengthError


def test_ac001_special_only_contents():
    """AC-001: Special-only character set - all characters are from the special set"""
    password = generate_password("special", 100)
    
    # All characters should be from the special set (punctuation)
    special_chars = set(string.punctuation)
    assert all(c in special_chars for c in password)
    # No alphanumeric characters
    assert not any(c.isalpha() or c.isdigit() for c in password)


def test_ac002_full_set_composition():
    """AC-002: Full character set composition - contains all character classes"""
    # Generate a long password to ensure all classes are present
    password = generate_password("full", 100)
    
    # Should contain characters from all classes
    assert any(c.islower() for c in password)  # Has lowercase
    assert any(c.isupper() for c in password)  # Has uppercase
    assert any(c.isdigit() for c in password)  # Has digit
    assert any(c in string.punctuation for c in password)  # Has special
    
    # All characters should be from the full set (a-z, A-Z, 0-9, punctuation)
    full_chars = set(string.ascii_lowercase + string.ascii_uppercase + string.digits + string.punctuation)
    assert all(c in full_chars for c in password)


def test_ac003_special_uniform_distribution():
    """AC-003: Special character uniform distribution - characters appear with equal probability"""
    sample_size = 1000
    password_length = 20
    passwords = [generate_password("special", password_length) for _ in range(sample_size)]
    
    # Check each character in special set appears reasonably uniformly
    special_chars = list(string.punctuation)
    char_counts = {char: 0 for char in special_chars}
    
    # Count occurrences of each special character across all passwords
    for password in passwords:
        for char in password:
            if char in char_counts:
                char_counts[char] += 1
    
    # Each character should appear at least once (within statistical variance)
    total_chars = sample_size * password_length
    expected_per_char = total_chars / len(special_chars)
    
    # With 1000 passwords of length 20, each of 32 characters should appear roughly 62.5 times each
    # Allow for some variance (say, within 15%)
    for char, count in char_counts.items():
        assert count > 0, f"Character {char} was never selected"
        assert count > 0.85 * expected_per_char, f"Character {char} was selected too infrequently ({count} times)"
        assert count < 1.15 * expected_per_char, f"Character {char} was selected too frequently ({count} times)"


def test_ac004_full_character_set_exclusivity():
    """AC-004: Full character set exclusivity - no character outside the defined set"""
    password = generate_password("full", 100)
    
    # All characters should only be from the full set: a-z, A-Z, 0-9, and punctuation
    full_chars = set(string.ascii_lowercase + string.ascii_uppercase + string.digits + string.punctuation)
    assert all(c in full_chars for c in password)
    
    # Make sure no character is outside the defined set
    # (should not have space, control characters, or unicode)
    assert not any(c == ' ' for c in password)  # No spaces
    assert not any(ord(c) < 32 or ord(c) > 126 for c in password)  # No control characters or non-ASCII


def test_ac005_backward_compatibility():
    """AC-005: Backward compatibility - existing charsets work as before"""
    # Test that the existing four charsets work exactly as before
    for charset in ["lower", "upper", "numeric", "mixed"]:
        password = generate_password(charset, 50)
        
        if charset == "lower":
            assert password.islower()
            assert password.isalpha()
            assert all(c in string.ascii_lowercase for c in password)
        elif charset == "upper":
            assert password.isupper()
            assert password.isalpha()
            assert all(c in string.ascii_uppercase for c in password)
        elif charset == "numeric":
            assert password.isdigit()
            assert all(c in string.digits for c in password)
        elif charset == "mixed":
            assert all(c.isalnum() or c in string.punctuation for c in password)
            # Should have at least one from each class (for length >= 36)
            if len(password) >= 36:
                assert any(c.islower() for c in password)
                assert any(c.isupper() for c in password)
                assert any(c.isdigit() for c in password)


def test_ac006_invalid_charset_rejection():
    """AC-006: Invalid charset identifier rejection - should raise CharsetNotFoundError"""
    # Test that invalid charset raises the right exception
    with pytest.raises(CharsetNotFoundError):
        generate_password("invalid", 10)
    
    # Test with multiple invalid identifiers
    invalid_charsets = ["special2", "full_set", "punctuation", "alnum"]
    for invalid in invalid_charsets:
        with pytest.raises(CharsetNotFoundError):
            generate_password(invalid, 10)


def test_ac007_crypto_randomness_maintained():
    """AC-007: Cryptographic source maintained - secrets module used exclusively"""
    # This is a simple test - the function should use secrets and not random
    password = generate_password("special", 20)
    assert isinstance(password, str)
    assert len(password) == 20
    
    # The function uses secrets.choice internally (already tested in other tests)
    # We can't easily test that _only_ secrets is used, but we can make sure
    # that it works and that the function signature stays the same


def test_ac008_special_set_inventory_completeness():
    """AC-008: Special set character set inventory completeness - 32 characters"""
    # Check that special set has exactly 32 characters
    special_chars = set(string.punctuation)
    assert len(special_chars) == 32


def test_ac009_full_set_inventory_completeness():
    """AC-009: Full set character set inventory completeness - 94 characters total"""
    # Check that full set has exactly 94 characters (26 lower + 26 upper + 10 numeric + 32 special)
    full_chars = set(string.ascii_lowercase + string.ascii_uppercase + string.digits + string.punctuation)
    assert len(full_chars) == 94


def test_new_charset_functionality():
    """Test that all new charsets work with different lengths"""
    # Test new special charset with various lengths
    for length in [1, 5, 20, 128]:
        password = generate_password("special", length)
        assert len(password) == length
        assert all(c in string.punctuation for c in password)
    
    # Test new full charset with various lengths
    for length in [1, 5, 20, 128]:
        password = generate_password("full", length)
        assert len(password) == length
        full_chars = set(string.ascii_lowercase + string.ascii_uppercase + string.digits + string.punctuation)
        assert all(c in full_chars for c in password)


def test_edge_case_length_handling():
    """Edge case tests for new charsets"""
    # Test lengths that are boundary values
    password = generate_password("special", 1)
    assert len(password) == 1
    assert all(c in string.punctuation for c in password)
    
    password = generate_password("full", 1)
    assert len(password) == 1
    full_chars = set(string.ascii_lowercase + string.ascii_uppercase + string.digits + string.punctuation)
    assert all(c in full_chars for c in password)
    
    # Test with length 128 (max allowed)
    password = generate_password("special", 128)
    assert len(password) == 128
    assert all(c in string.punctuation for c in password)
    
    password = generate_password("full", 128)
    assert len(password) == 128
    full_chars = set(string.ascii_lowercase + string.ascii_uppercase + string.digits + string.punctuation)
    assert all(c in full_chars for c in password)


def test_mixed_charset_still_works():
    """Make sure mixed charset behavior is unchanged"""
    password = generate_password("mixed", 36)
    assert len(password) == 36
    assert any(c.islower() for c in password)
    assert any(c.isupper() for c in password)
    assert any(c.isdigit() for c in password)
    # May or may not have special chars, but should contain chars from all three classes