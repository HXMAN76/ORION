"""
Query and search endpoints (RAG)
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List
import json

from api.models import (
    QueryRequest,
    QueryResponse,
    SearchRequest,
    SearchResponse,
    SearchResult,
    Source
)

from retrieval import Retriever
from generation import LLM, Guardrails, CitationEngine
from vectorstore import ChromaStore
from processors.base import Chunk

router = APIRouter()

# --------------------------------------------------
# Initialize core components
# --------------------------------------------------
store = ChromaStore()
retriever = Retriever(store)
llm = LLM()                     # uses Ollama mistral
guardrails = Guardrails()
citations = CitationEngine()

# --------------------------------------------------
# Helper: normalize Chunk → dict
# --------------------------------------------------
def chunk_to_dict(chunk: Chunk, similarity: float = 0.0):
    metadata = dict(chunk.metadata or {})

    # 🔧 REQUIRED NORMALIZATION (CRITICAL FIX)
    metadata.setdefault("source_file", metadata.get("source", "unknown"))
    metadata.setdefault("doc_type", metadata.get("doc_type", "unknown"))

    return {
        "id": metadata.get("chunk_id", "unknown"),
        "content": chunk.content,
        "metadata": metadata,
        "similarity": similarity
    }

# --------------------------------------------------
# RAG QUERY
# --------------------------------------------------
@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Ask a question using RAG.
    """

    # -----------------------------
    # Retrieve relevant chunks
    # -----------------------------
    try:
        raw_results = retriever.retrieve(
            query=request.query,
            top_k=request.top_k,
            doc_types=request.doc_types,
            collections=request.collections
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {e}")

    if not raw_results:
        return QueryResponse(
            answer="I couldn't find any relevant information to answer your question.",
            sources=[],
            confidence=0.0
        )

    # -----------------------------
    # Normalize results
    # -----------------------------
    results = []
    for r in raw_results:
        if isinstance(r, Chunk):
            results.append(chunk_to_dict(r))
        elif isinstance(r, dict):
            meta = r.get("metadata", {})
            meta.setdefault("source_file", meta.get("source", "unknown"))
            meta.setdefault("doc_type", meta.get("doc_type", "unknown"))
            r["metadata"] = meta
            results.append(r)

    # -----------------------------
    # Build context + citations
    # -----------------------------
    try:
        context, sources = citations.create_context_with_sources(results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Citation building failed: {e}")

    # -----------------------------
    # Generate answer (Ollama)
    # -----------------------------
    try:
        answer = llm.rag_generate(
            query=request.query,
            context=context
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {e}")

    # -----------------------------
    # Guardrails
    # -----------------------------
    validation = guardrails.validate(answer, context, request.query)
    answer = guardrails.filter_response(answer)

    # -----------------------------
    # Format sources
    # -----------------------------
    formatted_sources = citations.format_sources(
        sources,
        cited_only=True,
        response=answer
    )

    return QueryResponse(
        answer=answer,
        sources=[Source(**s) for s in formatted_sources],
        confidence=validation.get("confidence", 0.5)
    )

# --------------------------------------------------
# STREAMING QUERY
# --------------------------------------------------
@router.post("/query/stream")
async def query_rag_stream(request: QueryRequest):

    raw_results = retriever.retrieve(
        query=request.query,
        top_k=request.top_k,
        doc_types=request.doc_types,
        collections=request.collections
    )

    if not raw_results:
        async def empty_response():
            yield json.dumps({
                "type": "answer",
                "content": "I couldn't find any relevant information to answer your question."
            }) + "\n"
            yield json.dumps({"type": "sources", "sources": []}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"

        return StreamingResponse(
            empty_response(),
            media_type="application/x-ndjson"
        )

    results = [
        chunk_to_dict(r) if isinstance(r, Chunk) else r
        for r in raw_results
    ]

    context, sources = citations.create_context_with_sources(results)

    async def generate():
        try:
            full_response = ""

            for chunk in llm.generate_stream(
                prompt=f"Context:\n{context}\n\nQuestion: {request.query}\n\nAnswer:",
                system=(
                    "You are a helpful AI assistant.\n"
                    "Answer ONLY using the provided context.\n"
                    "Cite sources using [Source X].\n"
                    "Be concise and factual."
                )
            ):
                full_response += chunk
                yield json.dumps({"type": "chunk", "content": chunk}) + "\n"

            formatted_sources = citations.format_sources(
                sources,
                cited_only=True,
                response=full_response
            )

            yield json.dumps({"type": "sources", "sources": formatted_sources}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"

        except Exception as e:
            yield json.dumps({"type": "error", "error": str(e)}) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")

# --------------------------------------------------
# SEMANTIC SEARCH (NO LLM)
# --------------------------------------------------
@router.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):

    raw_results = retriever.retrieve(
        query=request.query,
        top_k=request.top_k,
        doc_types=request.doc_types,
        collections=request.collections
    )

    search_results = []

    for r in raw_results:
        if isinstance(r, Chunk):
            meta = r.metadata or {}
            search_results.append(SearchResult(
                id=meta.get("chunk_id", "unknown"),
                content=r.content,
                source_file=meta.get("source", "Unknown"),
                doc_type=meta.get("doc_type", "unknown"),
                similarity=meta.get("similarity", 0.0),
                metadata=meta
            ))

    return SearchResponse(
        results=search_results,
        total=len(search_results)
    )

# --------------------------------------------------
# MODEL STATUS
# --------------------------------------------------
@router.get("/models/status")
async def check_models():
    return {
        "llm": {
            "model": llm.model,
            "available": llm.is_available()
        }
    }
