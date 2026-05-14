"""asyncpg connection pool — direct PostgreSQL access for schemas not exposed via PostgREST."""

import os

import asyncpg
from dotenv import load_dotenv

load_dotenv()

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    global _pool
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL not set — add it to .env "
            "(Supabase → Settings → Database → Connection string)"
        )
    _pool = await asyncpg.create_pool(
        url,
        min_size=1,
        max_size=10,
        # statement_cache_size=0 is required when the URL points to Supabase's
        # PgBouncer (transaction-mode pooler) because it does not support
        # PostgreSQL's named prepared statements.
        statement_cache_size=0,
        ssl="require",
    )


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError(
            "DB pool not initialized — check DATABASE_URL and the FastAPI lifespan"
        )
    return _pool
