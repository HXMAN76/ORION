"""Query and search endpoints"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
import json

from ..models import (
    QueryRequest, 
    QueryResponse, 
    SearchRequest, 
    SearchResponse,
    SearchResult,
    Source
)
from ...retrieval import Retriever
from ...generation import LLM, Guardrails, CitationEngine
from ...vectorstore import ChromaStore


router = APIRouter()

# Initialize components
store = ChromaStore()
retriever = Retriever(store)
llm = LLM()
guardrails = Guardrails()
citations = CitationEngine()


@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Ask a question using RAG.
    
    Returns an answer with source citations.
    """
    # Retrieve relevant chunks
    results = retriever.retrieve(
        query=request.query,
        top_k=request.top_k,
        doc_types=request.doc_types,
        collections=request.collections
    )
    
    if not results:
        return QueryResponse(
            answer="I couldn't find any relevant information to answer your question.",
            sources=[],
            confidence=0.0
        )
    
    # Create context with source markers
    context, sources = citations.create_context_with_sources(results)
    
    # Generate response
    try:
        answer = llm.rag_generate(
            query=request.query,
            context=context
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {e}")
    
    # Validate response
    validation = guardrails.validate(answer, context, request.query)
    answer = guardrails.filter_response(answer)
    
    # Format sources
    formatted_sources = citations.format_sources(sources, cited_only=True, response=answer)
    
    return QueryResponse(
        answer=answer,
        sources=[Source(**s) for s in formatted_sources],
        confidence=validation["confidence"]
    )


@router.post("/query/stream")
async def query_rag_stream(request: QueryRequest):
    """
    Ask a question using RAG with streaming response.
    """
    # Retrieve relevant chunks
    results = retriever.retrieve(
        query=request.query,
        top_k=request.top_k,
        doc_types=request.doc_types,
        collections=request.collections
    )
    
    if not results:
        async def empty_response():
            yield json.dumps({
                "type": "answer",
                "content": "I couldn't find any relevant information to answer your question."
            }) + "\n"
            yield json.dumps({"type": "sources", "sources": []}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"
        
        return StreamingResponse(empty_response(), media_type="application/x-ndjson")
    
    # Create context with source markers
    context, sources = citations.create_context_with_sources(results)
    
    async def generate():
        try:
            # Stream the response
            full_response = ""
            for chunk in llm.generate_stream(
                prompt=f"Context:\n{context}\n\nQuestion: {request.query}\n\nAnswer:",
                system="""You are a helpful AI assistant that answers questions based on the provided context.
Rules:
1. Answer ONLY based on the information in the context
2. Cite sources using [Source X] format
3. Be concise and accurate"""
            ):
                full_response += chunk
                yield json.dumps({"type": "chunk", "content": chunk}) + "\n"
            
            # Send sources
            formatted_sources = citations.format_sources(sources, cited_only=True, response=full_response)
            yield json.dumps({"type": "sources", "sources": formatted_sources}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"
            
        except Exception as e:
            yield json.dumps({"type": "error", "error": str(e)}) + "\n"
    
    return StreamingResponse(generate(), media_type="application/x-ndjson")


@router.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """
    Perform semantic search without LLM generation.
    
    Returns matching chunks with similarity scores.
    """
    results = retriever.retrieve(
        query=request.query,
        top_k=request.top_k,
        doc_types=request.doc_types,
        collections=request.collections
    )
    
    search_results = []
    for r in results:
        metadata = r.get("metadata", {})
        search_results.append(SearchResult(
            id=r["id"],
            content=r["content"],
            source_file=metadata.get("source_file", "Unknown"),
            doc_type=metadata.get("doc_type", "unknown"),
            similarity=r.get("similarity", 0),
            metadata=metadata
        ))
    
    return SearchResponse(
        results=search_results,
        total=len(search_results)
    )


@router.get("/models/status")
async def check_models():
    """Check if required models are available"""
    return {
        "llm": {
            "model": llm.model,
            "available": llm.is_available()
        }
    }
