"""DOCX document processor"""
from pathlib import Path
from typing import List, Optional
from docx import Document
from docx.table import Table
import io

from .base import BaseProcessor, Chunk
from ..chunking import Chunker


class DOCXProcessor(BaseProcessor):
    """Process DOCX files extracting text, tables, and embedded images"""
    
    @property
    def supported_extensions(self) -> List[str]:
        return [".docx", ".doc"]
    
    @property
    def doc_type(self) -> str:
        return "docx"
    
    def __init__(self, chunker: Optional[Chunker] = None):
        """
        Initialize DOCX processor.
        
        Args:
            chunker: Text chunker instance (uses default if not provided)
        """
        self.chunker = chunker or Chunker()
    
    def process(self, file_path: Path, document_id: Optional[str] = None) -> List[Chunk]:
        """
        Process a DOCX file and extract chunks.
        
        Args:
            file_path: Path to the DOCX file
            document_id: Optional document identifier
            
        Returns:
            List of Chunk objects with text content and metadata
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"DOCX file not found: {file_path}")
        
        document_id = document_id or self._generate_document_id(file_path)
        chunks: List[Chunk] = []
        
        doc = Document(file_path)
        
        # Extract paragraphs
        full_text = []
        current_section = ""
        
        for para in doc.paragraphs:
            # Check if it's a heading
            if para.style.name.startswith('Heading'):
                if full_text:
                    # Chunk the accumulated text
                    self._add_text_chunks(
                        chunks, 
                        "\n".join(full_text), 
                        document_id, 
                        file_path,
                        current_section
                    )
                    full_text = []
                current_section = para.text
            else:
                if para.text.strip():
                    full_text.append(para.text)
        
        # Don't forget the last section
        if full_text:
            self._add_text_chunks(
                chunks, 
                "\n".join(full_text), 
                document_id, 
                file_path,
                current_section
            )
        
        # Extract tables
        for table_idx, table in enumerate(doc.tables):
            table_md = self._table_to_markdown(table)
            if table_md:
                chunks.append(Chunk(
                    content=table_md,
                    document_id=document_id,
                    doc_type=self.doc_type,
                    source_file=str(file_path),
                    metadata={
                        "content_type": "table",
                        "table_index": table_idx
                    }
                ))
        
        return chunks
    
    def _add_text_chunks(
        self, 
        chunks: List[Chunk], 
        text: str, 
        document_id: str,
        file_path: Path,
        section: str = ""
    ):
        """Add chunked text to the chunks list"""
        text_chunks = self.chunker.chunk(text)
        
        for idx, chunk_text in enumerate(text_chunks):
            content = chunk_text
            if section:
                content = f"[Section: {section}]\n\n{chunk_text}"
            
            chunks.append(Chunk(
                content=content,
                document_id=document_id,
                doc_type=self.doc_type,
                source_file=str(file_path),
                metadata={
                    "section": section,
                    "chunk_index": idx
                }
            ))
    
    def _table_to_markdown(self, table: Table) -> str:
        """Convert a DOCX table to markdown format"""
        rows = []
        
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            rows.append("| " + " | ".join(cells) + " |")
        
        if len(rows) >= 1:
            # Add header separator
            header_sep = "| " + " | ".join(["---"] * len(table.rows[0].cells)) + " |"
            rows.insert(1, header_sep)
        
        return "\n".join(rows) if rows else ""
