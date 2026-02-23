import os
import uuid
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from app.core.config import settings
from dotenv import load_dotenv

load_dotenv()

# NOTE: If using Supabase pooler (port 6543), you MUST disable prepared statements.
# For better performance, consider using direct connection (port 5432) instead.
DATABASE_URL = os.getenv("DATABASE_URL", settings.database_url)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if DATABASE_URL and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    raise ValueError(
        "Invalid DATABASE_URL format. Use postgresql:// or postgresql+asyncpg://"
    )


def _with_asyncpg_pooler_safety(url: str) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))

    # Required for PgBouncer transaction/statement pooling compatibility.
    query["prepared_statement_cache_size"] = "0"
    query["statement_cache_size"] = "0"

    return urlunparse(parsed._replace(query=urlencode(query)))


engine = None
AsyncSessionLocal = None


def _init_engine_if_needed():
    global engine, AsyncSessionLocal

    if engine is not None and AsyncSessionLocal is not None:
        return

    if not DATABASE_URL:
        raise ValueError(
            "DATABASE_URL is not set. Configure it in backend/.env before using DB routes."
        )

    safe_database_url = _with_asyncpg_pooler_safety(DATABASE_URL)

    engine = create_async_engine(
        safe_database_url,
        echo=False,
        poolclass=NullPool,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4().hex}__",
        },
    )
    AsyncSessionLocal = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

async def get_db():
    _init_engine_if_needed()
    async with AsyncSessionLocal() as session:
        yield session
