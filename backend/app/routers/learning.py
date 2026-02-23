from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from app.database import get_db
from app.core.auth import get_current_user_context
from app.models.models import Resource
from app.services.flashcard_service import generate_flashcards
from app.services.quiz_service import generate_quiz
from uuid import UUID

router = APIRouter(prefix="/learning", tags=["learning"])

class LearningRequest(BaseModel):
    resource_id: str

@router.post("/generate-flashcards")
async def create_flashcards(
    request: LearningRequest,
    db: AsyncSession = Depends(get_db),
    user_context = Depends(get_current_user_context),
):
    try:
        user_id, _ = user_context
        resource_uuid = UUID(request.resource_id)
        resource = await db.scalar(
            select(Resource).where(Resource.id == resource_uuid, Resource.user_id == user_id)
        )
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")

        cards = await generate_flashcards(request.resource_id, db)
        return {"flashcards": cards}
    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource_id")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-quiz")
async def create_quiz(
    request: LearningRequest,
    db: AsyncSession = Depends(get_db),
    user_context = Depends(get_current_user_context),
):
    try:
        user_id, _ = user_context
        resource_uuid = UUID(request.resource_id)
        resource = await db.scalar(
            select(Resource).where(Resource.id == resource_uuid, Resource.user_id == user_id)
        )
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")

        quizzes = await generate_quiz(request.resource_id, db)
        return {"quizzes": quizzes}
    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource_id")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
