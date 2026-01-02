"""
Chunk storage module for persisting chunks to JSONL format.
JSONL (JSON Lines) format stores one JSON object per line, making it easy to
stream, append, and process large datasets.
"""

import json
import logging
from pathlib import Path
from typing import List, Optional, Iterator
from datetime import datetime

from ..processors.base import Chunk

logger = logging.getLogger(__name__)


class ChunkStorage:
    """
    Manages persistent storage of chunks in JSONL format.
    Each chunk is stored as one JSON object per line.
    """
    
    def __init__(self, storage_dir: Optional[Path] = None):
        """
        Initialize chunk storage.
        
        Args:
            storage_dir: Directory to store chunk files (default: data/processed/)
        """
        if storage_dir is None:
            storage_dir = Path(__file__).parent.parent.parent / "data" / "processed"
        
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"ChunkStorage initialized at: {self.storage_dir}")
    
    def save(self, chunks: List[Chunk], filename: str, overwrite: bool = False) -> Path:
        """
        Save chunks to a JSONL file.
        
        Args:
            chunks: List of chunks to save
            filename: Name of the file (will add .jsonl if not present)
            overwrite: If True, overwrites existing file. If False, raises error if exists.
            
        Returns:
            Path to the saved file
            
        Raises:
            FileExistsError: If file exists and overwrite=False
        """
        # Ensure .jsonl extension
        if not filename.endswith('.jsonl'):
            filename += '.jsonl'
        
        filepath = self.storage_dir / filename
        
        # Check if file exists
        if filepath.exists() and not overwrite:
            raise FileExistsError(f"File already exists: {filepath}. Use overwrite=True to replace.")
        
        # Write chunks to JSONL
        with open(filepath, 'w', encoding='utf-8') as f:
            for chunk in chunks:
                json_line = json.dumps(chunk.to_dict(), ensure_ascii=False)
                f.write(json_line + '\n')
        
        logger.info(f"Saved {len(chunks)} chunks to {filepath}")
        return filepath
    
    def load(self, filename: str) -> List[Chunk]:
        """
        Load chunks from a JSONL file.
        
        Args:
            filename: Name of the file to load
            
        Returns:
            List of Chunk objects
            
        Raises:
            FileNotFoundError: If file doesn't exist
        """
        # Ensure .jsonl extension
        if not filename.endswith('.jsonl'):
            filename += '.jsonl'
        
        filepath = self.storage_dir / filename
        
        if not filepath.exists():
            raise FileNotFoundError(f"Chunk file not found: {filepath}")
        
        chunks = []
        with open(filepath, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                
                try:
                    data = json.loads(line)
                    chunk = Chunk.from_dict(data)
                    chunks.append(chunk)
                except json.JSONDecodeError as e:
                    logger.warning(f"Skipping invalid JSON at line {line_num}: {e}")
                except Exception as e:
                    logger.warning(f"Error loading chunk at line {line_num}: {e}")
        
        logger.info(f"Loaded {len(chunks)} chunks from {filepath}")
        return chunks
    
    def append(self, chunks: List[Chunk], filename: str) -> Path:
        """
        Append chunks to an existing JSONL file (or create if doesn't exist).
        
        Args:
            chunks: List of chunks to append
            filename: Name of the file
            
        Returns:
            Path to the file
        """
        # Ensure .jsonl extension
        if not filename.endswith('.jsonl'):
            filename += '.jsonl'
        
        filepath = self.storage_dir / filename
        
        # Append to file
        with open(filepath, 'a', encoding='utf-8') as f:
            for chunk in chunks:
                json_line = json.dumps(chunk.to_dict(), ensure_ascii=False)
                f.write(json_line + '\n')
        
        logger.info(f"Appended {len(chunks)} chunks to {filepath}")
        return filepath
    
    def iterate(self, filename: str) -> Iterator[Chunk]:
        """
        Iterate over chunks in a JSONL file without loading all into memory.
        Useful for large files.
        
        Args:
            filename: Name of the file
            
        Yields:
            Chunk objects one at a time
        """
        # Ensure .jsonl extension
        if not filename.endswith('.jsonl'):
            filename += '.jsonl'
        
        filepath = self.storage_dir / filename
        
        if not filepath.exists():
            raise FileNotFoundError(f"Chunk file not found: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                
                try:
                    data = json.loads(line)
                    yield Chunk.from_dict(data)
                except json.JSONDecodeError as e:
                    logger.warning(f"Skipping invalid JSON at line {line_num}: {e}")
                except Exception as e:
                    logger.warning(f"Error loading chunk at line {line_num}: {e}")
    
    def list_files(self) -> List[Path]:
        """
        List all JSONL chunk files in the storage directory.
        
        Returns:
            List of file paths
        """
        return list(self.storage_dir.glob("*.jsonl"))
    
    def get_stats(self, filename: str) -> dict:
        """
        Get statistics about a chunk file without loading all chunks.
        
        Args:
            filename: Name of the file
            
        Returns:
            Dictionary with file statistics
        """
        # Ensure .jsonl extension
        if not filename.endswith('.jsonl'):
            filename += '.jsonl'
        
        filepath = self.storage_dir / filename
        
        if not filepath.exists():
            raise FileNotFoundError(f"Chunk file not found: {filepath}")
        
        # Count chunks and get file info
        chunk_count = 0
        total_chars = 0
        file_types = set()
        sources = set()
        
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                try:
                    data = json.loads(line)
                    chunk_count += 1
                    total_chars += len(data.get('content', ''))
                    
                    metadata = data.get('metadata', {})
                    file_types.add(metadata.get('file_type', 'unknown'))
                    sources.add(metadata.get('source', 'unknown'))
                except:
                    continue
        
        return {
            'filepath': str(filepath),
            'chunk_count': chunk_count,
            'total_characters': total_chars,
            'file_size_bytes': filepath.stat().st_size,
            'file_types': list(file_types),
            'unique_sources': len(sources),
            'created': datetime.fromtimestamp(filepath.stat().st_ctime).isoformat(),
            'modified': datetime.fromtimestamp(filepath.stat().st_mtime).isoformat(),
        }
    
    def delete(self, filename: str) -> bool:
        """
        Delete a chunk file.
        
        Args:
            filename: Name of the file to delete
            
        Returns:
            True if deleted, False if file didn't exist
        """
        # Ensure .jsonl extension
        if not filename.endswith('.jsonl'):
            filename += '.jsonl'
        
        filepath = self.storage_dir / filename
        
        if filepath.exists():
            filepath.unlink()
            logger.info(f"Deleted chunk file: {filepath}")
            return True
        
        return False


# Convenience functions using default storage location
_default_storage = None

def _get_default_storage() -> ChunkStorage:
    """Get or create default storage instance"""
    global _default_storage
    if _default_storage is None:
        _default_storage = ChunkStorage()
    return _default_storage


def save_chunks(chunks: List[Chunk], filename: str, overwrite: bool = False) -> Path:
    """
    Save chunks to JSONL file (convenience function).
    
    Args:
        chunks: List of chunks to save
        filename: Name of the file
        overwrite: Whether to overwrite existing file
        
    Returns:
        Path to saved file
    """
    return _get_default_storage().save(chunks, filename, overwrite)


def load_chunks(filename: str) -> List[Chunk]:
    """
    Load chunks from JSONL file (convenience function).
    
    Args:
        filename: Name of the file
        
    Returns:
        List of chunks
    """
    return _get_default_storage().load(filename)


def append_chunks(chunks: List[Chunk], filename: str) -> Path:
    """
    Append chunks to JSONL file (convenience function).
    
    Args:
        chunks: List of chunks to append
        filename: Name of the file
        
    Returns:
        Path to file
    """
    return _get_default_storage().append(chunks, filename)
