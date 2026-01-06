"""
ORION Image Processor
Offline OCR → Chunking → JSONL
"""

from pathlib import Path
from typing import List
import json
import subprocess
from datetime import datetime

from processors.base import BaseProcessor, Chunk
from config import config


TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


class ImageProcessor(BaseProcessor):

    # --------------------------------------------------
    # REQUIRED ABSTRACT PROPERTIES
    # --------------------------------------------------
    @property
    def doc_type(self) -> str:
        return "image"

    @property
    def supported_extensions(self) -> List[str]:
        return [".png", ".jpg", ".jpeg", ".bmp", ".webp", ".tiff"]

    # --------------------------------------------------
    # MAIN PIPELINE
    # --------------------------------------------------
    def process(self, file_path: Path) -> List[Chunk]:
        text = self._ocr_with_tesseract(file_path)

        if not text or not text.strip():
            return []

        chunks = self._chunk_text(text, file_path)

        # ✅ SAFETY GUARANTEE
        if not chunks:
            return []

        self._store_jsonl(chunks)
        return chunks

    # --------------------------------------------------
    # OCR
    # --------------------------------------------------
    def _ocr_with_tesseract(self, image_path: Path) -> str:
        try:
            result = subprocess.run(
                [TESSERACT_PATH, str(image_path), "stdout"],
                capture_output=True,
                text=True,
            )
            return result.stdout.strip()
        except Exception as e:
            print(f"[ImageProcessor] OCR failed: {e}")
            return ""

    # --------------------------------------------------
    # CHUNKING (FIXED + MULTI-CHUNK SAFE)
    # --------------------------------------------------
    def _chunk_text(self, text: str, image_path: Path) -> List[Chunk]:
        words = text.split()

        if not words:
            return []

        chunk_size = max(50, config.CHUNK_SIZE // 10)   # 🔥 adaptive
        overlap = min(10, chunk_size // 4)

        chunks: List[Chunk] = []
        start = 0
        chunk_id = 0

        while start < len(words):
            end = min(start + chunk_size, len(words))
            content = " ".join(words[start:end])

            if content.strip():
                chunks.append(
                    Chunk(
                        content=content,
                        metadata={
                            "chunk_id": chunk_id,
                            "doc_type": self.doc_type,
                            "source": image_path.name,
                            "ocr_engine": "tesseract",
                            "created_at": datetime.utcnow().isoformat(),
                        },
                    )
                )
                chunk_id += 1

            start += chunk_size - overlap

        return chunks

    # --------------------------------------------------
    # JSONL STORAGE
    # --------------------------------------------------
    def _store_jsonl(self, chunks: List[Chunk]):
        output_path = config.DATA_DIR / "image_ocr_chunks.jsonl"

        with open(output_path, "a", encoding="utf-8") as f:
            for chunk in chunks:
                f.write(
                    json.dumps(
                        {
                            "content": chunk.content,
                            "metadata": chunk.metadata,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
