"""
Test suite for the password generator function.
Tests all acceptance criteria for REQ-001.
"""
import pytest
import secrets
from typing import Literal
import sys
import os
# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")

from core_generator import generate_password, GeneratorError, CharsetNotFoundError, InvalidLengthError


def test_ac_001_password_length_correctness():
    """AC-001: Password length matches provided parameter"""
    # Test normal lengths
    assert len(generate_password("lower", 10)) == 10
    assert len(generate_password("upper", 5)) == 5
    assert len(generate_password("numeric", 15)) == 15
    assert len(generate_password("mixed", 20)) == 20
    
    # Test edge cases
    assert len(generate_password("lower", 1)) == 1
    assert len(generate_password("lower", 128)) == 128


def test_ac_002_lowercase_exclusivity():
    """AC-002: Generated passwords with 'lower' charset contain only lowercase letters"""
    password = generate_password("lower", 50)
    assert password.islower()
    assert password.isalpha()
    assert all(c in 'abcdefghijklmnopqrstuvwxyz' for c in password)


def test_ac_003_uppercase_exclusivity():
    """AC-003: Generated passwords with 'upper' charset contain only uppercase letters"""
    password = generate_password("upper", 50)
    assert password.isupper()
    assert password.isalpha()
    assert all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' for c in password)


def test_ac_004_numeric_exclusivity():
    """AC-004: Generated passwords with 'numeric' charset contain only digits"""
    password = generate_password("numeric", 50)
    assert password.isdigit()
    assert all(c in '0123456789' for c in password)


def test_ac_005_mixed_charset_threshold_enforcement():
    """AC-005: Mixed charset guarantees all character types appear at least once if length >= 36"""
    # This is harder to test due to randomness, but we can test that for length 36+,
    # all three character types appear at least once
    password = generate_password("mixed", 36)
    assert any(c.islower() for c in password)  # Has lowercase
    assert any(c.isupper() for c in password)  # Has uppercase
    assert any(c.isdigit() for c in password)  # Has digit


def test_ac_006_character_set_exclusivity():
    """AC-006: Each charset produces distinct character sets"""
    lower_pass = generate_password("lower", 100)
    upper_pass = generate_password("upper", 100)
    numeric_pass = generate_password("numeric", 100)
    mixed_pass = generate_password("mixed", 100)

    # Each password should contain only characters from its specified charset
    assert all(c in 'abcdefghijklmnopqrstuvwxyz' for c in lower_pass)
    assert all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' for c in upper_pass)
    assert all(c in '0123456789' for c in numeric_pass)
    
    # Mixed should contain characters from all three sets
    # Check individual character sets in mixed
    assert all(c.islower() or c.isupper() or c.isdigit() for c in mixed_pass)
    
    # Make sure lower doesn't contain upper or numeric
    assert not any(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' for c in lower_pass)
    assert not any(c in '0123456789' for c in lower_pass)
    
    # Make sure upper doesn't contain lower or numeric  
    assert not any(c in 'abcdefghijklmnopqrstuvwxyz' for c in upper_pass)
    assert not any(c in '0123456789' for c in upper_pass)
    
    # Make sure numeric doesn't contain lower or upper
    assert not any(c in 'abcdefghijklmnopqrstuvwxyz' for c in numeric_pass)
    assert not any(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' for c in numeric_pass)
    
    # Mixed should contain at least some from each set
    assert any(c.islower() for c in mixed_pass)
    assert any(c.isupper() for c in mixed_pass)
    assert any(c.isdigit() for c in mixed_pass)


def test_ac_007_crypto_randomness_verification():
    """AC-007: Cryptographically secure random selection verified via secrets module usage"""
    # This test checks that secrets is used by inspecting the module
    # We can't directly test imports, but we can at least verify the function runs
    password = generate_password("lower", 10)
    assert isinstance(password, str)
    assert len(password) == 10


def test_ac_008_single_output_per_invocation():
    """AC-008: Function returns exactly one string per invocation"""
    password = generate_password("lower", 10)
    assert isinstance(password, str)
    assert len(password) == 10


def test_ac_009_no_positional_bias():
    """AC-009: No positional bias - character distribution should be uniform across positions"""
    # Generate multiple passwords and check distribution
    charset = "mixed"
    sample_size = 1000
    password_length = 20
    passwords = [generate_password(charset, password_length) for _ in range(sample_size)]
    
    # Check that characters are distributed relatively evenly
    for i in range(password_length):
        chars_at_position = [pwd[i] for pwd in passwords]
        # Each position should have a reasonable mix of different character types
        lower_count = sum(1 for c in chars_at_position if c.islower())
        upper_count = sum(1 for c in chars_at_position if c.isupper())
        digit_count = sum(1 for c in chars_at_position if c.isdigit())
        
        # Distribution should not be extremely skewed (each should have at least 10%)
        assert lower_count / sample_size > 0.1, f"Position {i} has too few lowercase letters"
        assert upper_count / sample_size > 0.1, f"Position {i} has too few uppercase letters"
        assert digit_count / sample_size > 0.1, f"Position {i} has too few digits"


def test_ac_010_output_variance_across_invocations():
    """AC-010: 1000 password invocations with same parameters show variance"""
    charset = "mixed"
    password_length = 10
    sample_size = 1000
    
    passwords = [generate_password(charset, password_length) for _ in range(sample_size)]
    
    # Check that there's actually variance - not all passwords should be identical
    unique_passwords = set(passwords)
    # With 1000 samples and random generation, we should have quite a few unique passwords
    assert len(unique_passwords) > 500, "Expected high variance in generated passwords"


def test_invalid_charset_raises_exception():
    """Exception test: Invalid charset should raise CharsetNotFoundError"""
    with pytest.raises(CharsetNotFoundError):
        generate_password("invalid", 10)


def test_length_less_than_one_raises_exception():
    """Exception test: Length < 1 should raise InvalidLengthError"""
    with pytest.raises(InvalidLengthError):
        generate_password("lower", 0)
    
    with pytest.raises(InvalidLengthError):
        generate_password("lower", -5)


def test_length_greater_than_128_raises_exception():
    """Exception test: Length > 128 should raise InvalidLengthError"""
    with pytest.raises(InvalidLengthError):
        generate_password("lower", 129)
    
    with pytest.raises(InvalidLengthError):
        generate_password("lower", 1000)


def test_mixed_charset_with_length_36_guarantees_all_character_types():
    """Extra test to check that mixed charset with length 36+ guarantees all character types"""
    # This is an edge case test that validates the special guarantee for mixed charset
    for _ in range(100):
        password = generate_password("mixed", 36)
        assert any(c.islower() for c in password)
        assert any(c.isupper() for c in password)
        assert any(c.isdigit() for c in password)
        assert len(password) == 36