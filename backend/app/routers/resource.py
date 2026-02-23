from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from uuid import UUID
from app.database import get_db
from app.core.auth import get_current_user_context
from app.models.models import User, Resource, Document
from app.services.transcript_service import get_transcript, extract_video_id, chunk_text
from app.services.embedding_service import create_embedding
from app.services.pdf_service import extract_pdf_text
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resources", tags=["resources"])

class VideoRequest(BaseModel):
    url: str


def _dedupe_chunks(chunks: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for chunk in chunks:
        normalized = " ".join(chunk.split()).strip().lower()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(chunk)
    return deduped


@router.get("")
async def list_resources(
    db: AsyncSession = Depends(get_db),
    user_context = Depends(get_current_user_context),
):
    user_id, _ = user_context
    try:
        result = await db.execute(
            select(Resource).where(Resource.user_id == user_id).order_by(Resource.created_at.desc())
        )
        resources = result.scalars().all()
        return {
            "resources": [
                {
                    "id": str(resource.id),
                    "title": resource.title,
                    "type": resource.type,
                    "created_at": resource.created_at.isoformat() if resource.created_at else None,
                }
                for resource in resources
            ]
        }
    except Exception as e:
        logger.error(f"Failed to list resources: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch resources")


@router.get("/{resource_id}")
async def get_resource(
    resource_id: str,
    db: AsyncSession = Depends(get_db),
    user_context = Depends(get_current_user_context),
):
    user_id, _ = user_context
    try:
        parsed_id = UUID(resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource ID")

    try:
        resource = await db.scalar(
            select(Resource).where(Resource.id == parsed_id, Resource.user_id == user_id)
        )
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")

        return {
            "id": str(resource.id),
            "title": resource.title,
            "type": resource.type,
            "created_at": resource.created_at.isoformat() if resource.created_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch resource {resource_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch resource")


@router.post("/process-video")
async def process_video(
    request: VideoRequest,
    db: AsyncSession = Depends(get_db),
    user_context = Depends(get_current_user_context),
):
    try:
        user_id, email = user_context
        
        db_user = await db.scalar(select(User).where(User.id == user_id))
        if not db_user:
            if not email:
                raise HTTPException(status_code=400, detail="Missing x-user-email header")
            db_user = User(id=user_id, email=email)
            db.add(db_user)
            await db.commit()
            
        # 2. Extract Transcript
        logger.info(f"Extracting transcript for {request.url}")
        full_text = await get_transcript(request.url)
        video_id = extract_video_id(request.url)
        
        # 3. Create Resource
        resource = Resource(
            user_id=user_id,
            type="youtube",
            title=f"YouTube Video: {video_id}"  # You'd normally fetch YouTube metadata here
        )
        db.add(resource)
        await db.commit()
        await db.refresh(resource)
        
        # 4. Chunk & Embed
        logger.info("Chunking text...")
        chunks = _dedupe_chunks(chunk_text(full_text))
        
        logger.info("Generating embeddings and saving...")
        for chunk in chunks:
            vector = create_embedding(chunk)
            doc = Document(
                resource_id=resource.id,
                chunk_text=chunk,
                embedding=vector
            )
            db.add(doc)
            
        await db.commit()
        logger.info(f"Successfully processed video. Resource ID: {resource.id}")
        
        return {"status": "success", "resource_id": str(resource.id)}
        
    except ValueError as e:
        logger.warning(f"Video processing validation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-pdf")
async def process_pdf(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_context = Depends(get_current_user_context),
):
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        user_id, email = user_context
        
        db_user = await db.scalar(select(User).where(User.id == user_id))
        if not db_user:
            if not email:
                raise HTTPException(status_code=400, detail="Missing x-user-email header")
            db_user = User(id=user_id, email=email)
            db.add(db_user)
            await db.commit()
            
        # 2. Extract Text from PDF
        logger.info(f"Extracting bytes from PDF {file.filename}")
        file_bytes = await file.read()
        full_text = await extract_pdf_text(file_bytes)
        
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            
        # 3. Create Resource
        resource = Resource(
            user_id=user_id,
            type="pdf",
            title=f"Document: {file.filename}"
        )
        db.add(resource)
        await db.commit()
        await db.refresh(resource)
        
        # 4. Chunk & Embed
        logger.info("Chunking text...")
        chunks = _dedupe_chunks(chunk_text(full_text))
        
        logger.info("Generating embeddings and saving...")
        for chunk in chunks:
            vector = create_embedding(chunk)
            doc = Document(
                resource_id=resource.id,
                chunk_text=chunk,
                embedding=vector
            )
            db.add(doc)
            
        await db.commit()
        logger.info(f"Successfully processed PDF. Resource ID: {resource.id}")
        
        return {"status": "success", "resource_id": str(resource.id)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))
