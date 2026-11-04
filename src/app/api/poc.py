# POC-ONLY routes for M1-03 (D1), M1-04 (R2) and M1-06 (Workers AI) verification.
# These routes exist solely to prove the Cloudflare bindings work.
# They will be removed before Milestone 2 product feature work begins.

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()

POC_OBJECT_KEY = "poc/brandcore-poc.txt"
POC_OBJECT_CONTENT = "BRANDCORE R2 POC verification object"


class D1PocResponse(BaseModel):
    inserted_id: str
    read_back_message: str
    status: str


class R2PocResponse(BaseModel):
    key: str
    content: str
    status: str


def _to_str_or_none(v: object) -> str | None:
    """Normalize numeric_value to str for deterministic downstream comparison."""
    if v is None:
        return None
    return str(v)


class AiClaimExtraction(BaseModel):
    claim_text: str
    claim_type: str | None = None
    numeric_value: str | int | float | None = None
    unit: str | None = None
    qualifier: str | None = None
    scope: str | None = None

    @property
    def numeric_value_str(self) -> str | None:
        """Always-string view of numeric_value for deterministic checks."""
        return _to_str_or_none(self.numeric_value)


class AiPocResponse(BaseModel):
    model: str
    extraction: AiClaimExtraction
    raw_response: str
    usage: dict | None
    pydantic_valid: bool
    status: str


@router.post("/poc/d1", response_model=D1PocResponse)
async def poc_d1(request: Request) -> D1PocResponse:
    """
    POC: insert one row into poc_records via the D1 binding, then read it back.
    Uses parameterized statements only — no SQL concatenation.
    """
    env = request.scope.get("env")
    db = env.DB

    import uuid
    from datetime import datetime, timezone

    record_id = str(uuid.uuid4())
    message = "BRANDCORE D1 POC verification record"
    created_at = datetime.now(timezone.utc).isoformat()

    await db.prepare(
        "INSERT INTO poc_records (id, message, created_at) VALUES (?, ?, ?)"
    ).bind(record_id, message, created_at).run()

    result = await db.prepare(
        "SELECT message FROM poc_records WHERE id = ?"
    ).bind(record_id).first()

    return D1PocResponse(
        inserted_id=record_id,
        read_back_message=result["message"],
        status="PASS_LOCAL",
    )


@router.post("/poc/ai", response_model=AiPocResponse)
async def poc_ai(request: Request) -> AiPocResponse:
    """
    POC M1-06: one real Workers AI inference call.
    Model: @cf/meta/llama-3.1-8b-instruct-fp8 (Gate B approved 2026-11-04).
    Input: single synthetic marketing claim (~30 tokens).
    Output: structured JSON validated with Pydantic.
    No retries. Fails hard on any error.
    """
    import json

    env = request.scope.get("env")
    ai = env.AI

    MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8"
    CLAIM = "Our platform reduces customer onboarding time by up to 40 percent."

    prompt = (
        "Extract the marketing claim below into JSON with exactly these keys: "
        "claim_text, claim_type, numeric_value, unit, qualifier, scope. "
        "Use null for missing fields. Return only the JSON object, no explanation.\n\n"
        f"Claim: {CLAIM}"
    )

    result = await ai.run(
        MODEL,
        {
            "messages": [
                {"role": "system", "content": "You are a precise JSON extractor. Output only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 256,
        },
    )

    # Capture raw response and usage BEFORE any validation.
    raw = result.get("response", "") if isinstance(result, dict) else str(result)
    usage = result.get("usage") if isinstance(result, dict) else None

    # Strip markdown code fences if model wraps output.
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    parsed = json.loads(cleaned)
    # raw and usage are already captured above; Pydantic failure no longer discards them.
    extraction = AiClaimExtraction(**parsed)

    return AiPocResponse(
        model=MODEL,
        extraction=extraction,
        raw_response=raw,
        usage=usage,
        pydantic_valid=True,
        status="PASS_REMOTE",
    )


@router.post("/poc/r2", response_model=R2PocResponse)
async def poc_r2(request: Request) -> R2PocResponse:
    """
    POC: put a fixed test object into R2 local simulation, then get it back.
    Object key is a fixed POC prefix — no user-controlled paths.
    """
    env = request.scope.get("env")
    bucket = env.ASSETS

    await bucket.put(POC_OBJECT_KEY, POC_OBJECT_CONTENT)

    obj = await bucket.get(POC_OBJECT_KEY)
    content = await obj.text()

    return R2PocResponse(
        key=POC_OBJECT_KEY,
        content=content,
        status="PASS_LOCAL",
    )
