"""
Example: Processing a document and saving chunks to JSONL.
Demonstrates the complete workflow from document processing to chunk storage.
"""

import sys
from pathlib import Path

# Add src to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.config import Config
from src.processors.pdf_processor import PDFProcessor
from src.processors.docx_processor import DOCXProcessor
from src.chunking.chunker import SemanticChunker, ChunkConfig
from src.storage import save_chunks, load_chunks


def process_and_store_example():
    """
    Example workflow:
    1. Process document (PDF or DOCX)
    2. Apply semantic chunking
    3. Save to JSONL
    4. Load back from JSONL
    """
    
    print("=" * 70)
    print("ORION: Document Processing + Chunk Storage Example")
    print("=" * 70)
    print()
    
    # Initialize configuration
    config = Config()
    config.initialize()
    
    print("Note: This example shows the workflow.")
    print("To actually process files, provide PDF or DOCX file paths.")
    print()
    
    # Create sample chunks (simulating document processing)
    print("1. Simulating document processing...")
    print("-" * 70)
    
    from src.processors.base import Chunk
    
    # These would normally come from PDFProcessor or DOCXProcessor
    document_chunks = [
        Chunk(
            content="Chapter 1: Introduction to Machine Learning. Machine learning is a subset of artificial intelligence.",
            metadata={
                "source": "ml_textbook.pdf",
                "file_type": "pdf",
                "page": 1,
                "chunk_index": 0,
                "content_type": "text"
            }
        ),
        Chunk(
            content="Supervised learning uses labeled data to train models. Common algorithms include linear regression and decision trees.",
            metadata={
                "source": "ml_textbook.pdf",
                "file_type": "pdf",
                "page": 2,
                "chunk_index": 1,
                "content_type": "text"
            }
        ),
        Chunk(
            content="| Algorithm | Type | Use Case |\n| --- | --- | --- |\n| Linear Regression | Supervised | Prediction |\n| K-Means | Unsupervised | Clustering |",
            metadata={
                "source": "ml_textbook.pdf",
                "file_type": "pdf",
                "page": 3,
                "chunk_index": 2,
                "content_type": "table"
            }
        ),
    ]
    
    print(f"✓ Processed document: ml_textbook.pdf")
    print(f"✓ Extracted {len(document_chunks)} initial chunks")
    print()
    
    # Apply semantic chunking if chunks are too large
    print("2. Applying semantic chunking...")
    print("-" * 70)
    
    chunker = SemanticChunker(ChunkConfig(
        chunk_size=512,
        chunk_overlap=128,
        preserve_sections=True
    ))
    
    # For this example, chunks are already good size
    final_chunks = document_chunks
    
    print(f"✓ Chunking complete: {len(final_chunks)} chunks ready")
    print()
    
    # Save chunks to JSONL
    print("3. Saving chunks to JSONL...")
    print("-" * 70)
    
    filepath = save_chunks(final_chunks, "ml_textbook_chunks.jsonl", overwrite=True)
    print(f"✓ Saved to: {filepath}")
    print()
    
    # Load chunks back
    print("4. Loading chunks from JSONL...")
    print("-" * 70)
    
    loaded_chunks = load_chunks("ml_textbook_chunks.jsonl")
    print(f"✓ Loaded {len(loaded_chunks)} chunks")
    print()
    
    # Display loaded chunks
    print("5. Displaying loaded chunks...")
    print("-" * 70)
    
    for i, chunk in enumerate(loaded_chunks):
        print(f"\nChunk {i + 1}:")
        print(f"  Source: {chunk.metadata.get('source')}")
        print(f"  Page: {chunk.metadata.get('page')}")
        print(f"  Type: {chunk.metadata.get('content_type')}")
        print(f"  Content: {chunk.content[:80]}...")
    
    print()
    
    # Show workflow summary
    print("=" * 70)
    print("Complete Workflow:")
    print("=" * 70)
    print()
    print("1. Process Document:")
    print("   PDFProcessor.process('document.pdf') → List[Chunk]")
    print()
    print("2. Apply Chunking (optional):")
    print("   SemanticChunker.chunk_documents(chunks) → List[Chunk]")
    print()
    print("3. Save to JSONL:")
    print("   save_chunks(chunks, 'document_chunks.jsonl')")
    print()
    print("4. Later, load for vector store:")
    print("   chunks = load_chunks('document_chunks.jsonl')")
    print("   # Pass to Member 3 for embedding + ChromaDB storage")
    print()
    print("✓ Chunks are now persistent and ready for vector database!")
    print()


def real_pdf_example():
    """
    Example showing how to process a real PDF file.
    Uncomment and modify to use with actual files.
    """
    print("\n" + "=" * 70)
    print("Example: Processing Real PDF")
    print("=" * 70)
    print()
    
    print("To process a real PDF file:")
    print()
    print("```python")
    print("from src.config import Config")
    print("from src.processors.pdf_processor import PDFProcessor")
    print("from src.storage import save_chunks")
    print()
    print("# Initialize")
    print("config = Config()")
    print("processor = PDFProcessor(config)")
    print()
    print("# Process PDF")
    print("chunks = processor.process(Path('your_document.pdf'))")
    print()
    print("# Save to JSONL")
    print("save_chunks(chunks, 'your_document_chunks.jsonl')")
    print("```")
    print()
    print("Note: Requires PyMuPDF and optionally PaddleOCR installed.")
    print()


if __name__ == "__main__":
    process_and_store_example()
    real_pdf_example()
