"""ChromaDB vector store with logical collections via metadata"""
from typing import List, Optional, Dict, Any
from pathlib import Path
import chromadb
from chromadb.config import Settings

from ..config import config
from ..processors.base import Chunk
from ..embedding import Embedder


class ChromaStore:
    """
    ChromaDB vector store with single physical collection and
    logical collections via metadata filtering.
    """
    
    def __init__(
        self, 
        persist_directory: Path = None,
        collection_name: str = None,
        embedder: Embedder = None
    ):
        """
        Initialize ChromaDB store.
        
        Args:
            persist_directory: Directory for persistence (default from config)
            collection_name: Name of the collection (default from config)
            embedder: Embedder instance (created if not provided)
        """
        self.persist_directory = persist_directory or config.CHROMA_DIR
        self.collection_name = collection_name or config.COLLECTION_NAME
        self.embedder = embedder or Embedder()
        
        # Initialize ChromaDB client with persistence
        self._client = chromadb.PersistentClient(
            path=str(self.persist_directory),
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create the main collection
        self._collection = self._client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def add_chunks(self, chunks: List[Chunk], collections: List[str] = None) -> List[str]:
        """
        Add chunks to the vector store.
        
        Args:
            chunks: List of Chunk objects to add
            collections: Optional logical collections to assign
            
        Returns:
            List of chunk IDs
        """
        if not chunks:
            return []
        
        ids = []
        documents = []
        embeddings = []
        metadatas = []
        
        for chunk in chunks:
            # Add logical collections if provided
            if collections:
                chunk.collections.extend(collections)
            
            # Generate embedding
            embedding = self.embedder.embed(chunk.content)
            
            # Prepare metadata (ChromaDB requires flat structure)
            metadata = {
                "document_id": chunk.document_id,
                "doc_type": chunk.doc_type,
                "source_file": chunk.source_file,
                "created_at": chunk.created_at,
                # Store collections as comma-separated string
                "collections": ",".join(chunk.collections) if chunk.collections else "",
            }
            
            # Add optional fields if present
            if chunk.page is not None:
                metadata["page"] = chunk.page
            if chunk.timestamp_start is not None:
                metadata["timestamp_start"] = chunk.timestamp_start
            if chunk.timestamp_end is not None:
                metadata["timestamp_end"] = chunk.timestamp_end
            if chunk.speaker:
                metadata["speaker"] = chunk.speaker
            
            # Add any extra metadata
            for key, value in chunk.metadata.items():
                if isinstance(value, (str, int, float, bool)):
                    metadata[key] = value
            
            ids.append(chunk.id)
            documents.append(chunk.content)
            embeddings.append(embedding)
            metadatas.append(metadata)
        
        # Add to ChromaDB
        self._collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )
        
        return ids
    
    def query(
        self,
        query_text: str,
        n_results: int = None,
        doc_types: List[str] = None,
        collections: List[str] = None,
        document_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Query the vector store.
        
        Args:
            query_text: The search query
            n_results: Number of results to return
            doc_types: Filter by document types (pdf, docx, image, voice)
            collections: Filter by logical collections
            document_id: Filter by specific document
            
        Returns:
            List of results with content, metadata, and similarity scores
        """
        n_results = n_results or config.TOP_K_RESULTS
        
        # Generate query embedding
        query_embedding = self.embedder.embed(query_text)
        
        # Build where filter
        where_filter = self._build_where_filter(doc_types, collections, document_id)
        
        # Query ChromaDB
        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter if where_filter else None,
            include=["documents", "metadatas", "distances"]
        )
        
        # Format results
        formatted = []
        if results["ids"] and results["ids"][0]:
            for i, chunk_id in enumerate(results["ids"][0]):
                formatted.append({
                    "id": chunk_id,
                    "content": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i],
                    "similarity": 1 - results["distances"][0][i]  # Convert distance to similarity
                })
        
        return formatted
    
    def _build_where_filter(
        self,
        doc_types: List[str] = None,
        collections: List[str] = None,
        document_id: str = None
    ) -> Optional[Dict]:
        """Build ChromaDB where filter from parameters"""
        conditions = []
        
        if document_id:
            conditions.append({"document_id": {"$eq": document_id}})
        
        if doc_types:
            if len(doc_types) == 1:
                conditions.append({"doc_type": {"$eq": doc_types[0]}})
            else:
                conditions.append({"doc_type": {"$in": doc_types}})
        
        if collections:
            # For comma-separated collections, use $contains
            # Note: This is a simplified approach, ChromaDB has limitations
            for collection in collections:
                conditions.append({"collections": {"$contains": collection}})
        
        if not conditions:
            return None
        elif len(conditions) == 1:
            return conditions[0]
        else:
            return {"$and": conditions}
    
    def delete_document(self, document_id: str) -> int:
        """
        Delete all chunks belonging to a document.
        
        Args:
            document_id: The document ID to delete
            
        Returns:
            Number of chunks deleted
        """
        # Get all chunks for this document
        results = self._collection.get(
            where={"document_id": {"$eq": document_id}},
            include=[]
        )
        
        if results["ids"]:
            self._collection.delete(ids=results["ids"])
            return len(results["ids"])
        
        return 0
    
    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get list of all unique documents in the store"""
        results = self._collection.get(include=["metadatas"])
        
        documents = {}
        for metadata in results["metadatas"]:
            doc_id = metadata.get("document_id")
            if doc_id and doc_id not in documents:
                documents[doc_id] = {
                    "document_id": doc_id,
                    "doc_type": metadata.get("doc_type"),
                    "source_file": metadata.get("source_file"),
                    "collections": metadata.get("collections", "").split(",") if metadata.get("collections") else []
                }
        
        return list(documents.values())
    
    def get_all_collections(self) -> List[str]:
        """Get list of all logical collections"""
        results = self._collection.get(include=["metadatas"])
        
        collections = set()
        for metadata in results["metadatas"]:
            coll_str = metadata.get("collections", "")
            if coll_str:
                for c in coll_str.split(","):
                    if c.strip():
                        collections.add(c.strip())
        
        return sorted(list(collections))
    
    def add_to_collection(self, document_id: str, collection: str):
        """Add a document to a logical collection"""
        # Get all chunks for this document
        results = self._collection.get(
            where={"document_id": {"$eq": document_id}},
            include=["metadatas"]
        )
        
        if not results["ids"]:
            return
        
        # Update each chunk's collections
        for chunk_id, metadata in zip(results["ids"], results["metadatas"]):
            current = metadata.get("collections", "")
            current_list = [c.strip() for c in current.split(",") if c.strip()]
            
            if collection not in current_list:
                current_list.append(collection)
                new_collections = ",".join(current_list)
                
                self._collection.update(
                    ids=[chunk_id],
                    metadatas=[{"collections": new_collections}]
                )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        count = self._collection.count()
        documents = self.get_all_documents()
        collections = self.get_all_collections()
        
        # Count by doc_type
        type_counts = {}
        for doc in documents:
            doc_type = doc.get("doc_type", "unknown")
            type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
        
        return {
            "total_chunks": count,
            "total_documents": len(documents),
            "total_collections": len(collections),
            "documents_by_type": type_counts,
            "collections": collections
        }
