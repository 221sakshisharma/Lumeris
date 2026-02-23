from fastapi import APIRouter, Depends
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from app.database import get_db
from app.core.auth import get_current_user_context
from app.models.models import ChatHistory, Resource
from app.services.rag_service import generate_chat_response
from uuid import UUID

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    query: str
    resource_id: str


@router.get("/history/{resource_id}")
async def get_chat_history(
    resource_id: str,
    db: AsyncSession = Depends(get_db),
    user_context = Depends(get_current_user_context),
):
    user_id, _ = user_context
    try:
        resource_uuid = UUID(resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource_id")

    resource = await db.scalar(
        select(Resource).where(Resource.id == resource_uuid, Resource.user_id == user_id)
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.resource_id == resource_uuid)
        .order_by(ChatHistory.created_at.asc())
    )
    history = result.scalars().all()

    return {
        "messages": [
            {
                "id": str(message.id),
                "role": message.role,
                "message": message.message,
                "created_at": message.created_at.isoformat() if message.created_at else None,
            }
            for message in history
            if message.role in {"user", "assistant"}
        ]
    }


@router.delete("/history/{resource_id}")
async def clear_chat_history(
    resource_id: str,
    db: AsyncSession = Depends(get_db),
    user_context = Depends(get_current_user_context),
):
    user_id, _ = user_context
    try:
        resource_uuid = UUID(resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource_id")

    resource = await db.scalar(
        select(Resource).where(Resource.id == resource_uuid, Resource.user_id == user_id)
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    await db.execute(delete(ChatHistory).where(ChatHistory.resource_id == resource_uuid))
    await db.commit()

    return {"status": "success"}


@router.post("/")
async def chat_endpoint(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user_context = Depends(get_current_user_context),
):
    user_id, _ = user_context
    try:
        resource_uuid = UUID(request.resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource_id")

    resource = await db.scalar(
        select(Resource).where(Resource.id == resource_uuid, Resource.user_id == user_id)
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    stream = await generate_chat_response(request.query, request.resource_id, db)
    return StreamingResponse(stream, media_type="text/event-stream")
