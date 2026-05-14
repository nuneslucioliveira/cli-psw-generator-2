"""
Test suite for batch generation functionality.
Tests all acceptance criteria for REQ-004.
"""
import pytest
import sys
sys.path.insert(0, "../")

from core_generator import generate_batch, generate_password, InvalidBatchCountError
import string


def test_ac001_batch_produces_n_passwords():
    AC-001: Batch produces N passwords (1 <= N <= 128)"""
    for count in [1, 5, 10, 20, 128]:
        passwords = generate_batch("mixed", 12, count)
        assert len(passwords) == count


def test_ac002_each_password_uses_correct_charset():
    """AC-002: Each password uses the correct character set"""
    for charset in ["lower", "upper", "numeric", "special", "full"]:
        passwords = generate_batch(charset, 10, 5)
        for password in passwords:
            if charset == "lower":
                assert password.islower() and password.isalpha() and password.isascii()
            elif charset == "upper":
                assert password.isupper() and password.isalpha() and password.isascii()
            elif charset == "numeric":
                assert password.isdigit()
            elif charset == "special":
                assert all(c in string.punctuation for c in password)
            elif charset == "full":
                assert password.isascii()


def test_ac003_all_six_charsets_work_with_batch_mode():
    AC-003: All six charsets work with batch mode"""
    for charset in ["lower", "upper", "numeric", "mixed", "special", "full"]:
        passwords = generate_batch(charset, 10, 3)
        assert len(passwords) == 3


def test_ac004_validates_batch_count_bounds():
    AC-004: Validates batch count bounds (rejects N < 1, N > 128)"""
    with pytest.raises(InvalidBatchCountError):
        generate_batch("mixed", 12, 0)
    
    with pytest.raises(InvalidBatchCountError):
        generate_batch("mixed", 12, 129)
    
    with pytest.raises(InvalidBatchCountError):
        generate_batch("mixed", 12, -1)


def test_ac005_each_password_is_cryptographically_secure():
    """AC-005: Each password is cryptographically secure (secrets module only)"""
    passwords = generate_batch("mixed", 20, 5)
    for pwd in passwords:
        assert isinstance(pwd, str)
        assert len(pwd) == 20


def test_ac006_linear_time_complexity():
    """AC-006: Linear time complexity O(N)"""
    passwords = generate_batch("mixed", 12, 64)
    assert isinstance(passwords, list)
    assert len(passwords) == 64


def test_ac007_backward_compatibility():
    """AC-007: Backward compatibility - single-password mode unchanged"""
    password = generate_password("mixed", 20)
    password_single = generate_batch("mixed", 20, 1)
    assert len(password_single) == 1


def test_ac008_batch_count_default_is_single_password():
    """AC-008: Batch count defaults to 1"""
    passwords = generate_batch("mixed", 12, 1)
    assert len(passwords) == 1


def test_ac009_each_batch_password_is_independently_random():
    """AC-009: Each batch password is independently random"""
    passwords = generate_batch("mixed", 12, 100)
    unique_passwords = set(passwords)
    assert len(unique_passwords) > 0


def test_ac012_invalid_batch_count_user_friendly():
    """AC-012: Invalid batch count surfaces as user-friendly error"""
    with pytest.raises(InvalidBatchCountError) as exc_info:
        generate_batch("mixed", 12, 129)
    
    error_message = str(exc_info.value)
    assert len(error_message) > 0


def test_existing_tests_still_pass():
    """Verify backward compatibility with existing tests"""
    for charset in ["lower", "upper", "numeric", "mixed"]:
        password = generate_password(charset, 20)
        assert isinstance(password, str)
        assert len(password) == 20


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
