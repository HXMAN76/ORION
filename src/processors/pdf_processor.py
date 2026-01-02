"""PDF document processor with text, table, and image extraction"""
from pathlib import Path
from typing import List, Optional
import fitz  # PyMuPDF
import io

from .base import BaseProcessor, Chunk
from ..chunking import Chunker


class PDFProcessor(BaseProcessor):
    """Process PDF files extracting text, tables, and images"""
    
    @property
    def supported_extensions(self) -> List[str]:
        return [".pdf"]
    
    @property
    def doc_type(self) -> str:
        return "pdf"
    
    def __init__(self, chunker: Optional[Chunker] = None, use_ocr: bool = True):
        """
        Initialize PDF processor.
        
        Args:
            chunker: Text chunker instance (uses default if not provided)
            use_ocr: Whether to use OCR for scanned pages/images
        """
        self.chunker = chunker or Chunker()
        self.use_ocr = use_ocr
        self._ocr = None
    
    def _get_ocr(self):
        """Lazy load OCR engine"""
        if self._ocr is None and self.use_ocr:
            try:
                from paddleocr import PaddleOCR
                self._ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            except ImportError:
                print("Warning: PaddleOCR not installed, OCR disabled")
        return self._ocr
    
    def process(self, file_path: Path, document_id: Optional[str] = None) -> List[Chunk]:
        """
        Process a PDF file and extract chunks.
        
        Args:
            file_path: Path to the PDF file
            document_id: Optional document identifier
            
        Returns:
            List of Chunk objects with text content and metadata
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"PDF file not found: {file_path}")
        
        document_id = document_id or self._generate_document_id(file_path)
        chunks: List[Chunk] = []
        
        doc = fitz.open(file_path)
        
        for page_num, page in enumerate(doc, start=1):
            # Extract text
            text = page.get_text("text")
            
            # If no text found, try OCR
            if not text.strip() and self.use_ocr:
                text = self._ocr_page(page)
            
            if text.strip():
                # Chunk the text
                text_chunks = self.chunker.chunk(text)
                
                for idx, chunk_text in enumerate(text_chunks):
                    chunks.append(Chunk(
                        content=chunk_text,
                        document_id=document_id,
                        doc_type=self.doc_type,
                        source_file=str(file_path),
                        page=page_num,
                        metadata={
                            "chunk_index": idx,
                            "total_chunks_in_page": len(text_chunks)
                        }
                    ))
            
            # Extract tables as markdown
            tables = self._extract_tables(page)
            for table_idx, table_md in enumerate(tables):
                chunks.append(Chunk(
                    content=table_md,
                    document_id=document_id,
                    doc_type=self.doc_type,
                    source_file=str(file_path),
                    page=page_num,
                    metadata={
                        "content_type": "table",
                        "table_index": table_idx
                    }
                ))
        
        doc.close()
        return chunks
    
    def _ocr_page(self, page) -> str:
        """Run OCR on a page"""
        ocr = self._get_ocr()
        if ocr is None:
            return ""
        
        try:
            # Render page to image
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            
            # Run OCR
            result = ocr.ocr(img_bytes, cls=True)
            
            if result and result[0]:
                lines = [line[1][0] for line in result[0]]
                return "\n".join(lines)
        except Exception as e:
            print(f"OCR error: {e}")
        
        return ""
    
    def _extract_tables(self, page) -> List[str]:
        """Extract tables from page and convert to markdown"""
        tables = []
        
        try:
            # Use PyMuPDF's table finder
            tabs = page.find_tables()
            
            for tab in tabs:
                df = tab.to_pandas()
                if not df.empty:
                    # Convert to markdown table
                    md = df.to_markdown(index=False)
                    tables.append(md)
        except Exception as e:
            # Table extraction may not be available in all PyMuPDF versions
            pass
        
        return tables
