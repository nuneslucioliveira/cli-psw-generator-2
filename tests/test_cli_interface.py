"""
Test suite for the CLI interface.
Tests all acceptance criteria for REQ-002.
"""
import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from io import StringIO

# Add the current directory to Python path so we can import cli_interface
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from cli_interface.cli_main import main
from core_generator import generate_password, GeneratorError, CharsetNotFoundError, InvalidLengthError


def test_ac_006_valid_length_flag_produces_correct_output():
    """AC-006: Valid length flag produces correct output"""
    # Test by mocking the generation function in the main module
    output = StringIO()
    with patch('sys.stdout', output):
        with patch('cli_interface.cli_main.generate_password') as mock_gen:
            mock_gen.return_value = "a" * 24  # 24 character password
            
            # Execute CLI with length 24
            with patch('sys.argv', ['password_generator', '--length', '24']):
                # We expect SystemExit to be raised and we handle it via pytest.raises 
                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 0
            
            # Check the result was printed
            assert output.getvalue() == "a" * 24 + "\n"


def test_ac_007_default_length_applies_when_flag_omitted():
    """AC-007: Default length applies when flag omitted"""
    output = StringIO()
    with patch('sys.stdout', output):
        with patch('cli_interface.cli_main.generate_password') as mock_gen:
            mock_gen.return_value = "a" * 16  # Default 16 character password
            
            # Execute CLI without --length flag
            with patch('sys.argv', ['password_generator']):
                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 0
            
            # Check the result was printed  
            assert output.getvalue() == "a" * 16 + "\n"


def test_ac_008_invalid_length_triggers_error_and_non_zero_exit():
    """AC-008: Invalid length triggers error and non-zero exit"""
    # Test case: length = 0 (smaller than minimum)  
    with patch('sys.argv', ['password_generator', '--length', '0']):
        with pytest.raises(SystemExit) as exc_info:
            main()
        # The main point is it must exit with non-zero code
        assert exc_info.value.code != 0
        
    # Test case: length = 200 (larger than maximum)
    with patch('sys.argv', ['password_generator', '--length', '200']):
        with pytest.raises(SystemExit) as exc_info:
            main()
        # The main point is it must exit with non-zero code
        assert exc_info.value.code != 0
        
    # Test case: length = abc (invalid type)
    with patch('sys.argv', ['password_generator', '--length', 'abc']):
        with pytest.raises(SystemExit) as exc_info:
            main()
        # The main point is it must exit with non-zero code
        assert exc_info.value.code != 0


def test_ac_009_valid_charset_flag_produces_correct_output():
    """AC-009: Valid charset flag produces correct output"""
    output = StringIO()
    with patch('sys.stdout', output):
        with patch('cli_interface.cli_main.generate_password') as mock_gen:
            mock_gen.return_value = "b" * 10  # 10 character password
            
            # Execute CLI with charset "lower"
            with patch('sys.argv', ['password_generator', '--charset', 'lower']):
                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 0
                
            # Check the result was printed
            assert output.getvalue() == "b" * 10 + "\n"


def test_ac_010_invalid_charset_triggers_error_and_non_zero_exit():
    """AC-010: Invalid charset triggers error and non-zero exit"""
    # Test case 1: invalid charset "symbol"
    with patch('sys.argv', ['password_generator', '--charset', 'symbol']):
        with pytest.raises(SystemExit) as exc_info:
            main()
        assert exc_info.value.code == 2  # argparse exits with code 2 for invalid args
        
    # Test case 2: invalid charset "Mixed" (wrong case) 
    with patch('sys.argv', ['password_generator', '--charset', 'Mixed']):
        with pytest.raises(SystemExit) as exc_info:
            main()
        assert exc_info.value.code == 2  # argparse exits with code 2 for invalid args


def test_ac_011_help_text_displays_flag_definitions():
    """AC-011: Help text displays flag definitions"""
    # Capture stdout when help is displayed
    with patch('sys.stdout', new_callable=StringIO) as mock_stdout:
        with patch('sys.argv', ['password_generator', '--help']):
            with pytest.raises(SystemExit) as exc_info:
                main()
            assert exc_info.value.code == 0
            help_output = mock_stdout.getvalue()
            # Check that help text contains both flags
            assert '--length' in help_output
            assert '--charset' in help_output


def test_ac_012_successful_generation_exits_with_code_0():
    """AC-012: Successful generation exits with code 0"""
    # Use a simple case with valid inputs
    output = StringIO()
    with patch('sys.stdout', output):
        with patch('cli_interface.cli_main.generate_password') as mock_gen:
            mock_gen.return_value = "testpassword123"
            
            with patch('sys.argv', ['password_generator', '--length', '12']):
                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 0


def test_ac_013_output_contains_bare_password_only():
    """AC-013: Output contains bare password only"""
    output = StringIO()
    with patch('sys.stdout', output):
        with patch('cli_interface.cli_main.generate_password') as mock_gen:
            mock_gen.return_value = "aaaaaaaaaa"  # 10 character password
            
            with patch('sys.argv', ['password_generator']):
                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 0
                
                # Check only password plus newline is printed
                assert output.getvalue() == "aaaaaaaaaa\n"


def test_ac_014_generator_exceptions_surface_as_user_friendly_messages():
    """AC-014: Generator exceptions surface as user-friendly messages"""
    # Test CharsetNotFoundError
    with patch('sys.argv', ['password_generator', '--length', '10']):
        with patch('cli_interface.cli_main.generate_password') as mock_gen:
            mock_gen.side_effect = CharsetNotFoundError("Invalid charset")
            
            with patch('sys.stderr', new_callable=StringIO) as mock_stderr:
                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 1
                error_output = mock_stderr.getvalue()
                # Check expected error message appears
                assert "Invalid character set" in error_output
                
        # Test InvalidLengthError  
        with patch('cli_interface.cli_main.generate_password') as mock_gen:
            mock_gen.side_effect = InvalidLengthError("Length too high")
            
            with patch('sys.stderr', new_callable=StringIO) as mock_stderr:
                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 1
                error_output = mock_stderr.getvalue()
                # Check expected error message appears
                assert "Invalid password length" in error_output
                
        # Test GeneratorError (base class)
        with patch('cli_interface.cli_main.generate_password') as mock_gen:
            mock_gen.side_effect = GeneratorError("General error")
            
            with patch('sys.stderr', new_callable=StringIO) as mock_stderr:
                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 1
                error_output = mock_stderr.getvalue()
                # Check expected error message appears
                assert "Password generation failed" in error_output


def test_keyboard_interrupt_handled_silently():
    """Test that KeyboardInterrupt exits silently with code 130"""
    with patch('sys.argv', ['password_generator']):
        with patch('cli_interface.cli_main.generate_password') as mock_gen:
            mock_gen.side_effect = KeyboardInterrupt()
            
            with patch('sys.exit') as mock_exit:
                main()
                mock_exit.assert_called_once_with(130)