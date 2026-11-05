from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.health import router as health_router
from .api.poc import router as poc_router
from .api.analyze import router as analyze_router
from .api.dependencies import require_development_env
from .auth.dependencies import require_workspace_access

app = FastAPI(title="BRANDCORE API", version="0.1.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(health_router, prefix="/api")

# Product analysis endpoint — requires Clerk authentication + workspace authorization.
app.include_router(
    analyze_router,
    prefix="/api",
    dependencies=[Depends(require_workspace_access("workspace_id"))],
)

# POC routes are guarded by require_development_env.
app.include_router(
    poc_router,
    prefix="/api",
    dependencies=[Depends(require_development_env)],
)
