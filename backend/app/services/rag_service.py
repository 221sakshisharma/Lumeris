import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.services.embedding_service import create_embedding
from app.client import async_client
from app.models.models import ChatHistory

logger = logging.getLogger(__name__)

openai_client = async_client


def _novel_suffix(existing: str, incoming: str) -> str:
    if not incoming:
        return ""
    if not existing:
        return incoming
    if incoming in existing or existing.endswith(incoming):
        return ""
    if incoming.startswith(existing):
        return incoming[len(existing):]

    max_overlap = min(len(existing), len(incoming))
    for overlap in range(max_overlap, 0, -1):
        if existing.endswith(incoming[:overlap]):
            return incoming[overlap:]

    return incoming

async def generate_chat_response(query: str, resource_id: str, session: AsyncSession):
    # 1. Create embedding for the user query
    query_vector = create_embedding(query)
    vector_str = f"[{','.join(map(str, query_vector))}]"
    
    # 2. Perform similarity search (Postgres pgvector)
    # Using cosine similarity (<=>) to get top 5 chunks
    sql = text("""
        SELECT chunk_text
        FROM (
            SELECT
                chunk_text,
                MIN(embedding <=> CAST(:vector AS vector)) AS distance
            FROM documents
            WHERE resource_id = :resource_id
            GROUP BY chunk_text
        ) ranked
        ORDER BY distance
        LIMIT 5;
    """)
    result = await session.execute(sql, {"resource_id": resource_id, "vector": vector_str})
    chunks = result.scalars().all()
    
    context = "\n\n".join(chunks)

    if not context.strip():
        async def empty_context_stream():
            yield (
                "I couldn't find enough extracted content for this resource yet. "
                "Try re-processing the resource, then ask again."
            )
        return empty_context_stream()
    
    # 3. Save user message to history
    user_msg = ChatHistory(resource_id=resource_id, role="user", message=query)
    session.add(user_msg)
    await session.commit()
    
    # 4. Interact with OpenAI (Streaming)
    system_prompt = (
        "You are Lumeris, an AI learning assistant. "
        "Answer using only the provided context. "
        "When asked for a topic or title, infer the most likely high-level topic from clues in the context "
        "(speaker, examples, repeated ideas, and summary details). "
        "Do not default to 'I don't know' if reasonable inference is possible from context. "
        "If evidence is weak, provide a best-effort answer and label it as low confidence. "
        "Use concise, clear language."
    )
    
    try:
        response = await openai_client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
            ],
            stream=True
        )
        
        full_response = ""
        last_raw_chunk = ""
        
        # Yield generator for streaming, but we should collect it for the DB
        async def stream_generator():
            nonlocal full_response, last_raw_chunk
            async for chunk in response:
                content = chunk.choices[0].delta.content
                if not content:
                    continue

                # Some providers may send repeated or cumulative chunk text.
                # Normalize to true delta before emitting to client.
                delta = _novel_suffix(full_response, content)
                if content == last_raw_chunk:
                    continue

                last_raw_chunk = content

                if delta:
                    full_response += delta
                    yield delta
                    
            # Save assistant response after streaming finishes
            try:
                assistant_msg = ChatHistory(resource_id=resource_id, role="assistant", message=full_response)
                session.add(assistant_msg)
                await session.commit()
            except Exception as e:
                logger.error(f"Failed to save assistant response: {e}")

        return stream_generator()
        
    except Exception as e:
        logger.error(f"OpenAI error: {e}")
        raise ValueError("Failed to generate response")
