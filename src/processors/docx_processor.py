"""
DOCX Processor for Word documents.
Extracts text, tables, images, headers, and footers from .docx files.
"""

import logging
from pathlib import Path
from typing import List, Optional
from io import BytesIO

from .base import BaseProcessor, Chunk, ProcessingError

# Lazy imports for optional dependencies
try:
    from docx import Document
    from docx.table import Table
    from docx.oxml.table import CT_Tbl
    from docx.oxml.text.paragraph import CT_P
    from docx.text.paragraph import Paragraph
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False

logger = logging.getLogger(__name__)


class DOCXProcessor(BaseProcessor):
    """
    Process DOCX files extracting text, tables, images, headers, and footers.
    Uses python-docx for parsing and PaddleOCR for embedded images.
    """
    
    SUPPORTED_EXTENSIONS = {".docx", ".doc"}
    
    def __init__(self, config: Optional[any] = None):
        """
        Initialize DOCX processor.
        
        Args:
            config: Configuration object with OCR settings
        """
        super().__init__(config)
        
        if not DOCX_AVAILABLE:
            raise ImportError("python-docx is required for DOCX processing. Install with: pip install python-docx")
        
        self.ocr = None
        
        # Initialize OCR if enabled and available
        if config and config.processing.ocr_enabled and PADDLE_AVAILABLE:
            try:
                self.ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang=config.processing.ocr_language,
                    show_log=False
                )
                logger.info("PaddleOCR initialized for DOCX processor")
            except Exception as e:
                logger.warning(f"Failed to initialize PaddleOCR: {e}")
                self.ocr = None
    
    def supports(self, file_path: Path) -> bool:
        """Check if file is a DOCX"""
        return file_path.suffix.lower() in self.SUPPORTED_EXTENSIONS
    
    def process(self, file_path: Path) -> List[Chunk]:
        """
        Process DOCX file and extract all content.
        
        Args:
            file_path: Path to DOCX file
            
        Returns:
            List of Chunk objects with extracted content
        """
        self.validate_file(file_path)
        
        chunks = []
        chunk_index = 0
        
        try:
            # Open document
            doc = Document(file_path)
            logger.info(f"Processing DOCX: {file_path.name}")
            
            # Extract header content
            for section in doc.sections:
                header_text = self._extract_header_footer(section.header)
                if header_text:
                    chunk = self._create_chunk(
                        content=header_text,
                        source=str(file_path),
                        file_type="docx",
                        chunk_index=chunk_index,
                        content_type="header"
                    )
                    chunks.append(chunk)
                    chunk_index += 1
            
            # Process document body (paragraphs and tables in order)
            for element in self._iter_block_items(doc):
                if isinstance(element, Paragraph):
                    text = element.text.strip()
                    if text:
                        # Determine if it's a heading
                        style = element.style.name if element.style else "Normal"
                        is_heading = style.startswith("Heading")
                        
                        chunk = self._create_chunk(
                            content=text,
                            source=str(file_path),
                            file_type="docx",
                            chunk_index=chunk_index,
                            content_type="heading" if is_heading else "paragraph",
                            style=style
                        )
                        chunks.append(chunk)
                        chunk_index += 1
                
                elif isinstance(element, Table):
                    table_text = self._extract_table(element)
                    if table_text:
                        chunk = self._create_chunk(
                            content=table_text,
                            source=str(file_path),
                            file_type="docx",
                            chunk_index=chunk_index,
                            content_type="table"
                        )
                        chunks.append(chunk)
                        chunk_index += 1
            
            # Extract footer content
            for section in doc.sections:
                footer_text = self._extract_header_footer(section.footer)
                if footer_text:
                    chunk = self._create_chunk(
                        content=footer_text,
                        source=str(file_path),
                        file_type="docx",
                        chunk_index=chunk_index,
                        content_type="footer"
                    )
                    chunks.append(chunk)
                    chunk_index += 1
            
            # Extract embedded images and run OCR
            if self.ocr and PIL_AVAILABLE:
                image_chunks = self._extract_images_with_ocr(doc, file_path, chunk_index)
                chunks.extend(image_chunks)
                chunk_index += len(image_chunks)
            
            logger.info(f"Extracted {len(chunks)} chunks from {file_path.name}")
        
        except Exception as e:
            raise ProcessingError(f"Failed to process DOCX {file_path}: {str(e)}")
        
        return chunks
    
    def _iter_block_items(self, parent):
        """
        Generate a reference to each paragraph and table child within parent,
        in document order. Each returned value is an instance of either Table or Paragraph.
        
        Args:
            parent: Document or other parent element
            
        Yields:
            Paragraph or Table objects
        """
        if hasattr(parent, 'element'):
            parent_elm = parent.element.body
        else:
            parent_elm = parent
        
        for child in parent_elm.iterchildren():
            if isinstance(child, CT_P):
                yield Paragraph(child, parent)
            elif isinstance(child, CT_Tbl):
                yield Table(child, parent)
    
    def _extract_table(self, table: Table) -> str:
        """
        Extract table content and format as markdown.
        
        Args:
            table: python-docx Table object
            
        Returns:
            Markdown formatted table string
        """
        try:
            if not table.rows:
                return ""
            
            md_lines = []
            
            # Header row
            header_cells = [cell.text.strip() for cell in table.rows[0].cells]
            md_lines.append("| " + " | ".join(header_cells) + " |")
            md_lines.append("|" + " --- |" * len(header_cells))
            
            # Data rows
            for row in table.rows[1:]:
                row_cells = [cell.text.strip() for cell in row.cells]
                md_lines.append("| " + " | ".join(row_cells) + " |")
            
            return "\n".join(md_lines)
        
        except Exception as e:
            logger.warning(f"Failed to extract table: {e}")
            return ""
    
    def _extract_header_footer(self, header_footer) -> str:
        """
        Extract text from header or footer.
        
        Args:
            header_footer: Header or Footer object
            
        Returns:
            Extracted text
        """
        try:
            paragraphs = [p.text.strip() for p in header_footer.paragraphs if p.text.strip()]
            return "\n".join(paragraphs)
        except Exception as e:
            logger.warning(f"Failed to extract header/footer: {e}")
            return ""
    
    def _extract_images_with_ocr(self, doc: Document, file_path: Path, start_chunk_index: int) -> List[Chunk]:
        """
        Extract embedded images from document and run OCR.
        
        Args:
            doc: Document object
            file_path: Source DOCX path
            start_chunk_index: Starting chunk index
            
        Returns:
            List of chunks with OCR text
        """
        chunks = []
        chunk_index = start_chunk_index
        
        try:
            # Extract images from document relationships
            for rel in doc.part.rels.values():
                if "image" in rel.target_ref:
                    try:
                        # Get image data
                        image_data = rel.target_part.blob
                        
                        # Convert to PIL Image
                        image = Image.open(BytesIO(image_data))
                        
                        # Run OCR
                        ocr_text = self._run_ocr(image)
                        
                        if ocr_text and ocr_text.strip():
                            chunk = self._create_chunk(
                                content=ocr_text,
                                source=str(file_path),
                                file_type="docx",
                                chunk_index=chunk_index,
                                content_type="image_ocr",
                                image_name=rel.target_ref
                            )
                            chunks.append(chunk)
                            chunk_index += 1
                    
                    except Exception as e:
                        logger.warning(f"Failed to process image {rel.target_ref}: {e}")
                        continue
        
        except Exception as e:
            logger.warning(f"Failed to extract images: {e}")
        
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
