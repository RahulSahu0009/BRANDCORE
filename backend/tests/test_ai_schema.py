"""
M1-06 schema validation tests.
Covers the approved fix: claim_type str|None, numeric_value str|int|float|None,
numeric_value_str normalizer.
No AI inference is made here.
"""
import pytest
from pydantic import ValidationError
from app.api.poc import AiClaimExtraction


def test_numeric_value_as_int_accepted():
    """Model returning numeric_value as int (e.g. 40) must not raise."""
    e = AiClaimExtraction(claim_text="Reduces time by 40%.", numeric_value=40)
    assert e.numeric_value == 40


def test_numeric_value_as_float_accepted():
    """Model returning numeric_value as float must not raise."""
    e = AiClaimExtraction(claim_text="Reduces time by 40.5%.", numeric_value=40.5)
    assert e.numeric_value == 40.5


def test_numeric_value_as_str_accepted():
    """Model returning numeric_value as str must not raise."""
    e = AiClaimExtraction(claim_text="Reduces time by 40%.", numeric_value="40")
    assert e.numeric_value == "40"


def test_numeric_value_none_accepted():
    """null numeric_value must not raise."""
    e = AiClaimExtraction(claim_text="Best platform.", numeric_value=None)
    assert e.numeric_value is None


def test_claim_type_none_accepted():
    """null claim_type (as returned in attempt 2) must not raise."""
    e = AiClaimExtraction(claim_text="Best platform.", claim_type=None)
    assert e.claim_type is None


def test_numeric_value_str_normalizer():
    """numeric_value_str always returns str or None regardless of input type."""
    assert AiClaimExtraction(claim_text="x", numeric_value=40).numeric_value_str == "40"
    assert AiClaimExtraction(claim_text="x", numeric_value=40.5).numeric_value_str == "40.5"
    assert AiClaimExtraction(claim_text="x", numeric_value="40").numeric_value_str == "40"
    assert AiClaimExtraction(claim_text="x", numeric_value=None).numeric_value_str is None
