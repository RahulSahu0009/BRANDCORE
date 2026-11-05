"""
M2-07 — Claim-fact dependency repository.

Traverses dependencies from fact to affected claims and from claim to
supporting facts. All queries are workspace-scoped.
"""
import json
from app.domain.models import ClaimFactDependency, ClaimFactDependencyCreate, ListResult
from app.repositories.base import BaseRepository


class ClaimFactDependencyRepository(BaseRepository):
    async def create(self, dependency_id: str, workspace_id: str,
                     data: ClaimFactDependencyCreate) -> ClaimFactDependency:
        from app.domain.models import now_utc
        created = now_utc()
        await self._run(
            """
            INSERT INTO claim_fact_dependency
                (id, workspace_id, claim_id, claim_workspace, fact_id, fact_workspace,
                 dependency_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (dependency_id, workspace_id, data.claim_id, data.claim_workspace,
             data.fact_id, data.fact_workspace, data.dependency_type, created),
        )
        return await self.get(dependency_id, workspace_id)

    async def get(self, dependency_id: str, workspace_id: str) -> ClaimFactDependency | None:
        row = await self._first(
            "SELECT * FROM claim_fact_dependency WHERE id = ? AND workspace_id = ?",
            (dependency_id, workspace_id),
        )
        return ClaimFactDependency(**row) if row else None

    async def claims_for_fact(self, fact_id: str, workspace_id: str) -> ListResult:
        """All claims that depend on (support/reference) a given fact."""
        rows = await self._all(
            """
            SELECT c.* FROM candidate_claim c
            JOIN claim_fact_dependency d ON d.claim_id = c.id AND d.claim_workspace = c.workspace_id
            WHERE d.fact_id = ? AND d.fact_workspace = ?
            ORDER BY c.extracted_at
            """,
            (fact_id, workspace_id),
        )
        # Need claim_workspace for the model; candidate_claim row has workspace_id.
        items = []
        for r in rows:
            items.append(ClaimFactDependency(
                id=r["id"], workspace_id=r["workspace_id"],
                claim_id=r["id"], claim_workspace=r["workspace_id"],
                fact_id=fact_id, fact_workspace=workspace_id,
                dependency_type="supports", created_at=r["extracted_at"],
            ))
        return ListResult(items=items, total=len(items))

    async def facts_for_claim(self, claim_id: str, workspace_id: str) -> ListResult:
        """All facts that support/reference a given claim."""
        rows = await self._all(
            """
            SELECT f.* FROM approved_fact f
            JOIN claim_fact_dependency d ON d.fact_id = f.id AND d.fact_workspace = f.workspace_id
            WHERE d.claim_id = ? AND d.claim_workspace = ?
            ORDER BY f.version DESC
            """,
            (claim_id, workspace_id),
        )
        items = []
        for r in rows:
            items.append(ClaimFactDependency(
                id=f"dep-{claim_id}-{r['id']}", workspace_id=r["workspace_id"],
                claim_id=claim_id, claim_workspace=workspace_id,
                fact_id=r["id"], fact_workspace=r["workspace_id"],
                dependency_type="supports", created_at=r["created_at"],
            ))
        return ListResult(items=items, total=len(items))

    async def list_by_claim(self, claim_id: str, workspace_id: str) -> ListResult:
        rows = await self._all(
            "SELECT * FROM claim_fact_dependency WHERE claim_id = ? AND claim_workspace = ? "
            "ORDER BY created_at",
            (claim_id, workspace_id),
        )
        return ListResult(items=[ClaimFactDependency(**r) for r in rows], total=len(rows))

    async def list_by_fact(self, fact_id: str, workspace_id: str) -> ListResult:
        rows = await self._all(
            "SELECT * FROM claim_fact_dependency WHERE fact_id = ? AND fact_workspace = ? "
            "ORDER BY created_at",
            (fact_id, workspace_id),
        )
        return ListResult(items=[ClaimFactDependency(**r) for r in rows], total=len(rows))
