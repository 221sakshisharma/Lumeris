import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.client import async_client
import json
from app.models.models import Document, Flashcard

logger = logging.getLogger(__name__)

openai_client = async_client

async def generate_flashcards(resource_id: str, session: AsyncSession) -> list[dict]:
    # 1. Retrieve all text associated with this resource
    result = await session.execute(select(Document).where(Document.resource_id == resource_id))
    documents = result.scalars().all()
    
    if not documents:
        raise ValueError("No content found for this resource")
        
    full_text = "\n\n".join([doc.chunk_text for doc in documents])
    
    # Token limits might require summarize first, but assuming we send it to gpt-4o-mini
    # Max input chunking could be handled here
    if len(full_text) > 50000:
         full_text = full_text[:50000] # truncate safely for example

    system_prompt = """
    Generate 10-15 concise flashcards from the provided content.
    Keep questions clear and exam-oriented.
    Answers should be short but conceptually strong.
    Return strictly valid JSON in the exact format: [{"question": "...", "answer": "..."}]
    """
    
    try:
        response = await openai_client.chat.completions.create(
            model="openai/gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Content:\n{full_text}\n\nReturn JSON object with key 'flashcards'."}
            ]
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from AI")
            
        data = json.loads(content)
        flashcards_data = data.get("flashcards", [])
        
        # 3. Save to database
        new_flashcards = []
        for fc in flashcards_data:
            item = Flashcard(resource_id=resource_id, question=fc["question"], answer=fc["answer"])
            session.add(item)
            new_flashcards.append({"question": item.question, "answer": item.answer})
            
        await session.commit()
        return new_flashcards
        
    except Exception as e:
        logger.error(f"Failed to generate flashcards: {e}")
        raise ValueError("AI Flashcard generation failed")
