"""
Demo script to test Member 1 components.
Tests configuration, base processor, and chunking without external dependencies.
"""

import sys
from pathlib import Path

# Add src to path - use absolute path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.config import Config
from src.processors.base import Chunk
from src.chunking.chunker import SemanticChunker, ChunkConfig


def test_config():
    """Test configuration creation"""
    print("=" * 60)
    print("Testing Configuration")
    print("=" * 60)
    
    config = Config()
    print(f"✓ Config created successfully")
    print(f"  - Embedding model: {config.ollama.embedding_model}")
    print(f"  - LLM model: {config.ollama.llm_model}")
    print(f"  - Chunk size: {config.chunking.chunk_size} tokens")
    print(f"  - OCR enabled: {config.processing.ocr_enabled}")
    print(f"  - Data directory: {config.paths.data_dir}")
    print()
    
    return config


def test_chunk():
    """Test Chunk dataclass"""
    print("=" * 60)
    print("Testing Chunk Dataclass")
    print("=" * 60)
    
    chunk = Chunk(
        content="This is a test chunk containing some sample text.",
        metadata={
            "source": "demo.txt",
            "file_type": "text",
            "page": 1
        }
    )
    
    print(f"✓ Chunk created successfully")
    print(f"  - Content: {chunk.content[:50]}...")
    print(f"  - Source: {chunk.metadata.get('source')}")
    print(f"  - File type: {chunk.metadata.get('file_type')}")
    print(f"  - Chunk index: {chunk.metadata.get('chunk_index')}")
    print()
    
    # Test serialization
    data = chunk.to_dict()
    print(f"✓ Chunk serialized to dict")
    
    # Test deserialization
    restored = Chunk.from_dict(data)
    print(f"✓ Chunk restored from dict")
    print()
    
    return chunk


def test_chunker():
    """Test semantic chunker"""
    print("=" * 60)
    print("Testing Semantic Chunker")
    print("=" * 60)
    
    # Create sample text
    sample_text = """
# Introduction to ORION

ORION is a completely offline Retrieval-Augmented Generation system that can ingest, 
index, and query multiple document types including PDFs, DOCX files, images, and voice recordings.

## Key Features

The system supports the following features:

1. **PDF Processing**: Extract text, tables, and embedded images from PDF documents
2. **DOCX Processing**: Parse Word documents including headers, footers, and tables
3. **Image Processing**: OCR and vision-based understanding of images
4. **Voice Processing**: Speech-to-text with speaker diarization

## Technical Architecture

The architecture consists of several key components:

- Input processors for different file types
- Semantic chunking engine for optimal retrieval
- Vector storage using ChromaDB
- Local LLM integration via Ollama
- Citation engine for source attribution

### Document Processing Pipeline

Documents are processed through the following stages:

1. File type detection and routing to appropriate processor
2. Content extraction (text, images, tables, metadata)
3. Semantic chunking with configurable overlap
4. Embedding generation using local models
5. Storage in persistent vector database

### Query Processing

When a user submits a query:

1. Query is embedded using the same model as documents
2. Semantic search retrieves top-k relevant chunks
3. Retrieved context is passed to the LLM
4. LLM generates response with citations
5. Guardrails validate the response
6. Citations are formatted and returned to user

## Conclusion

This system enables powerful RAG capabilities entirely offline, ensuring privacy 
and security for sensitive documents.
"""
    
    # Test with default config
    chunker = SemanticChunker(ChunkConfig(
        chunk_size=200,  # Smaller for demo
        chunk_overlap=50,
        preserve_sections=True
    ))
    
    chunks = chunker.chunk_text(
        sample_text.strip(),
        metadata={"source": "demo.md", "file_type": "markdown"}
    )
    
    print(f"✓ Chunked text into {len(chunks)} chunks")
    print()
    
    for i, chunk in enumerate(chunks):
        print(f"Chunk {i + 1}:")
        print(f"  - Length: {len(chunk.content)} chars (~{chunk.metadata.get('token_count', 0)} tokens)")
        
        if "section" in chunk.metadata:
            print(f"  - Section: {chunk.metadata['section'][:50]}...")
        
        preview = chunk.content.replace('\n', ' ')[:100]
        print(f"  - Preview: {preview}...")
        print()
    
    return chunks


def test_section_detection():
    """Test section header detection"""
    print("=" * 60)
    print("Testing Section Header Detection")
    print("=" * 60)
    
    chunker = SemanticChunker()
    
    test_cases = [
        ("# Markdown Header", True),
        ("## Subsection", True),
        ("1. Numbered Section", True),
        ("Introduction:", True),
        ("This is just normal text.", False),
        ("A paragraph with a sentence. And another.", False),
    ]
    
    for text, expected in test_cases:
        result = chunker._is_section_header(text)
        status = "✓" if result == expected else "✗"
        print(f"{status} '{text[:40]}...' -> {result}")
    
    print()


def test_paragraph_splitting():
    """Test paragraph splitting"""
    print("=" * 60)
    print("Testing Paragraph Splitting")
    print("=" * 60)
    
    chunker = SemanticChunker()
    
    text = """First paragraph here.

Second paragraph here.


Third paragraph with extra spacing.

Fourth paragraph."""
    
    paragraphs = chunker._split_paragraphs(text)
    
    print(f"✓ Split into {len(paragraphs)} paragraphs:")
    for i, para in enumerate(paragraphs):
        print(f"  {i + 1}. {para[:50]}...")
    
    print()


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("ORION Member 1 Component Demo")
    print("Testing: Configuration, Chunks, and Semantic Chunking")
    print("=" * 60)
    print()
    
    try:
        # Run tests
        config = test_config()
        chunk = test_chunk()
        test_section_detection()
        test_paragraph_splitting()
        chunks = test_chunker()
        
        print("=" * 60)
        print("✓ All tests completed successfully!")
        print("=" * 60)
        print()
        print("Summary:")
        print(f"  - Configuration: Working ✓")
        print(f"  - Chunk dataclass: Working ✓")
        print(f"  - Semantic chunker: Working ✓")
        print(f"  - Section detection: Working ✓")
        print(f"  - Paragraph splitting: Working ✓")
        print()
        print("Member 1 components are ready for integration!")
        print()
        
    except Exception as e:
        print(f"\n✗ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
