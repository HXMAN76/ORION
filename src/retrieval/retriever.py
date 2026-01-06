from typing import List, Optional
import ollama

from processors.base import Chunk
from vectorstore import ChromaStore
from config import config


class Retriever:
    def __init__(self, store: ChromaStore):
        self.store = store
        self.embedding_model = config.EMBEDDING_MODEL  # nomic-embed-text

    # --------------------------------------------------
    # MAIN RETRIEVE METHOD
    # --------------------------------------------------
    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        doc_types: Optional[List[str]] = None,
        collections: Optional[List[str]] = None,
    ) -> List[Chunk]:

        if not query.strip():
            return []

        # ✅ STEP 1: Embed query (ONE STRING)
        embedding = self._embed_query(query)

        results: List[Chunk] = []

        # Default collection
        if not collections:
            collections = [config.COLLECTION_NAME]

        # Optional metadata filter
        where = None
        if doc_types:
            where = {"doc_type": {"$in": doc_types}}

        # ✅ STEP 2: Query each collection
        for collection in collections:
            response = self.store.query(
                embedding=embedding,          # ✅ CORRECT PARAM NAME
                top_k=top_k,
                collection=collection,
                where=where,
            )

            docs = response.get("documents", [[]])[0]
            metas = response.get("metadatas", [[]])[0]
            ids = response.get("ids", [[]])[0]
            dists = response.get("distances", [[]])[0]

            for doc, meta, dist in zip(docs, metas, dists):
                meta = meta or {}
                meta["similarity"] = 1 - dist if dist is not None else 0.0

                results.append(
                    Chunk(
                        content=doc,
                        metadata=meta,
                    )
                )

        return results

    # --------------------------------------------------
    # EMBEDDING (OLLAMA)
    # --------------------------------------------------
    def _embed_query(self, text: str) -> List[float]:
        response = ollama.embeddings(
            model=self.embedding_model,
            prompt=text,
        )
        return response["embedding"]
