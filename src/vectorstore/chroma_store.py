from typing import List, Dict, Any, Optional
from processors.base import Chunk
from config import config

import chromadb
import ollama


class ChromaStore:
    def __init__(self):
        self.client = chromadb.Client(
            chromadb.config.Settings(
                persist_directory=str(config.CHROMA_DIR),
                anonymized_telemetry=False,
            )
        )

        self.embedding_model = config.EMBEDDING_MODEL  # nomic-embed-text

    # --------------------------------------------------
    # ADD CHUNKS (FINAL, STABLE)
    # --------------------------------------------------
    def add_chunks(
        self,
        chunks: List[Chunk],
        collections: Optional[List[str]] = None,
    ):
        if not chunks:
            return

        if not collections:
            collections = [config.COLLECTION_NAME]

        texts = [c.content for c in chunks]
        metadatas = [c.metadata for c in chunks]
        ids = [
            f"{c.metadata['source']}_{c.metadata['chunk_id']}"
            for c in chunks
        ]

        # ✅ Ollama requires SINGLE-string embedding calls
        embeddings = [self._embed_single(t) for t in texts]

        for collection_name in collections:
            collection = self.client.get_or_create_collection(
                name=collection_name
            )

            collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings,
            )

        # ❌ DO NOT CALL client.persist()
        # Chroma persists automatically

    # --------------------------------------------------
    # QUERY
    # --------------------------------------------------
    def query(
        self,
        embedding: List[float],
        top_k: int = 5,
        collection: Optional[str] = None,
        where: Optional[Dict[str, Any]] = None,
    ):
        collection_name = collection or config.COLLECTION_NAME

        collection = self.client.get_or_create_collection(
            name=collection_name
        )

        return collection.query(
            query_embeddings=[embedding],
            n_results=top_k,
            where=where,
        )

    # --------------------------------------------------
    # EMBEDDING (OLLAMA-CORRECT)
    # --------------------------------------------------
    def _embed_single(self, text: str) -> List[float]:
        response = ollama.embeddings(
            model=self.embedding_model,
            prompt=text,
        )
        return response["embedding"]
