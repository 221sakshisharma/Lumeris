import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.client import async_client

import json
from app.models.models import Document, Quiz

logger = logging.getLogger(__name__)

openai_client = async_client

async def generate_quiz(resource_id: str, session: AsyncSession) -> list[dict]:
    # 1. Retrieve all text associated with this resource
    result = await session.execute(select(Document).where(Document.resource_id == resource_id))
    documents = result.scalars().all()
    
    if not documents:
        raise ValueError("No content found for this resource")
        
    full_text = "\n\n".join([doc.chunk_text for doc in documents])
    
    if len(full_text) > 50000:
         full_text = full_text[:50000] # truncate safely for example

    system_prompt = """
    Generate 5-10 multiple choice questions based on the provided content.
    Each question must:
    - Have 4 options
    - Only one correct answer
    - Be conceptually challenging
    
    Return strictly valid JSON in the exact format:
    [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "B"}]
    Return JSON object with key 'quizzes'.
    """
    
    try:
        response = await openai_client.chat.completions.create(
             model="openai/gpt-4o-mini",
             response_format={ "type": "json_object" },
             messages=[
                 {"role": "system", "content": system_prompt},
                 {"role": "user", "content": f"Content:\n{full_text}\n\nReturn JSON object with key 'quizzes'."}
             ]
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from AI")
            
        data = json.loads(content)
        quizzes_data = data.get("quizzes", [])
        
        # 3. Save to database
        new_quizzes = []
        for q in quizzes_data:
            item = Quiz(
                resource_id=resource_id, 
                question=q["question"], 
                options=q["options"], 
                correct_answer=q["correct_answer"]
            )
            session.add(item)
            new_quizzes.append({
                "question": item.question, 
                "options": item.options, 
                "correct_answer": item.correct_answer
            })
            
        await session.commit()
        return new_quizzes
        
    except Exception as e:
        logger.error(f"Failed to generate quiz: {e}")
        raise ValueError("AI Quiz generation failed")
