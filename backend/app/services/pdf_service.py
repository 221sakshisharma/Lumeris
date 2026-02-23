import logging
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

async def extract_pdf_text(file_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text() + " "
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}")
        raise ValueError("Failed to extract text from PDF.")
