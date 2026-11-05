"""
M3-01 — Workers AI claim extraction service.

Reusable service for extracting candidate claims from a specific content version
using Cloudflare Workers AI. Output is always validated with Pydantic before use.

AI boundaries (ADR-005):
  * AI extracts candidate claims, classifies language, explains findings, suggests corrections.
  * Deterministic engine is authoritative for exact comparisons, dates, terminology, scope.
  * AI never approves a claim, never creates supporting evidence, never establishes truth.
"""
import json
import logging
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger("brandcore.services.ai_extraction")

# Bounded limits for safe inference.
MAX_INPUT_CHARS = 4000
MAX_OUTPUT_TOKENS = 256

MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8"


class ClaimExtractionError(Exception):
    """Raised when claim extraction cannot be completed."""


class ClaimExtractionItem(BaseModel):
    """A single extracted claim, matching the M1 AiClaimExtraction schema."""
    claim_text: str
    claim_type: str | None = None
    numeric_value: str | int | float | None = None
    unit: str | None = None
    qualifier: str | None = None
    scope: str | None = None

    @property
    def numeric_value_str(self) -> str | None:
        """Always-string view of numeric_value for deterministic checks."""
        if self.numeric_value is None:
            return None
        return str(self.numeric_value)


class ClaimExtractionService:
    def __init__(self, model: str = MODEL):
        self.model = model

    def _build_prompt(self, body_text: str) -> str:
        truncated = body_text[:MAX_INPUT_CHARS]
        return (
            "You are a precise claim-extraction assistant for brand governance. "
            "Extract each factual or promotional claim from the supplied content "
            "into a JSON array of objects. Each object must have exactly these keys: "
            "claim_text (string), claim_type (string or null), numeric_value "
            "(string, integer, float, or null), unit (string or null), qualifier "
            "(string or null), scope (string or null). Use null for missing fields. "
            "Preserve qualifiers and scope exactly as stated. Do not invent claims. "
            "Return only the JSON array, no explanation.\n\n"
            f"Content:\n{truncated}"
        )

    def _strip_code_fences(self, raw: str) -> str:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            # Remove opening fence and optional language tag.
            cleaned = cleaned.split("```", 1)[-1]
            if cleaned.lstrip().lower().startswith("json"):
                cleaned = cleaned.lstrip()[4:]
            cleaned = cleaned.lstrip()
        # Remove trailing closing fence if present.
        if cleaned.rstrip().endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0].rstrip()
        return cleaned.strip()

    def _parse_response(self, raw: str) -> list[dict[str, Any]]:
        cleaned = self._strip_code_fences(raw)
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise ClaimExtractionError(f"Model returned malformed JSON: {exc}") from exc
        if isinstance(data, dict):
            data = [data]
        if not isinstance(data, list):
            raise ClaimExtractionError("Model response is not a JSON array or object")
        return data

    def _validate_item(self, item: dict[str, Any]) -> ClaimExtractionItem:
        try:
            return ClaimExtractionItem(**item)
        except Exception as exc:  # pydantic ValidationError
            raise ClaimExtractionError(f"Invalid claim extraction item: {exc}") from exc

    async def extract_claims(
        self,
        ai_binding: Any,
        workspace_id: str,
        content_version_id: str,
        body_text: str,
        extraction_batch_id: str,
    ) -> list[ClaimExtractionItem]:
        """
        Extract candidate claims from `body_text` using Workers AI.

        Returns a list of validated ClaimExtractionItem objects. Numeric values are
        normalized to strings via numeric_value_str for deterministic downstream
        comparison without floating-point loss.

        Raises ClaimExtractionError on binding errors, malformed output, or
        validation failures. Never approves a claim or invents evidence.
        """
        if ai_binding is None:
            raise ClaimExtractionError("Workers AI binding is unavailable")

        prompt = self._build_prompt(body_text)

        try:
            result = await ai_binding.run(
                self.model,
                {
                    "messages": [
                        {"role": "system", "content": "You are a precise JSON extractor. Output only valid JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": MAX_OUTPUT_TOKENS,
                },
            )
        except Exception as exc:
            logger.error("Workers AI inference failed: %s", exc)
            raise ClaimExtractionError(f"AI service error: {exc}") from exc

        raw = result.get("response", "") if isinstance(result, dict) else str(result)
        usage = result.get("usage") if isinstance(result, dict) else None
        logger.info("AI extraction complete for version %s in workspace %s", content_version_id, workspace_id)
        if usage:
            logger.debug("AI token usage: %s", usage)

        items = self._parse_response(raw)
        extractions: list[ClaimExtractionItem] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            extraction = self._validate_item(item)
            extractions.append(extraction)
        return extractions
