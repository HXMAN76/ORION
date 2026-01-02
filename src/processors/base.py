"""
Base processor abstract class.
All document processors inherit from this and implement the process() method.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime


@dataclass
class Chunk:
    """
    Represents a processed chunk of content with metadata.
    
    Attributes:
        content: The actual text content
        metadata: Dictionary containing source information, page numbers, timestamps, etc.
        embedding: Optional pre-computed embedding vector
    """
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None
    
    def __post_init__(self):
        """Ensure required metadata fields exist"""
        defaults = {
            "chunk_index": 0,
            "created_at": datetime.now().isoformat(),
            "source": "unknown",
            "file_type": "unknown"
        }
        for key, value in defaults.items():
            if key not in self.metadata:
                self.metadata[key] = value
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "content": self.content,
            "metadata": self.metadata,
            "embedding": self.embedding
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Chunk":
        """Create Chunk from dictionary"""
        return cls(
            content=data["content"],
            metadata=data.get("metadata", {}),
            embedding=data.get("embedding")
        )


class BaseProcessor(ABC):
    """
    Abstract base class for all document processors.
    Each file type (PDF, DOCX, Image, Audio) implements this interface.
    """
    
    def __init__(self, config: Optional[Any] = None):
        """
        Initialize processor with optional configuration.
        
        Args:
            config: Configuration object (from src.config)
        """
        self.config = config
    
    @abstractmethod
    def process(self, file_path: Path) -> List[Chunk]:
        """
        Process a file and return a list of chunks with metadata.
        
        Args:
            file_path: Path to the file to process
            
        Returns:
            List of Chunk objects containing processed content and metadata
            
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file format is invalid
            ProcessingError: If processing fails
        """
        pass
    
    @abstractmethod
    def supports(self, file_path: Path) -> bool:
        """
        Check if this processor can handle the given file.
        
        Args:
            file_path: Path to check
            
        Returns:
            True if this processor can handle the file
        """
        pass
    
    def validate_file(self, file_path: Path) -> None:
        """
        Validate that file exists and can be processed.
        
        Args:
            file_path: Path to validate
            
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If processor doesn't support this file type
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if not self.supports(file_path):
            raise ValueError(f"Processor {self.__class__.__name__} does not support {file_path.suffix}")
    
    def _create_chunk(
        self,
        content: str,
        source: str,
        file_type: str,
        chunk_index: int,
        **extra_metadata
    ) -> Chunk:
        """
        Helper method to create a chunk with standard metadata.
        
        Args:
            content: Text content of the chunk
            source: Source file path/name
            file_type: Type of file (pdf, docx, etc)
            chunk_index: Index of this chunk in the document
            **extra_metadata: Additional metadata fields
            
        Returns:
            Chunk object
        """
        metadata = {
            "source": source,
            "file_type": file_type,
            "chunk_index": chunk_index,
            **extra_metadata
        }
        return Chunk(content=content, metadata=metadata)


class ProcessingError(Exception):
    """Custom exception for processing errors"""
    pass
