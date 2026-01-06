from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil

from config import config
from vectorstore import ChromaStore
from processors import (
    PDFProcessor,
    DOCXProcessor,
    ImageProcessor,
    VoiceProcessor,
)

router = APIRouter()

store = ChromaStore()

PROCESSORS = {
    ".pdf": PDFProcessor(),
    ".docx": DOCXProcessor(),
    ".doc": DOCXProcessor(),
    ".png": ImageProcessor(),
    ".jpg": ImageProcessor(),
    ".jpeg": ImageProcessor(),
    ".bmp": ImageProcessor(),
    ".webp": ImageProcessor(),
    ".mp3": VoiceProcessor(),
    ".wav": VoiceProcessor(),
}


@router.post("/ingest")
async def ingest_file(
    file: UploadFile = File(...),
    collections: list[str] | None = None,
):
    suffix = Path(file.filename).suffix.lower()

    if suffix not in PROCESSORS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    processor = PROCESSORS[suffix]

    upload_path = config.UPLOADS_DIR / file.filename

    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # ✅ STEP 1: PROCESS → GET CHUNKS
    chunks = processor.process(upload_path)

    if not chunks:
        return {
            "filename": file.filename,
            "doc_type": processor.doc_type,
            "chunks_created": 0,
            "collections": collections or [config.COLLECTION_NAME],
        }

    # ✅ STEP 2: STORE (NO RETURN EXPECTED)
    store.add_chunks(chunks, collections=collections)

    # ✅ STEP 3: COUNT SAFELY
    return {
        "filename": file.filename,
        "doc_type": processor.doc_type,
        "chunks_created": len(chunks),
        "collections": collections or [config.COLLECTION_NAME],
    }
