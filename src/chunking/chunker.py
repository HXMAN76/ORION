"""
Semantic chunker for splitting text into meaningful chunks.
Preserves section headers, handles overlap, and targets optimal chunk sizes for retrieval.
"""

import re
import logging
from typing import List, Optional, Tuple
from dataclasses import dataclass

from ..processors.base import Chunk

logger = logging.getLogger(__name__)


@dataclass
class ChunkConfig:
    """Configuration for chunking behavior"""
    chunk_size: int = 512  # Target tokens per chunk
    chunk_overlap: int = 128  # Overlap between chunks
    min_chunk_size: int = 100  # Minimum chunk size to keep
    preserve_sections: bool = True  # Keep section headers with chunks
    
    # Approximate tokens per character (rough estimate: 1 token ≈ 4 chars)
    chars_per_token: float = 4.0
    
    @property
    def chunk_size_chars(self) -> int:
        """Convert token count to character count"""
        return int(self.chunk_size * self.chars_per_token)
    
    @property
    def overlap_chars(self) -> int:
        """Convert overlap tokens to characters"""
        return int(self.chunk_overlap * self.chars_per_token)
    
    @property
    def min_size_chars(self) -> int:
        """Convert min size tokens to characters"""
        return int(self.min_chunk_size * self.chars_per_token)


