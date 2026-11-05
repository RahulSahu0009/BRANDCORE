"""
M2-06 — Review decision repository.

Human review decisions recorded against exact content versions.
"""
from app.domain.models import ListResult, ReviewDecision, ReviewDecisionCreate, now_utc
from app.repositories.base import BaseRepository


class ReviewDecisionRepository(BaseRepository):
    async def create(self, decision_id: str, workspace_id: str, data: ReviewDecisionCreate) -> ReviewDecision:
        created = now_utc()
        await self._run(
            """
            INSERT INTO review_decision
                (id, workspace_id, content_version_id, reviewer_id, reviewer_role,
                 decision, rationale, notes, analysis_batch_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                decision_id, workspace_id, data.content_version_id, data.reviewer_id,
                data.reviewer_role, data.decision, data.rationale, data.notes,
                data.analysis_batch_id, created,
            ),
        )
        return await self.get(decision_id, workspace_id)

    async def get(self, decision_id: str, workspace_id: str) -> ReviewDecision | None:
        row = await self._first(
            "SELECT * FROM review_decision WHERE id = ? AND workspace_id = ?",
            (decision_id, workspace_id),
        )
        return ReviewDecision(**row) if row else None

    async def list_by_version(
        self, content_version_id: str, workspace_id: str
    ) -> ListResult:
        rows = await self._all(
            """
            SELECT * FROM review_decision
            WHERE content_version_id = ? AND workspace_id = ?
            ORDER BY created_at
            """,
            (content_version_id, workspace_id),
        )
        return ListResult(items=[ReviewDecision(**r) for r in rows], total=len(rows))

    async def list_by_decision(
        self, workspace_id: str, decision: str
    ) -> ListResult:
        rows = await self._all(
            """
            SELECT * FROM review_decision
            WHERE workspace_id = ? AND decision = ?
            ORDER BY created_at
            """,
            (workspace_id, decision),
        )
        return ListResult(items=[ReviewDecision(**r) for r in rows], total=len(rows))
