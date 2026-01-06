"""PDF document processor with text, table, and image extraction"""
from pathlib import Path
from typing import List, Optional
import fitz  # PyMuPDF
import io
import tempfile

from .base import BaseProcessor, Chunk
from ..chunking import Chunker
from ..ocr import DeepSeekOCR


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
                self._ocr = DeepSeekOCR()
                if not self._ocr.is_available():
                    print("Warning: DeepSeek model not found in Ollama, OCR disabled")
                    print("To enable OCR, run: ollama pull deepseek-vl")
                    self._ocr = None
            except ImportError:
                print("Warning: Ollama not installed, OCR disabled")
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
            ocr_tables = []
            
            # If no text found, try OCR
            if not text.strip() and self.use_ocr:
                text, ocr_tables = self._ocr_page(page)
            
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
                            "total_chunks_in_page": len(text_chunks),
                            "extraction_method": "ocr" if not page.get_text("text").strip() else "native"
                        }
                    ))
            
            # Add OCR-extracted tables
            for table_idx, table_md in enumerate(ocr_tables):
                chunks.append(Chunk(
                    content=table_md,
                    document_id=document_id,
                    doc_type=self.doc_type,
                    source_file=str(file_path),
                    page=page_num,
                    metadata={
                        "content_type": "table",
                        "table_index": table_idx,
                        "extraction_method": "deepseek_ocr"
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
    
    def _ocr_page(self, page) -> tuple[str, List[str]]:
        """Run OCR on a page and extract both text and tables"""
        ocr = self._get_ocr()
        if ocr is None:
            return "", []
        
        try:
            # Render page to temporary image file
            pix = page.get_pixmap(dpi=200)  # Higher DPI for better OCR
            
            # Save to temporary file for DeepSeek
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = Path(tmp.name)
                pix.save(str(tmp_path))
            
            try:
                # Extract full content (text + tables)
                content = ocr.extract_full_content(tmp_path)
                text = content.get("text", "")
                tables = content.get("tables", [])
                
                return text, tables
            finally:
                # Clean up temporary file
                if tmp_path.exists():
                    tmp_path.unlink()
        
        except Exception as e:
            print(f"OCR error: {e}")
            return "", []
    
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
