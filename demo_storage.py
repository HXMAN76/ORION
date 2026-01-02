"""
Demo script showing chunk persistence with JSONL storage.
Demonstrates saving, loading, and managing chunks.
"""

import sys
from pathlib import Path

# Add src to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.processors.base import Chunk
from src.storage.chunk_storage import ChunkStorage, save_chunks, load_chunks, append_chunks


def demo_storage():
    """Demonstrate chunk storage operations"""
    
    print("=" * 70)
    print("ORION Chunk Storage Demo")
    print("=" * 70)
    print()
    
    # Create some sample chunks
    print("1. Creating sample chunks...")
    print("-" * 70)
    
    chunks = [
        Chunk(
            content="Introduction to ORION system. This is the first chunk.",
            metadata={
                "source": "demo_doc.pdf",
                "file_type": "pdf",
                "page": 1,
                "chunk_index": 0
            }
        ),
        Chunk(
            content="ORION supports multiple document types including PDF and DOCX.",
            metadata={
                "source": "demo_doc.pdf",
                "file_type": "pdf",
                "page": 2,
                "chunk_index": 1
            }
        ),
        Chunk(
            content="The system uses ChromaDB for vector storage.",
            metadata={
                "source": "demo_doc.pdf",
                "file_type": "pdf",
                "page": 3,
                "chunk_index": 2
            }
        ),
    ]
    
    print(f"✓ Created {len(chunks)} sample chunks")
    print()
    
    # Initialize storage
    print("2. Initializing chunk storage...")
    print("-" * 70)
    
    storage = ChunkStorage()
    print(f"✓ Storage directory: {storage.storage_dir}")
    print()
    
    # Save chunks
    print("3. Saving chunks to JSONL file...")
    print("-" * 70)
    
    filepath = storage.save(chunks, "demo_chunks.jsonl", overwrite=True)
    print(f"✓ Saved to: {filepath}")
    print()
    
    # Load chunks back
    print("4. Loading chunks from JSONL file...")
    print("-" * 70)
    
    loaded_chunks = storage.load("demo_chunks.jsonl")
    print(f"✓ Loaded {len(loaded_chunks)} chunks")
    
    for i, chunk in enumerate(loaded_chunks):
        print(f"  Chunk {i}: {chunk.content[:50]}...")
        print(f"    Source: {chunk.metadata.get('source')}, Page: {chunk.metadata.get('page')}")
    print()
    
    # Append more chunks
    print("5. Appending additional chunks...")
    print("-" * 70)
    
    new_chunks = [
        Chunk(
            content="Additional content about retrieval augmented generation.",
            metadata={
                "source": "demo_doc.pdf",
                "file_type": "pdf",
                "page": 4,
                "chunk_index": 3
            }
        ),
    ]
    
    storage.append(new_chunks, "demo_chunks.jsonl")
    print(f"✓ Appended {len(new_chunks)} chunk(s)")
    print()
    
    # Get file statistics
    print("6. Getting file statistics...")
    print("-" * 70)
    
    stats = storage.get_stats("demo_chunks.jsonl")
    print(f"✓ File stats:")
    print(f"  - Total chunks: {stats['chunk_count']}")
    print(f"  - Total characters: {stats['total_characters']}")
    print(f"  - File size: {stats['file_size_bytes']} bytes")
    print(f"  - File types: {', '.join(stats['file_types'])}")
    print(f"  - Unique sources: {stats['unique_sources']}")
    print(f"  - Created: {stats['created']}")
    print()
    
    # Iterate over chunks (memory efficient)
    print("7. Iterating over chunks (streaming)...")
    print("-" * 70)
    
    count = 0
    for chunk in storage.iterate("demo_chunks.jsonl"):
        count += 1
        print(f"  Stream chunk {count}: {chunk.content[:40]}...")
    
    print(f"✓ Streamed {count} chunks without loading all into memory")
    print()
    
    # List all chunk files
    print("8. Listing all chunk files...")
    print("-" * 70)
    
    files = storage.list_files()
    print(f"✓ Found {len(files)} chunk file(s):")
    for f in files:
        print(f"  - {f.name}")
    print()
    
    # Demonstrate convenience functions
    print("9. Using convenience functions...")
    print("-" * 70)
    
    quick_chunks = [
        Chunk(
            content="Quick save using convenience function.",
            metadata={"source": "quick.txt", "file_type": "text"}
        )
    ]
    
    # Save using convenience function
    save_chunks(quick_chunks, "quick_save.jsonl", overwrite=True)
    print("✓ Saved using save_chunks() convenience function")
    
    # Load using convenience function
    loaded = load_chunks("quick_save.jsonl")
    print(f"✓ Loaded {len(loaded)} chunk(s) using load_chunks()")
    
    # Append using convenience function
    append_chunks(quick_chunks, "quick_save.jsonl")
    print("✓ Appended using append_chunks() convenience function")
    print()
    
    # Final summary
    print("=" * 70)
    print("✓ All storage operations completed successfully!")
    print("=" * 70)
    print()
    print("Chunk Storage Features:")
    print("  ✓ Save chunks to JSONL format")
    print("  ✓ Load chunks from JSONL files")
    print("  ✓ Append chunks to existing files")
    print("  ✓ Stream chunks without loading all into memory")
    print("  ✓ Get file statistics")
    print("  ✓ List all chunk files")
    print("  ✓ Convenience functions for quick operations")
    print()
    print(f"Chunk files are stored in: {storage.storage_dir}")
    print()


if __name__ == "__main__":
    demo_storage()
