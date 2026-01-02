"""Semantic retriever for RAG queries"""
from typing import List, Dict, Any, Optional

from ..vectorstore import ChromaStore
from ..config import config


class Retriever:
    """Retrieve relevant chunks for RAG queries"""
    
    def __init__(self, store: ChromaStore = None):
        """
        Initialize retriever.
        
        Args:
            store: ChromaStore instance (created if not provided)
        """
        self.store = store or ChromaStore()
    
    def retrieve(
        self,
        query: str,
        top_k: int = None,
        doc_types: List[str] = None,
        collections: List[str] = None,
        min_similarity: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks for a query.
        
        Args:
            query: The search query
            top_k: Number of results to retrieve
            doc_types: Filter by document types
            collections: Filter by logical collections
            min_similarity: Minimum similarity threshold
            
        Returns:
            List of relevant chunks with metadata
        """
        top_k = top_k or config.TOP_K_RESULTS
        
        results = self.store.query(
            query_text=query,
            n_results=top_k,
            doc_types=doc_types,
            collections=collections
        )
        
        # Filter by minimum similarity
        if min_similarity > 0:
            results = [r for r in results if r.get("similarity", 0) >= min_similarity]
        
        return results
    
    def get_context(
        self,
        query: str,
        top_k: int = None,
        doc_types: List[str] = None,
        collections: List[str] = None,
        max_tokens: int = 2000
    ) -> str:
        """
        Get formatted context for LLM prompt.
        
        Args:
            query: The search query
            top_k: Number of results to retrieve
            doc_types: Filter by document types
            collections: Filter by logical collections
            max_tokens: Maximum tokens for context
            
        Returns:
            Formatted context string
        """
        results = self.retrieve(
            query=query,
            top_k=top_k,
            doc_types=doc_types,
            collections=collections
        )
        
        if not results:
            return ""
        
        context_parts = []
        
        for i, result in enumerate(results, 1):
            metadata = result.get("metadata", {})
            source = metadata.get("source_file", "Unknown")
            doc_type = metadata.get("doc_type", "unknown")
            
            # Format source info
            source_info = f"[Source {i}: {source}"
            if metadata.get("page"):
                source_info += f", Page {metadata['page']}"
            if metadata.get("speaker"):
                source_info += f", Speaker: {metadata['speaker']}"
            if metadata.get("timestamp_start"):
                source_info += f", Time: {metadata['timestamp_start']:.1f}s"
            source_info += "]"
            
            context_parts.append(f"{source_info}\n{result['content']}")
        
        return "\n\n---\n\n".join(context_parts)
    
    def get_sources(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract source information from retrieval results.
        
        Args:
            results: List of retrieval results
            
        Returns:
            List of source citations
        """
        sources = []
        
        for i, result in enumerate(results, 1):
            metadata = result.get("metadata", {})
            
            source = {
                "index": i,
                "source_file": metadata.get("source_file"),
                "doc_type": metadata.get("doc_type"),
                "document_id": metadata.get("document_id"),
                "similarity": result.get("similarity", 0)
            }
            
            # Add optional location info
            if metadata.get("page"):
                source["page"] = metadata["page"]
            if metadata.get("timestamp_start"):
                source["timestamp"] = {
                    "start": metadata["timestamp_start"],
                    "end": metadata.get("timestamp_end")
                }
            if metadata.get("speaker"):
                source["speaker"] = metadata["speaker"]
            
            sources.append(source)
        
        return sources
