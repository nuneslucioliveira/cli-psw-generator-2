"""
CLI interface for the password generator.
This module handles command-line argument parsing and user interaction.
"""
import sys
import argparse
from typing import Literal

# Import from core generator
from core_generator import generate_password, GeneratorError, CharsetNotFoundError, InvalidLengthError


def get_parser() -> argparse.ArgumentParser:
    """
    Create and return the argument parser.
    
    Returns:
        argparse.ArgumentParser: Configured argument parser
    """
    parser = argparse.ArgumentParser(
        description="Generate secure, customizable passwords",
        prog="password-generator"
    )
    
    # Add length argument
    parser.add_argument(
        "--length",
        type=int,
        default=16,
        help="Password length (default: 16, min: 1, max: 128)"
    )
    
    # Add charset argument
    parser.add_argument(
        "--charset",
        choices=["lower", "upper", "numeric", "mixed"],
        default="mixed",
        help="Character set to use (default: mixed)"
    )
    
    return parser


def main() -> None:
    """
    Main entry point for the CLI interface.
    
    Parses arguments, validates inputs, and invokes the password generator.
    Handles all error cases and output routing to stdout/stderr.
    """
    try:
        # Parse command line arguments 
        parser = get_parser()
        args = parser.parse_args()
        
        # Generate password using the core generator (this will raise exceptions for invalid inputs)
        password = generate_password(charset=args.charset, length=args.length)
        
        # Output password to stdout
        sys.stdout.write(password + '\n')
        sys.stdout.flush()
        
        # Exit successfully
        sys.exit(0)
        
    except CharsetNotFoundError as e:
        # Map to user-friendly message
        sys.stderr.write(f"Invalid character set: '{args.charset}'. Use one of: lower, upper, numeric, mixed.\n")
        sys.stderr.flush()
        sys.exit(1)
        
    except InvalidLengthError as e:
        # Map to user-friendly message  
        sys.stderr.write(f"Invalid password length: {args.length}. Length must be between 1 and 128.\n")
        sys.stderr.flush()
        sys.exit(1)
        
    except GeneratorError as e:
        # Base generator error (catches any unexpected generator errors)
        sys.stderr.write("Password generation failed. Check arguments and try again.\n")
        sys.stderr.flush()
        sys.exit(1)
        
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        sys.exit(130)


if __name__ == "__main__":
    main()