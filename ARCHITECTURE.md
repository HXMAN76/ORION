# ORION Architecture

> Technical architecture documentation for the Offline Multimodal RAG System

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Module Reference](#module-reference)
5. [API Design](#api-design)
6. [Storage Architecture](#storage-architecture)
7. [Security Considerations](#security-considerations)

---

## System Overview

ORION is a **fully offline** Retrieval-Augmented Generation (RAG) system designed for multimodal document processing. The system operates entirely on local infrastructure without any cloud dependencies.

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Offline-First** | All models run locally via Ollama; no internet required after setup |
| **Multimodal** | Unified pipeline for text, images, and audio documents |
| **Privacy** | All data stays on-device; no telemetry or external calls |
| **Extensible** | Plugin-based processor architecture for new formats |
| **Evaluation-Ready** | Built-in retrieval metrics (Recall@K, MRR) |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Electron Shell │────│  React Frontend │────│  Tailwind CSS Styling   │  │
│  │  (main.js)      │    │  (Vite bundled) │    │  (Dark-first design)    │  │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────────────┘  │
│           │                      │                                           │
│           ▼                      ▼                                           │
│  ┌─────────────────┐    ┌─────────────────┐                                  │
│  │  IPC Bridge     │────│  REST Client    │                                  │
│  │  (preload.js)   │    │  (fetch API)    │                                  │
│  └────────┬────────┘    └────────┬────────┘                                  │
└───────────┼──────────────────────┼──────────────────────────────────────────┘
            │                      │
            ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               API LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      FastAPI Application                                 │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │  /ingest │ │  /query  │ │ /search  │ │ /manage  │ │ /voice/diarize│  │ │
│  │  │          │ │          │ │          │ │          │ │               │   │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘   │ │
│  └───────┼────────────┼────────────┼────────────┼───────────────┼───────────┘ │
└──────────┼────────────┼────────────┼────────────┼───────────────┼────────────┘
           │            │            │            │               │
           ▼            ▼            ▼            ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE LAYER                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │  Processors   │  │   Chunking    │  │   Embedding   │  │  Generation   │ │
│  │  ───────────  │  │   ─────────   │  │   ─────────   │  │  ───────────  │ │
│  │  • PDF        │  │  • Semantic   │  │  • Ollama     │  │  • LLM        │ │
│  │  • DOCX       │  │  • Overlap    │  │  • Batch      │  │  • Guardrails │ │
│  │  • Image      │  │  • Token-     │  │  • Similarity │  │  • Citations  │ │
│  │  • Voice      │  │    aware      │  │               │  │               │ │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘ │
└──────────┼──────────────────┼──────────────────┼──────────────────┼─────────┘
           │                  │                  │                  │
           ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STORAGE LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          ChromaDB                                        │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │ │
│  │  │ Vector Index    │  │ Document Store  │  │ Metadata Index          │  │ │
│  │  │ (HNSW, cosine)  │  │ (chunk content) │  │ (collections, types)    │  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────┐  ┌─────────────────────────────────────────────┐   │
│  │ File Storage        │  │ Model Cache (Ollama)                        │   │
│  │ data/uploads/       │  │ ~/.ollama/models/                           │   │
│  └─────────────────────┘  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Document Processors (`src/processors/`)

Abstract base class pattern for extensible document processing:

```python
class BaseProcessor(ABC):
    """Abstract base for all document processors."""
    
    @abstractmethod
    def supports(self, file_path: Path) -> bool:
        """Check if processor handles this file type."""
        
    @abstractmethod
    def process(self, file_path: Path, **kwargs) -> List[Chunk]:
        """Extract and chunk document content."""
```

#### Processor Implementations

| Processor | File Types | Features |
|-----------|------------|----------|
| `PDFProcessor` | `.pdf` | Text extraction, page tracking, optional OCR |
| `DOCXProcessor` | `.docx` | Paragraph extraction, style preservation |
| `ImageProcessor` | `.png`, `.jpg`, `.jpeg`, `.webp` | OCR + Vision model descriptions |
| `VoiceProcessor` | `.wav`, `.mp3`, `.m4a`, `.ogg` | Transcription + speaker diarization |

#### Chunk Data Model

```python
@dataclass
class Chunk:
    id: str                  # UUID
    content: str             # Chunk text
    document_id: str         # Parent document ID
    doc_type: str            # pdf/docx/image/voice
    source_file: str         # Original filename
    collections: List[str]   # Logical collections
    created_at: str          # ISO timestamp
    
    # Optional location metadata
    page: Optional[int]           # PDF page number
    timestamp_start: Optional[float]  # Audio start time
    timestamp_end: Optional[float]    # Audio end time
    speaker: Optional[str]        # Identified speaker
    metadata: Dict[str, Any]      # Additional metadata
```

### 2. Chunking Engine (`src/chunking/`)

Intelligent text splitting with semantic awareness:

```python
class Chunker:
    def __init__(
        self,
        chunk_size: int = 512,      # Target tokens per chunk
        chunk_overlap: int = 50,     # Overlap between chunks
        tokenizer: str = "cl100k_base"
    ):
        ...
    
    def chunk(self, text: str) -> List[str]:
        """Split text into semantic chunks."""
```

**Chunking Strategy:**
1. Split on paragraph boundaries
2. Merge small paragraphs up to `chunk_size`
3. Split large paragraphs with `chunk_overlap`
4. Preserve sentence boundaries where possible

### 3. Embedding Module (`src/embedding/`)

Ollama-based embedding generation:

```python
class Embedder:
    def embed(self, text: str) -> List[float]:
        """Single text embedding."""
        
    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Batch embedding for efficiency."""
        
    def similarity(self, text1: str, text2: str) -> float:
        """Cosine similarity between texts."""
```

**Model:** `nomic-embed-text` (768 dimensions)

### 4. Vector Store (`src/vectorstore/`)

ChromaDB wrapper with logical collections:

```python
class ChromaStore:
    def add_chunks(self, chunks: List[Chunk], collections: List[str] = None) -> List[str]:
        """Ingest chunks with embeddings."""
        
    def query(
        self,
        query_text: str,
        n_results: int = 5,
        doc_types: List[str] = None,
        collections: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Semantic search with filters."""
```

**Architecture Decisions:**
- Single physical collection with metadata-based filtering
- Logical collections stored as comma-separated metadata
- HNSW index with cosine distance

### 5. Retrieval Module (`src/retrieval/`)

High-level retrieval interface:

```python
class Retriever:
    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.0
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks."""
        
    def get_context(
        self,
        query: str,
        max_tokens: int = 2000
    ) -> str:
        """Build formatted context for LLM."""
```

### 6. Generation Module (`src/generation/`)

LLM orchestration with safety features:

```python
class LLM:
    def rag_generate(self, query: str, context: str) -> str:
        """Generate RAG response."""
        
    def generate_stream(self, prompt: str) -> Iterator[str]:
        """Streaming generation."""

class Guardrails:
    def validate(self, response: str, context: str, query: str) -> Dict:
        """Validate response quality and safety."""
        
    def filter_response(self, response: str) -> str:
        """Apply content filters."""

class CitationEngine:
    def create_context_with_sources(self, results: List[Dict]) -> Tuple[str, List[Dict]]:
        """Build context with source markers."""
        
    def format_sources(self, sources: List[Dict], cited_only: bool = True) -> List[Dict]:
        """Format citations for response."""
```

---

## Data Flow

### Ingestion Pipeline

```
File Upload
    │
    ▼
┌─────────────────┐
│ File Detection  │ ← Determine processor by extension
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Processor       │ ← Extract text/transcribe audio
│ (PDF/DOCX/etc)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Chunker         │ ← Split into semantic chunks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Embedder        │ ← Generate embeddings (nomic-embed-text)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ChromaDB        │ ← Store chunks + embeddings + metadata
└─────────────────┘
```

### Query Pipeline

```
User Query
    │
    ▼
┌─────────────────┐
│ Embedder        │ ← Embed query
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ChromaDB        │ ← Semantic search (cosine similarity)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retriever       │ ← Filter by collections/types, build context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CitationEngine  │ ← Add source markers to context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM (Mistral)   │ ← Generate response with citations
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Guardrails      │ ← Validate and filter response
└────────┬────────┘
         │
         ▼
Response + Sources
```

---

## Module Reference

### Core Modules

| Module | Path | Purpose |
|--------|------|---------|
| `config` | `src/config.py` | Centralized configuration |
| `processors` | `src/processors/` | Document processing |
| `chunking` | `src/chunking/` | Text splitting |
| `embedding` | `src/embedding/` | Vector embeddings |
| `vectorstore` | `src/vectorstore/` | ChromaDB wrapper |
| `retrieval` | `src/retrieval/` | Semantic search |
| `generation` | `src/generation/` | LLM + citations |
| `api` | `src/api/` | FastAPI application |

### API Routes

| Route File | Endpoints | Purpose |
|------------|-----------|---------|
| `ingest.py` | `/ingest/*` | Document ingestion |
| `query.py` | `/query`, `/search` | RAG queries |
| `manage.py` | `/collections/*`, `/stats` | Management |
| `diarization.py` | `/voice/diarize/*` | Speaker diarization |

### Test Utilities

| File | Functions | Purpose |
|------|-----------|---------|
| `retrieval_metrics.py` | `recall_at_k`, `reciprocal_rank` | Evaluation metrics |

---

## API Design

### Request/Response Models

Defined in `src/api/models.py` using Pydantic:

```python
class QueryRequest(BaseModel):
    query: str
    top_k: int = 5
    doc_types: List[str] | None = None
    collections: List[str] | None = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]
    confidence: float

class Source(BaseModel):
    source_file: str
    page: int | None = None
    timestamp: Dict | None = None
    similarity: float
```

### Error Handling

Standard HTTP status codes with structured errors:

```json
{
  "detail": "Error message",
  "error_code": "PROCESSING_FAILED",
  "context": {}
}
```

---

## Storage Architecture

### Directory Structure

```
ORION/
├── data/
│   ├── chroma_db/          # Persistent vector database
│   │   ├── chroma.sqlite3  # Metadata + mappings
│   │   └── *.bin           # Vector indices
│   └── uploads/            # Original uploaded files
├── models/                  # Local model cache
└── ~/.ollama/models/        # Ollama model storage
```

### ChromaDB Schema

Single collection with metadata filtering:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Chunk UUID |
| `document` | string | Chunk text content |
| `embedding` | float[] | 768-dim vector |
| `metadata.document_id` | string | Parent document |
| `metadata.doc_type` | string | pdf/docx/image/voice |
| `metadata.source_file` | string | Original filename |
| `metadata.collections` | string | Comma-separated tags |
| `metadata.page` | int | PDF page (optional) |
| `metadata.timestamp_*` | float | Audio timing (optional) |
| `metadata.speaker` | string | Speaker ID (optional) |

---

## Security Considerations

### Offline Operation

- **No network calls** after initial model download
- **No telemetry** — ChromaDB telemetry disabled
- **No external APIs** — All processing local

### Electron Security

- **Context isolation** enabled
- **Node integration** disabled in renderer
- **IPC bridge** via preload script only
- **No remote modules**

### Data Privacy

- All data stored locally
- No cloud sync or backup
- User controls all file access

---

## Performance Considerations

### Embedding Batching

- Batch size: 32 texts per call
- Reduces Ollama round-trips

### Retrieval Optimization

- HNSW index for fast approximate search
- Metadata filtering before similarity computation
- Over-fetch 3x when filtering by collections

### Memory Management

- Lazy-load heavy dependencies
- Stream large file processing
- Chunk-based audio processing

---

## Extending ORION

### Adding a New Processor

1. Create `src/processors/new_processor.py`
2. Inherit from `BaseProcessor`
3. Implement `supports()` and `process()`
4. Register in `src/processors/__init__.py`

### Adding a New API Route

1. Create `src/api/routes/new_route.py`
2. Define router with endpoints
3. Register in `src/api/routes/__init__.py`
4. Update `src/api/main.py`

---

*Last updated: January 2026*
