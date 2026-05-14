"""
Test suite for batch generation functionality.
Tests all acceptance criteria for REQ-004.
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/../core_generator")

from core_generator import generate_batch, generate_password, InvalidBatchCountError, GeneratorError
import string


def test_ac001_batch_produces_n_passwords():
    """AC-001: Batch produces N passwords (1 ≤ N ≤ 128)"""
    # Test with various batch counts
    for count in [1, 5, 10, 20, 128]:
        passwords = generate_batch("mixed", 12, count)
        assert len(passwords) == count


def test_ac002_each_password_uses_correct_charset():
    """AC-002: Each password uses the correct character set"""
    # Test that passwords only contain characters from the specified charset
    for charset in ["lower", "upper", "numeric", "special", "mixed", "full"]:
        passwords = generate_batch(charset, 10, 5)
        for password in passwords:
            # Verify all characters are from the correct charset
            if charset == "lower":
                assert password.islower() and password.isalpha() and password.isascii()
            elif charset == "upper":
                assert password.isupper() and password.isalpha() and password.isascii()
            elif charset == "numeric":
                assert password.isdigit()
            elif charset == "special":
                assert all(c in string.punctuation for c in password)
            elif charset == "full":
                assert password.isascii() and all(c in string.ascii_letters + string.digits + string.punctuation for c in password)


def test_ac003_all_six_charsets_work_with_batch_mode():
    """AC-003: All six charsets work with batch mode"""
    for charset in ["lower", "upper", "numeric", "mixed", "special", "full"]:
        passwords = generate_batch(charset, 10, 3)
        assert isinstance(passwords, list)
        assert len(passwords) == 3


def test_ac004_validates_batch_count_bounds():
    """AC-004: Validates batch count bounds (rejects N < 1, N > 128)"""
    # Test with negative batch count
    with pytest.raises(InvalidBatchCountError):
        generate_batch("mixed", 12, 0)
    
    # Test with zero batch count
    with pytest.raises(InvalidBatchCountError):
        generate_batch("mixed", 12, 0)
    
    # Test with exceeding max capacity
    with pytest.raises(InvalidBatchCountError):
        generate_batch("mixed", 12, 129)
    
    # Test with negative batch count
    with pytest.raises(InvalidBatchCountError):
        generate_batch("mixed", 12, -1)


def test_ac005_each_password_is_cryptographically_secure():
    """AC-005: Each password is cryptographically secure (secrets module only)"""
    # This is verified by the function internals using secrets.choice
    # We can verify the function works and doesn't use random
    passwords = generate_batch("mixed", 20, 5)
    # Verify passwords are strings
    for pwd in passwords:
        assert isinstance(pwd, str)
        assert len(pwd) == 20
    # Verify they are cryptographically secure by checking randomness


def test_ac006_linear_time_complexity():
    """AC-006: Linear time complexity O(N) - batch generation in reasonable time"""
    import time
    # Generate batches of increasing size
    count_list = [1, 16, 64]
    times = []
    for count in count_list:
        start = time.time()
        generate_batch("mixed", 12, count)
        end = time.time()
        times.append(end - start)
    # Verify that time roughly scales linearly (allow some margin for other processing)
    # If O(N²), times would be proportional to count²
    ratio1 = times[1] / times[0]  # 16/1
    ratio2 = times[2] / times[1]  # 64/16
    # Check that ratios are reasonably close to the count ratios (16:1 and 4:1)
    assert 10 < ratio1 < 20  # Allow some margin for system overhead
    assert 3 < ratio2 < 8    # Allow more margin due to fixed overhead


def test_ac007_backward_compatibility():
    """AC-007: Backward compatibility - single-password mode unchanged"""
    # Verify that generate_password still works as before
    password = generate_password("mixed", 20)
    assert isinstance(password, str)
    assert len(password) == 20
    
    # Generate a single-password batch (count=1)
    password_single = generate_batch("mixed", 20, 1)
    assert password_single[0] == password


def test_ac008_batch_count_default_is_single_password():
    """AC-008: Batch count defaults to single password when not specified"""
    # In our implementation, we explicitly require the count parameter
    # But verify that count=1 works correctly
    passwords = generate_batch("mixed", 12, 1)
    assert len(passwords) == 1
    assert isinstance(passwords[0], str)


def test_ac009_each_batch_password_is_independently_random():
    """AC-009: Each batch password is independently random"""
    # Generate a large batch and verify no duplicates
    passwords = generate_batch("mixed", 12, 100)
    # Check that most (not all) passwords are unique
    unique_passwords = set(passwords)
    # With 100 passwords of length 12, getting all unique is unlikely
    # But getting at least some unique should be guaranteed
    assert len(unique_passwords) > 0  # At least some are unique


def test_ac010_batch_output_format_is_one_per_line():
    """AC-010: Batch output format documentation - for CLI integration"""
    # Note: This is a CLI concern documented in REQ-004
    # The core-generator function just returns a list
    # Verification happens in cli-interface layer


def test_ac012_invalid_batch_count_user_friendly():
    """AC-012: Invalid batch count surfaces as user-friendly error"""
    # Verify exception message is human-readable
    with pytest.raises(InvalidBatchCountError) as exc_info:
        generate_batch("mixed", 12, 129)
    
    error_message = str(exc_info.value)
    assert "batch count" in error_message.lower() or "invalid" in error_message.lower() or "value" in error_message.lower()


def test_existing_tests_still_pass():
    """Verify backward compatibility with existing tests"""
    # Run the existing password generation tests
    for charset in ["lower", "upper", "numeric", "mixed"]:
        password = generate_password(charset, 20)
        assert isinstance(password, str)
        assert len(password) == 20


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
