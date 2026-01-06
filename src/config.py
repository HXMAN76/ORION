"""ORION - Offline Multimodal RAG System Configuration"""
import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List


@dataclass
class Config:
    """Central configuration for ORION"""
    
    # Paths
    BASE_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent)
    DATA_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent / "data")
    CHROMA_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent / "data" / "chroma_db")
    UPLOADS_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent / "data" / "uploads")
    MODELS_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent / "models")
    
    # Chunking
    CHUNK_SIZE: int = 512  # tokens
    CHUNK_OVERLAP: int = 50  # tokens
    
    # Ollama
    OLLAMA_HOST: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "nomic-embed-text"
    LLM_MODEL: str = "mistral:7b"
    VISION_MODEL: str = "llava"
    
    # Vector Store
    COLLECTION_NAME: str = "orion_chunks"
    TOP_K_RESULTS: int = 5
    
    # Voice Processing
    WHISPER_MODEL: str = "base"  # tiny, base, small, medium, large
    
    # API
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    
    # Supported file types
    SUPPORTED_EXTENSIONS: List[str] = field(default_factory=lambda: [
        ".pdf", ".docx", ".doc",
        ".png", ".jpg", ".jpeg", ".webp", ".bmp",
        ".mp3", ".wav", ".m4a", ".ogg", ".flac"
    ])
    
    def __post_init__(self):
        """Ensure directories exist"""
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        self.MODELS_DIR.mkdir(parents=True, exist_ok=True)


# Global config instance
config = Config()
