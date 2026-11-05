"""
M2-06 — Candidate claim repository.

All queries are workspace-scoped. Claims are grouped by extraction_batch_id.
"""
from app.domain.models import CandidateClaim, CandidateClaimCreate, ListResult, now_utc
from app.repositories.base import BaseRepository


class CandidateClaimRepository(BaseRepository):
    async def create(self, claim_id: str, workspace_id: str, data: CandidateClaimCreate) -> CandidateClaim:
        created = now_utc()
        await self._run(
            """
            INSERT INTO candidate_claim
                (id, workspace_id, content_version_id, claim_text, claim_type,
                 numeric_value_text, unit, qualifier, scope,
                 extraction_batch_id, extracted_by, extracted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                claim_id, workspace_id, data.content_version_id, data.claim_text,
                data.claim_type, data.numeric_value_text, data.unit, data.qualifier,
                data.scope, data.extraction_batch_id, data.extracted_by, created,
            ),
        )
        return await self.get(claim_id, workspace_id)

    async def get(self, claim_id: str, workspace_id: str) -> CandidateClaim | None:
        row = await self._first(
            "SELECT * FROM candidate_claim WHERE id = ? AND workspace_id = ?",
            (claim_id, workspace_id),
        )
        return CandidateClaim(**row) if row else None

    async def list_by_version(
        self, content_version_id: str, workspace_id: str
    ) -> ListResult:
        rows = await self._all(
            """
            SELECT * FROM candidate_claim
            WHERE content_version_id = ? AND workspace_id = ?
            ORDER BY extracted_at
            """,
            (content_version_id, workspace_id),
        )
        return ListResult(items=[CandidateClaim(**r) for r in rows], total=len(rows))

    async def list_by_batch(
        self, extraction_batch_id: str, workspace_id: str
    ) -> ListResult:
        rows = await self._all(
            """
            SELECT * FROM candidate_claim
            WHERE extraction_batch_id = ? AND workspace_id = ?
            ORDER BY extracted_at
            """,
            (extraction_batch_id, workspace_id),
        )
        return ListResult(items=[CandidateClaim(**r) for r in rows], total=len(rows))
