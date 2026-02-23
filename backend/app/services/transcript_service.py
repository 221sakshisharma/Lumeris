import logging
import re
import asyncio
from urllib.parse import urlparse, parse_qs
from xml.etree.ElementTree import ParseError
from youtube_transcript_api import (
    YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled, VideoUnavailable
)

logger = logging.getLogger(__name__)

def extract_video_id(url: str) -> str:
    # Handle standard watch URLs.
    parsed = urlparse(url)
    video_id = parse_qs(parsed.query).get("v", [None])[0]
    if video_id and re.fullmatch(r"[0-9A-Za-z_-]{11}", video_id):
        return video_id

    # Handle /shorts/{id}, /embed/{id}, youtu.be/{id}, and other path forms.
    match = re.search(r"(?:youtu\.be\/|\/shorts\/|\/embed\/|\/v\/)([0-9A-Za-z_-]{11})", url)
    if match:
        return match.group(1)
    raise ValueError("Invalid YouTube URL")

async def get_transcript(url: str) -> str:
    video_id = extract_video_id(url)
    
    def fetch():
        api = YouTubeTranscriptApi()
        return api.fetch(video_id)
    
    try:
        transcript_items = await asyncio.to_thread(fetch)
        full_text = " ".join([item.text for item in transcript_items])
        if not full_text.strip():
            raise ValueError("Transcript is empty")
        return full_text
    except (NoTranscriptFound, TranscriptsDisabled, VideoUnavailable) as e:
        logger.error(f"Transcript error for video {video_id}: {e}")
        raise ValueError("This video has no transcript available.")
    except ParseError as e:
        logger.error(f"Transcript parse error for video {video_id}: {e}")
        raise ValueError("Could not read transcript data from YouTube for this video.")
    except Exception as e:
        logger.error(f"Unexpected error for video {video_id}: {e}")
        raise ValueError("Could not extract transcript from the provided video URL.")

def chunk_text(text: str, max_chars: int = 2000) -> list[str]:
    # Simple chunking by paragraph or length
    chunks = []
    current_chunk = ""
    
    sentences = text.replace('\n', ' ').split('. ')
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_chars:
            current_chunk += sentence + ". "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "
            
    if current_chunk:
        chunks.append(current_chunk.strip())
        
    return chunks
