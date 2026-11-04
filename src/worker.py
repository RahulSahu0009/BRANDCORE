# BRANDCORE — Cloudflare Python Worker entry point.
# Location: src/worker.py (project root src/ — pywrangler convention).
#
# Wrangler looks for a class named 'Default' in the main module.
# workers.asgi.entrypoint() returns a WorkerEntrypoint subclass; assigning
# it to 'Default' satisfies the runtime requirement.
#
# Official pattern: https://developers.cloudflare.com/workers/languages/python/packages/fastapi/

from workers.asgi import entrypoint

from app.main import app

Default = entrypoint(app)
