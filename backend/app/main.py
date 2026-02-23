from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.routers import resource, chat, learning

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup logic here (e.g. connecting to DB)
    yield
    # Teardown logic here

app = FastAPI(title="Lumeris API", version="1.0.0", lifespan=lifespan)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resource.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(learning.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