class SemanticChunker:
    """
    Chunks text into semantically meaningful segments with overlap.
    Preserves document structure and section boundaries.
    """
    
    # Patterns for identifying section breaks
    SECTION_PATTERNS = [
        r'^#{1,6}\s+.+$',  # Markdown headers
        r'^[A-Z][^.!?]*:$',  # Title case followed by colon
        r'^\d+\.\s+[A-Z]',  # Numbered sections
        r'^[IVX]+\.\s+',  # Roman numerals
    ]
    
    def __init__(self, config: Optional[ChunkConfig] = None):
        """
        Initialize the chunker.
        
        Args:
            config: Chunking configuration, uses defaults if None
        """
        self.config = config or ChunkConfig()
        self.section_regex = re.compile('|'.join(self.SECTION_PATTERNS), re.MULTILINE)
    
    def chunk_text(self, text: str, metadata: Optional[dict] = None) -> List[Chunk]:
        """
        Split text into chunks with overlap.
        
        Args:
            text: Text to chunk
            metadata: Base metadata to include in all chunks
            
        Returns:
            List of Chunk objects
        """
        if not text or not text.strip():
            return []
        
        metadata = metadata or {}
        chunks = []
        
        # Split into paragraphs first
        paragraphs = self._split_paragraphs(text)
        
        # Group paragraphs into chunks
        current_chunk = []
        current_size = 0
        chunk_index = 0
        section_header = None
        
        for para in paragraphs:
            para_size = len(para)
            
            # Check if this is a section header
            if self.config.preserve_sections and self._is_section_header(para):
                # If we have a current chunk, save it
                if current_chunk:
                    chunk_text = "\n\n".join(current_chunk)
                    if len(chunk_text) >= self.config.min_size_chars:
                        chunks.append(self._create_text_chunk(
                            chunk_text,
                            chunk_index,
                            metadata,
                            section_header
                        ))
                        chunk_index += 1
                    current_chunk = []
                    current_size = 0
                
                # Update section header
                section_header = para
                current_chunk.append(para)
                current_size += para_size
            
            # Check if adding this paragraph would exceed chunk size
            elif current_size + para_size > self.config.chunk_size_chars and current_chunk:
                # Save current chunk
                chunk_text = "\n\n".join(current_chunk)
                if len(chunk_text) >= self.config.min_size_chars:
                    chunks.append(self._create_text_chunk(
                        chunk_text,
                        chunk_index,
                        metadata,
                        section_header
                    ))
                    chunk_index += 1
                
                # Start new chunk with overlap
                overlap_text = self._get_overlap(current_chunk)
                current_chunk = [overlap_text, para] if overlap_text else [para]
                current_size = len(overlap_text) + para_size if overlap_text else para_size
            
            else:
                # Add paragraph to current chunk
                current_chunk.append(para)
                current_size += para_size
        
        # Don't forget the last chunk
        if current_chunk:
            chunk_text = "\n\n".join(current_chunk)
            if len(chunk_text) >= self.config.min_size_chars:
                chunks.append(self._create_text_chunk(
                    chunk_text,
                    chunk_index,
                    metadata,
                    section_header
                ))
        
        logger.info(f"Created {len(chunks)} chunks from {len(text)} characters")
        return chunks
    
    def chunk_documents(self, document_chunks: List[Chunk]) -> List[Chunk]:
        """
        Further chunk already-processed document chunks (e.g., from processors).
        Useful when document chunks are too large.
        
        Args:
            document_chunks: List of chunks from document processors
            
        Returns:
            List of refined chunks
        """
        all_chunks = []
        
        for doc_chunk in document_chunks:
            # If chunk is already small enough, keep it
            if len(doc_chunk.content) <= self.config.chunk_size_chars:
                all_chunks.append(doc_chunk)
            else:
                # Split into smaller chunks
                sub_chunks = self.chunk_text(doc_chunk.content, doc_chunk.metadata)
                
                # Update chunk indices to maintain order
                for i, sub_chunk in enumerate(sub_chunks):
                    sub_chunk.metadata["parent_chunk_index"] = doc_chunk.metadata.get("chunk_index", 0)
                    sub_chunk.metadata["sub_chunk_index"] = i
                
                all_chunks.extend(sub_chunks)
        
        return all_chunks
    
    def _split_paragraphs(self, text: str) -> List[str]:
        """
        Split text into paragraphs.
        
        Args:
            text: Text to split
            
        Returns:
            List of paragraph strings
        """
        # Split on double newlines or more
        paragraphs = re.split(r'\n\s*\n', text)
        
        # Clean up and filter empty paragraphs
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        
        return paragraphs
    
    def _is_section_header(self, text: str) -> bool:
        """
        Check if text looks like a section header.
        
        Args:
            text: Text to check
            
        Returns:
            True if likely a section header
        """
        # Check against patterns
        if self.section_regex.search(text):
            return True
        
        # Check for short, title-case text
        if len(text) < 100 and text[0].isupper():
            # Count uppercase words
            words = text.split()
            if len(words) <= 10:
                uppercase_count = sum(1 for w in words if w[0].isupper())
                if uppercase_count / len(words) > 0.5:
                    return True
        
        return False
    
    def _get_overlap(self, chunks: List[str]) -> str:
        """
        Get overlap text from the end of current chunks.
        
        Args:
            chunks: Current chunk paragraphs
            
        Returns:
            Overlap text
        """
        if not chunks:
            return ""
        
        # Get the last few paragraphs for overlap
        overlap_chars = 0
        overlap_paras = []
        
        for para in reversed(chunks):
            if overlap_chars + len(para) <= self.config.overlap_chars:
                overlap_paras.insert(0, para)
                overlap_chars += len(para)
            else:
                # Take partial paragraph if needed
                if overlap_chars < self.config.overlap_chars // 2:
                    remaining = self.config.overlap_chars - overlap_chars
                    overlap_paras.insert(0, para[-remaining:])
                break
        
        return "\n\n".join(overlap_paras)
    
    def _create_text_chunk(
        self,
        text: str,
        chunk_index: int,
        base_metadata: dict,
        section_header: Optional[str] = None
    ) -> Chunk:
        """
        Create a Chunk object from text.
        
        Args:
            text: Chunk content
            chunk_index: Index of this chunk
            base_metadata: Base metadata to include
            section_header: Optional section header
            
        Returns:
            Chunk object
        """
        metadata = {
            **base_metadata,
            "chunk_index": chunk_index,
            "char_count": len(text),
            "token_count": len(text) // int(self.config.chars_per_token),
        }
        
        if section_header:
            metadata["section"] = section_header
        
        return Chunk(content=text, metadata=metadata)
    
    def merge_small_chunks(self, chunks: List[Chunk]) -> List[Chunk]:
        """
        Merge consecutive small chunks to avoid too many tiny chunks.
        
        Args:
            chunks: List of chunks to merge
            
        Returns:
            List of merged chunks
        """
        if not chunks:
            return []
        
        merged = []
        current = None
        
        for chunk in chunks:
            if current is None:
                current = chunk
            elif len(current.content) < self.config.min_size_chars:
                # Merge with current
                current.content += "\n\n" + chunk.content
                current.metadata["char_count"] = len(current.content)
                current.metadata["token_count"] = len(current.content) // int(self.config.chars_per_token)
            else:
                # Save current and start new
                merged.append(current)
                current = chunk
        
        # Don't forget the last one
        if current:
            merged.append(current)
        
        return merged
