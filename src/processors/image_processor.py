"""Image processor with OCR and vision model descriptions"""
from pathlib import Path
from typing import List, Optional
import base64

from .base import BaseProcessor, Chunk
from ..config import config


class ImageProcessor(BaseProcessor):
    """Process images using OCR and vision model descriptions"""
    
    @property
    def supported_extensions(self) -> List[str]:
        return [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"]
    
    @property
    def doc_type(self) -> str:
        return "image"
    
    def __init__(self, use_ocr: bool = False, use_vision: bool = True):
        """
        Initialize image processor.
        
        Args:
            use_ocr: Whether to extract text using OCR (disabled by default)
            use_vision: Whether to generate descriptions using vision model
        """
        self.use_ocr = use_ocr
        self.use_vision = use_vision
        self._ocr = None
        self._ollama = None
    
    def _get_ocr(self):
        """Lazy load OCR engine"""
        if self._ocr is None and self.use_ocr:
            try:
                from paddleocr import PaddleOCR
                self._ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            except ImportError:
                print("Warning: PaddleOCR not installed, OCR disabled")
        return self._ocr
    
    def _get_ollama(self):
        """Lazy load Ollama client"""
        if self._ollama is None and self.use_vision:
            try:
                import ollama
                self._ollama = ollama
            except ImportError:
                print("Warning: Ollama not installed, vision disabled")
        return self._ollama
    
    def process(self, file_path: Path, document_id: Optional[str] = None) -> List[Chunk]:
        """
        Process an image file and extract chunks.
        
        Args:
            file_path: Path to the image file
            document_id: Optional document identifier
            
        Returns:
            List of Chunk objects with OCR text and/or vision description
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Image file not found: {file_path}")
        
        document_id = document_id or self._generate_document_id(file_path)
        chunks: List[Chunk] = []
        
        # Extract text using OCR
        if self.use_ocr:
            ocr_text = self._run_ocr(file_path)
            if ocr_text.strip():
                chunks.append(Chunk(
                    content=ocr_text,
                    document_id=document_id,
                    doc_type=self.doc_type,
                    source_file=str(file_path),
                    metadata={
                        "content_type": "ocr_text",
                        "extraction_method": "paddleocr"
                    }
                ))
        
        # Generate vision description
        if self.use_vision:
            description = self._get_vision_description(file_path)
            if description:
                chunks.append(Chunk(
                    content=f"[Image Description]\n{description}",
                    document_id=document_id,
                    doc_type=self.doc_type,
                    source_file=str(file_path),
                    metadata={
                        "content_type": "vision_description",
                        "model": config.VISION_MODEL
                    }
                ))
        
        # If nothing extracted, create a placeholder chunk
        if not chunks:
            chunks.append(Chunk(
                content=f"[Image: {file_path.name}]",
                document_id=document_id,
                doc_type=self.doc_type,
                source_file=str(file_path),
                metadata={"content_type": "placeholder"}
            ))
        
        return chunks
    
    def _run_ocr(self, file_path: Path) -> str:
        """Run OCR on the image"""
        ocr = self._get_ocr()
        if ocr is None:
            return ""
        
        try:
            result = ocr.ocr(str(file_path), cls=True)
            
            if result and result[0]:
                lines = [line[1][0] for line in result[0]]
                return "\n".join(lines)
        except Exception as e:
            print(f"OCR error: {e}")
        
        return ""
    
    def _get_vision_description(self, file_path: Path) -> str:
        """Get image description from vision model"""
        ollama = self._get_ollama()
        if ollama is None:
            return ""
        
        try:
            # Read and encode image
            with open(file_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode()
            
            # Call vision model
            response = ollama.chat(
                model=config.VISION_MODEL,
                messages=[{
                    "role": "user",
                    "content": "Describe this image in detail. Include any text, objects, people, colors, and relevant information visible.",
                    "images": [image_data]
                }]
            )
            
            return response["message"]["content"]
        except Exception as e:
            print(f"Vision model error: {e}")
        
        return ""
