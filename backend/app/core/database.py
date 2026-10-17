import asyncpg
from app.core.config import settings

db_pool: asyncpg.Pool | None = None

async def init_db_pool() -> asyncpg.Pool:
    global db_pool
    if db_pool is None:
        dsn = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        db_pool = await asyncpg.create_pool(
            dsn=dsn,
            min_size=settings.DB_POOL_MIN_SIZE,
            max_size=settings.DB_POOL_MAX_SIZE
        )
    return db_pool

async def close_db_pool() -> None:
    global db_pool
    if db_pool is not None:
        await db_pool.close()
        db_pool = None

async def get_db_pool() -> asyncpg.Pool:
    if db_pool is None:
        raise RuntimeError("El pool de base de datos no ha sido inicializado.")
    return db_pool