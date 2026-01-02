"""
Configuration management for ORION.
Centralized settings for models, paths, chunk sizes, and processing parameters.
"""

import os
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field


class OllamaConfig(BaseModel):
    """Ollama model configuration"""
    base_url: str = Field(default="http://localhost:11434", description="Ollama API base URL")
    embedding_model: str = Field(default="nomic-embed-text", description="Model for text embeddings")
    llm_model: str = Field(default="mistral:7b", description="Main LLM for generation")
    vision_model: str = Field(default="llava", description="Vision model for image understanding")
    timeout: int = Field(default=120, description="Request timeout in seconds")


class ChunkingConfig(BaseModel):
    """Text chunking configuration"""
    chunk_size: int = Field(default=512, description="Target tokens per chunk")
    chunk_overlap: int = Field(default=128, description="Overlap between chunks in tokens")
    min_chunk_size: int = Field(default=100, description="Minimum chunk size to keep")
    preserve_sections: bool = Field(default=True, description="Keep section headers with chunks")


class ProcessingConfig(BaseModel):
    """Document processing configuration"""
    # OCR settings
    ocr_enabled: bool = Field(default=True, description="Enable OCR for images/PDFs")
    ocr_language: str = Field(default="en", description="OCR language (en, ch, etc)")
    
    # Image settings
    vision_enabled: bool = Field(default=True, description="Enable vision model for image description")
    max_image_size: int = Field(default=2048, description="Max image dimension (larger will be resized)")
    
    # Audio settings
    whisper_model: str = Field(default="base", description="Whisper model size (tiny/base/small/medium/large)")
    enable_diarization: bool = Field(default=True, description="Enable speaker diarization")
    
    # General
    batch_size: int = Field(default=32, description="Batch size for processing")


class PathConfig(BaseModel):
    """Paths configuration"""
    # Base directories
    project_root: Path = Field(default_factory=lambda: Path(__file__).parent.parent)
    data_dir: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "data")
    
    # Data subdirectories
    chroma_db_path: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "data" / "chroma_db")
    uploads_dir: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "data" / "uploads")
    
    # Model cache
    models_dir: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "models")
    
    def ensure_dirs(self):
        """Create all necessary directories"""
        for path in [self.data_dir, self.chroma_db_path, self.uploads_dir, self.models_dir]:
            path.mkdir(parents=True, exist_ok=True)


class VectorStoreConfig(BaseModel):
    """Vector store configuration"""
    collection_prefix: str = Field(default="orion", description="Prefix for collection names")
    distance_metric: str = Field(default="cosine", description="Distance metric (cosine/l2/ip)")
    top_k: int = Field(default=5, description="Default number of results to retrieve")
    metadata_fields: list[str] = Field(
        default_factory=lambda: ["source", "page", "timestamp", "chunk_index", "file_type"],
        description="Metadata fields to store"
    )


class Config(BaseModel):
    """Main application configuration"""
    ollama: OllamaConfig = Field(default_factory=OllamaConfig)
    chunking: ChunkingConfig = Field(default_factory=ChunkingConfig)
    processing: ProcessingConfig = Field(default_factory=ProcessingConfig)
    paths: PathConfig = Field(default_factory=PathConfig)
    vectorstore: VectorStoreConfig = Field(default_factory=VectorStoreConfig)
    
    # API settings
    api_host: str = Field(default="127.0.0.1", description="API server host")
    api_port: int = Field(default=8000, description="API server port")
    
    # General
    debug: bool = Field(default=False, description="Enable debug mode")
    log_level: str = Field(default="INFO", description="Logging level")
    
    class Config:
        arbitrary_types_allowed = True
    
    def initialize(self):
        """Initialize configuration (create directories, etc.)"""
        self.paths.ensure_dirs()


# Global configuration instance
config = Config()


def load_config(config_path: Optional[Path] = None) -> Config:
    """
    Load configuration from file or use defaults.
    
    Args:
        config_path: Optional path to JSON/YAML config file
        
    Returns:
        Config object
    """
    if config_path and config_path.exists():
        import json
        with open(config_path) as f:
            data = json.load(f)
        cfg = Config(**data)
    else:
        cfg = Config()
    
    cfg.initialize()
    return cfg


def save_config(config: Config, config_path: Path):
    """
    Save configuration to file.
    
    Args:
        config: Config object to save
        config_path: Path to save config JSON
    """
    import json
    with open(config_path, 'w') as f:
        json.dump(config.model_dump(), f, indent=2, default=str)
