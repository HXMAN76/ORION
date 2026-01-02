# ORION - Offline Multimodal RAG System

A completely **offline** Retrieval-Augmented Generation system that can ingest, index, and query **PDF, DOCX, Images, and Voice Recordings** using local LLMs and vector storage.

## Features

- 🔒 **100% Offline** - All processing happens locally after initial model downloads
- 📄 **Multi-format Support** - PDF, DOCX, Images, Voice recordings
- 🎯 **Semantic Search** - Find relevant content using natural language
- 💬 **RAG Chat** - Get AI-powered answers with source citations
- 🗣️ **Speaker Diarization** - Identify who said what in audio files
- 🖼️ **Image Understanding** - OCR + Vision model descriptions
- 🏷️ **Logical Collections** - Organize documents with flexible metadata tags

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Vector Store | ChromaDB |
| Embeddings | nomic-embed-text (Ollama) |
| LLM | Mistral 7B (Ollama) |
| Vision | LLaVA (Ollama) |
| OCR | PaddleOCR |
| Speech-to-Text | Whisper |
| Speaker Diarization | Pyannote.audio |
| Backend | FastAPI |
| Desktop App | Electron + React |

## Prerequisites

1. **Install Ollama**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

2. **Pull required models** (one-time download, works offline after)
```bash
ollama pull nomic-embed-text    # Embeddings (~274MB)
ollama pull mistral:7b          # Main LLM (~4.1GB)
ollama pull llava               # Vision model (~4.7GB)
```

3. **Python 3.10+** and **Node.js 18+**

## Installation

```bash
# Clone the repository
git clone https://github.com/HXMAN76/ORION.git
cd ORION

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install

# Run development mode
npm run dev
```

## Project Structure

```
ORION/
├── src/                    # Python backend
│   ├── processors/         # Document processors (PDF, DOCX, Image, Voice)
│   ├── chunking/           # Text chunking strategies
│   ├── embedding/          # Ollama embeddings
│   ├── vectorstore/        # ChromaDB wrapper
│   ├── retrieval/          # Semantic search
│   ├── generation/         # LLM, guardrails, citations
│   └── api/                # FastAPI routes
├── electron/               # Electron main process
├── renderer/               # React frontend
├── data/                   # Local storage
└── models/                 # Cached models
```

## Usage

1. Launch the ORION desktop app
2. Drag and drop files to ingest (PDF, DOCX, images, audio)
3. Organize with collections using the sidebar
4. Ask questions in the chat interface
5. Click citations to see source locations

## License

MIT
