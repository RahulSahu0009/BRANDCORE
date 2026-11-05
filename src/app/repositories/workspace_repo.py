"""
M2-05 — Workspace repository.

All queries are workspace-scoped. Never fetch by ID alone when workspace
ownership can be checked in the same query.
"""
from app.domain.models import ListResult, Workspace, WorkspaceCreate, WorkspaceUpdate, now_utc
from app.repositories.base import BaseRepository


class WorkspaceRepository(BaseRepository):
    async def create(self, workspace_id: str, data: WorkspaceCreate) -> Workspace:
        created = now_utc()
        await self._run(
            """
            INSERT INTO workspace (id, name, slug, demo_flag, status, created_at, updated_at)
            VALUES (?, ?, ?, 1, ?, ?, ?)
            """,
            (workspace_id, data.name, data.slug, data.status, created, created),
        )
        return await self.get(workspace_id)

    async def get(self, workspace_id: str) -> Workspace | None:
        row = await self._first(
            "SELECT * FROM workspace WHERE id = ?", (workspace_id,)
        )
        return Workspace(**row) if row else None

    async def get_by_slug(self, slug: str) -> Workspace | None:
        row = await self._first(
            "SELECT * FROM workspace WHERE slug = ?", (slug,)
        )
        return Workspace(**row) if row else None

    async def list(self, status: str | None = None) -> ListResult:
        if status is not None:
            rows = await self._all(
                "SELECT * FROM workspace WHERE status = ? ORDER BY name", (status,)
            )
        else:
            rows = await self._all("SELECT * FROM workspace ORDER BY name")
        return ListResult(items=[Workspace(**r) for r in rows], total=len(rows))

    async def update(self, workspace_id: str, data: WorkspaceUpdate) -> Workspace | None:
        sets = []
        params: list = []
        if data.name is not None:
            sets.append("name = ?"); params.append(data.name)
        if data.slug is not None:
            sets.append("slug = ?"); params.append(data.slug)
        if data.status is not None:
            sets.append("status = ?"); params.append(data.status)
        if not sets:
            return await self.get(workspace_id)
        sets.append("updated_at = ?")
        params.append(now_utc())
        params.append(workspace_id)
        await self._run(
            f"UPDATE workspace SET {', '.join(sets)} WHERE id = ?", tuple(params)
        )
        return await self.get(workspace_id)
