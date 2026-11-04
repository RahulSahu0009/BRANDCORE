"""
Shared FastAPI dependencies for BRANDCORE.
"""
from fastapi import Depends, HTTPException, Request


async def require_development_env(request: Request) -> None:
    """
    Permit the request only when BRANDCORE_ENV is exactly 'development'.

    Reads BRANDCORE_ENV from request.scope['env'], which is the Cloudflare
    Python Workers binding object injected by the Workers ASGI runtime.

    Fails closed (HTTP 404) for:
    - production environment
    - missing scope['env'] (no Workers runtime present)
    - missing BRANDCORE_ENV binding on the env object
    - any value other than 'development'

    HTTP 404 is used deliberately: it reveals nothing about the existence
    of the route to an unauthenticated caller.
    """
    env = request.scope.get("env")
    if env is None:
        raise HTTPException(status_code=404)
    brandcore_env = getattr(env, "BRANDCORE_ENV", None)
    if brandcore_env != "development":
        raise HTTPException(status_code=404)
