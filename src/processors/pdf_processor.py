"""PDF document processor with text, table, and image extraction"""
from pathlib import Path
from typing import List, Optional
import fitz  # PyMuPDF
import io

from .base import BaseProcessor, Chunk
from ..chunking import Chunker
from ..config import config


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
            use_ocr: Whether to use OCR for scanned pages/images (enabled by default)
        """
        self.chunker = chunker or Chunker()
        self.use_ocr = use_ocr
        self._ocr = None
    
    def _get_ocr(self):
        """Lazy load OCR engine"""
        if self._ocr is None and self.use_ocr:
            try:
                from ..ocr import DeepSeekOCR
                self._ocr = DeepSeekOCR(
                    model_name=config.DEEPSEEK_MODEL,
                    host=config.OLLAMA_HOST
                )
                if not self._ocr.is_available():
                    print(f"Warning: DeepSeek model '{config.DEEPSEEK_MODEL}' not found in Ollama")
                    print(f"To enable OCR, run: ollama pull {config.DEEPSEEK_MODEL}")
                    self._ocr = None
            except ImportError as e:
                print(f"Warning: OCR module not available: {e}")
                self._ocr = None
            except Exception as e:
                print(f"Warning: DeepSeek OCR failed to initialize: {e}")
                self._ocr = None
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
        """Run OCR on a page using DeepSeek"""
        ocr = self._get_ocr()
        if ocr is None:
            return ""
        
        try:
            import tempfile
            
            # Render page to image at high DPI for better OCR
            pix = page.get_pixmap(dpi=200)
            
            # Save to temporary file (DeepSeek OCR needs file path)
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = Path(tmp.name)
                pix.save(str(tmp_path))
            
            try:
                # Use DeepSeek OCR to extract text
                text = ocr.extract_text(tmp_path)
                return text
            finally:
                # Clean up temporary file
                if tmp_path.exists():
                    tmp_path.unlink()
        
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
