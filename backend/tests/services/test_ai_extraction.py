"""
M3-01 Workers AI claim extraction service tests.

Uses a fake Workers AI binding with deterministic fixtures. No remote inference
is performed — the absence of a live call is clearly distinguished from
mock-based unit tests.
"""
import asyncio
import json
import os
import sqlite3

import pytest

from app.services.ai_extraction import (
    ClaimExtractionError,
    ClaimExtractionItem,
    ClaimExtractionService,
)


class FakeAI:
    """Deterministic fake Workers AI binding. Returns `response` for .run()."""

    def __init__(self, response: str | None = None, usage: dict | None = None,
                 raise_on_call: bool = False):
        self._response = response
        self._usage = usage or {}
        self._raise = raise_on_call
        self.calls = 0

    async def run(self, model: str, payload: dict):
        self.calls += 1
        if self._raise:
            raise RuntimeError("AI upstream error")
        return {"response": self._response, "usage": self._usage}


def _run(coro):
    return asyncio.run(coro)


def _service():
    return ClaimExtractionService()


VALID_RESPONSE = json.dumps([
    {"claim_text": "Reduces time by 40 percent.", "claim_type": "factual",
     "numeric_value": 40, "unit": "percent", "qualifier": None, "scope": None},
    {"claim_text": "Best platform for all teams.", "claim_type": None,
     "numeric_value": None, "unit": None, "qualifier": None, "scope": None},
])

def test_valid_structured_response():
    ai = FakeAI(VALID_RESPONSE)
    items = _run(_service().extract_claims(ai, "ws-1", "cv-1", "Some content.", "batch-1"))
    assert len(items) == 2
    assert items[0].claim_text == "Reduces time by 40 percent."
    assert items[0].claim_type == "factual"
    assert items[0].numeric_value_str == "40"
    assert items[0].unit == "percent"
    assert items[1].claim_type is None
    assert items[1].numeric_value_str is None


def test_null_claim_type():
    response = json.dumps([{"claim_text": "Best platform.", "claim_type": None,
                            "numeric_value": None, "unit": None, "qualifier": None, "scope": None}])
    ai = FakeAI(response)
    items = _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))
    assert items[0].claim_type is None


def test_null_numeric_value():
    response = json.dumps([{"claim_text": "Best platform.", "claim_type": "general",
                            "numeric_value": None, "unit": None, "qualifier": None, "scope": None}])
    ai = FakeAI(response)
    items = _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))
    assert items[0].numeric_value_str is None


def test_integer_numeric_value():
    response = json.dumps([{"claim_text": "Reduces by 40.", "claim_type": "factual",
                            "numeric_value": 40, "unit": None, "qualifier": None, "scope": None}])
    ai = FakeAI(response)
    items = _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))
    assert items[0].numeric_value == 40
    assert items[0].numeric_value_str == "40"


def test_decimal_numeric_value():
    response = json.dumps([{"claim_text": "Reduces by 40.5.", "claim_type": "factual",
                            "numeric_value": 40.5, "unit": None, "qualifier": None, "scope": None}])
    ai = FakeAI(response)
    items = _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))
    assert items[0].numeric_value == 40.5
    assert items[0].numeric_value_str == "40.5"


def test_string_numeric_value():
    response = json.dumps([{"claim_text": "Reduces by 40.", "claim_type": "factual",
                            "numeric_value": "40", "unit": None, "qualifier": None, "scope": None}])
    ai = FakeAI(response)
    items = _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))
    assert items[0].numeric_value == "40"
    assert items[0].numeric_value_str == "40"


def test_malformed_json_raises():
    ai = FakeAI("not json at all {{{")
    with pytest.raises(ClaimExtractionError):
        _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))


def test_code_fence_wrapped_response():
    response = "```json\n" + json.dumps([{"claim_text": "x", "claim_type": None,
                                          "numeric_value": None, "unit": None,
                                          "qualifier": None, "scope": None}]) + "\n```"
    ai = FakeAI(response)
    items = _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))
    assert len(items) == 1


def test_single_object_response():
    response = json.dumps({"claim_text": "x", "claim_type": None,
                           "numeric_value": None, "unit": None, "qualifier": None, "scope": None})
    ai = FakeAI(response)
    items = _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))
    assert len(items) == 1


def test_invalid_fields_raise():
    response = json.dumps([{"claim_text": 123}])  # claim_text must be str
    ai = FakeAI(response)
    with pytest.raises(ClaimExtractionError):
        _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))


def test_ai_binding_unavailable_raises():
    with pytest.raises(ClaimExtractionError):
        _run(_service().extract_claims(None, "ws-1", "cv-1", "c", "b"))


def test_ai_service_error_raises():
    ai = FakeAI(raise_on_call=True)
    with pytest.raises(ClaimExtractionError):
        _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))


class CapturingFakeAI(FakeAI):
    """Fake binding that captures the last prompt sent to the model."""

    def __init__(self, response: str = "[]", usage: dict | None = None):
        super().__init__(response=response, usage=usage)
        self.last_prompt: str | None = None

    async def run(self, model: str, payload: dict):
        messages = payload.get("messages", [])
        for m in messages:
            if m.get("role") == "user":
                self.last_prompt = m.get("content", "")
        return await super().run(model, payload)


def test_input_size_limit_truncation():
    ai = CapturingFakeAI("[]")
    long_body = "x" * 10000
    _run(_service().extract_claims(ai, "ws-1", "cv-1", long_body, "b"))
    assert ai.last_prompt is not None
    # The content portion of the prompt must be truncated to MAX_INPUT_CHARS.
    content_marker = "Content:\n"
    idx = ai.last_prompt.find(content_marker)
    assert idx >= 0
    content = ai.last_prompt[idx + len(content_marker):]
    from app.services.ai_extraction import MAX_INPUT_CHARS
    assert len(content) == MAX_INPUT_CHARS


def test_no_remote_inference():
    """Confirms only a fake binding is used — no live Workers AI call."""
    ai = FakeAI(VALID_RESPONSE)
    items = _run(_service().extract_claims(ai, "ws-1", "cv-1", "c", "b"))
    assert ai.calls == 1
    assert len(items) == 2
