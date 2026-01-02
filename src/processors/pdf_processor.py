"""
PDF Processor with OCR support.
Extracts text, images, tables from PDF files and processes embedded images with OCR.
"""

import logging
from pathlib import Path
from typing import List, Optional
import fitz  # PyMuPDF
from PIL import Image
import io

from .base import BaseProcessor, Chunk, ProcessingError

# Lazy imports for optional dependencies
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False

logger = logging.getLogger(__name__)


class PDFProcessor(BaseProcessor):
    """
    Process PDF files extracting text, tables, and images.
    Uses PyMuPDF for text extraction and PaddleOCR for embedded images.
    """
    
    SUPPORTED_EXTENSIONS = {".pdf"}
    
    def __init__(self, config: Optional[any] = None):
        """
        Initialize PDF processor.
        
        Args:
            config: Configuration object with OCR settings
        """
        super().__init__(config)
        self.ocr = None
        
        # Initialize OCR if enabled and available
        if config and config.processing.ocr_enabled and PADDLE_AVAILABLE:
            try:
                self.ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang=config.processing.ocr_language,
                    show_log=False
                )
                logger.info("PaddleOCR initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize PaddleOCR: {e}")
                self.ocr = None
    
    def supports(self, file_path: Path) -> bool:
        """Check if file is a PDF"""
        return file_path.suffix.lower() in self.SUPPORTED_EXTENSIONS
    
    def process(self, file_path: Path) -> List[Chunk]:
        """
        Process PDF file and extract all content.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            List of Chunk objects with extracted content
        """
        self.validate_file(file_path)
        
        chunks = []
        chunk_index = 0
        
        try:
            # Open PDF
            doc = fitz.open(file_path)
            logger.info(f"Processing PDF: {file_path.name} ({doc.page_count} pages)")
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                
                # Extract text content
                text = page.get_text("text").strip()
                if text:
                    chunk = self._create_chunk(
                        content=text,
                        source=str(file_path),
                        file_type="pdf",
                        chunk_index=chunk_index,
                        page=page_num + 1,
                        total_pages=doc.page_count
                    )
                    chunks.append(chunk)
                    chunk_index += 1
                
                # Extract tables
                tables = self._extract_tables(page)
                for table_idx, table_text in enumerate(tables):
                    chunk = self._create_chunk(
                        content=table_text,
                        source=str(file_path),
                        file_type="pdf",
                        chunk_index=chunk_index,
                        page=page_num + 1,
                        content_type="table",
                        table_index=table_idx
                    )
                    chunks.append(chunk)
                    chunk_index += 1
                
                # Extract images and run OCR
                if self.ocr:
                    image_chunks = self._extract_images_with_ocr(page, file_path, page_num + 1, chunk_index)
                    chunks.extend(image_chunks)
                    chunk_index += len(image_chunks)
            
            doc.close()
            logger.info(f"Extracted {len(chunks)} chunks from {file_path.name}")
            
        except Exception as e:
            raise ProcessingError(f"Failed to process PDF {file_path}: {str(e)}")
        
        return chunks
    
    def _extract_tables(self, page: fitz.Page) -> List[str]:
        """
        Extract tables from PDF page and convert to markdown.
        
        Args:
            page: PyMuPDF page object
            
        Returns:
            List of table contents as markdown strings
        """
        tables = []
        
        try:
            # Extract tables using PyMuPDF
            tabs = page.find_tables()
            
            for table in tabs:
                # Convert table to markdown format
                markdown_table = self._table_to_markdown(table)
                if markdown_table:
                    tables.append(markdown_table)
        
        except Exception as e:
            logger.warning(f"Failed to extract tables: {e}")
        
        return tables
    
    def _table_to_markdown(self, table) -> Optional[str]:
        """
        Convert PyMuPDF table to markdown format.
        
        Args:
            table: PyMuPDF table object
            
        Returns:
            Markdown formatted table string
        """
        try:
            rows = table.extract()
            if not rows:
                return None
            
            # Build markdown table
            md_lines = []
            
            # Header
            if rows:
                header = " | ".join(str(cell) if cell else "" for cell in rows[0])
                md_lines.append(f"| {header} |")
                md_lines.append("|" + " --- |" * len(rows[0]))
            
            # Rows
            for row in rows[1:]:
                row_text = " | ".join(str(cell) if cell else "" for cell in row)
                md_lines.append(f"| {row_text} |")
            
            return "\n".join(md_lines)
        
        except Exception as e:
            logger.warning(f"Failed to convert table to markdown: {e}")
            return None
    
    def _extract_images_with_ocr(
        self,
        page: fitz.Page,
        file_path: Path,
        page_num: int,
        start_chunk_index: int
    ) -> List[Chunk]:
        """
        Extract images from page and run OCR.
        
        Args:
            page: PyMuPDF page object
            file_path: Source PDF path
            page_num: Page number
            start_chunk_index: Starting chunk index
            
        Returns:
            List of chunks with OCR text
        """
        chunks = []
        chunk_index = start_chunk_index
        
        try:
            # Get images from page
            image_list = page.get_images()
            
            for img_idx, img in enumerate(image_list):
                try:
                    # Extract image
                    xref = img[0]
                    base_image = page.parent.extract_image(xref)
                    image_bytes = base_image["image"]
                    
                    # Convert to PIL Image
                    pil_image = Image.open(io.BytesIO(image_bytes))
                    
                    # Run OCR
                    ocr_text = self._run_ocr(pil_image)
                    
                    if ocr_text and ocr_text.strip():
                        chunk = self._create_chunk(
                            content=ocr_text,
                            source=str(file_path),
                            file_type="pdf",
                            chunk_index=chunk_index,
                            page=page_num,
                            content_type="image_ocr",
                            image_index=img_idx
                        )
                        chunks.append(chunk)
                        chunk_index += 1
                
                except Exception as e:
                    logger.warning(f"Failed to process image {img_idx} on page {page_num}: {e}")
                    continue
        
        except Exception as e:
            logger.warning(f"Failed to extract images from page {page_num}: {e}")
        
        return chunks
    
    def _run_ocr(self, image: Image.Image) -> str:
        """
        Run OCR on an image.
        
        Args:
            image: PIL Image object
            
        Returns:
            Extracted text
        """
        if not self.ocr:
            return ""
        
        try:
            # Convert to numpy array
            import numpy as np
            img_array = np.array(image)
            
            # Run OCR
            result = self.ocr.ocr(img_array, cls=True)
            
            # Extract text from results
            if result and result[0]:
                text_parts = []
                for line in result[0]:
                    if line[1]:  # text and confidence
                        text_parts.append(line[1][0])
                
                return "\n".join(text_parts)
        
        except Exception as e:
            logger.warning(f"OCR failed: {e}")
        
        return ""
