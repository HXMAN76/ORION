"""Embedding generation using Ollama's nomic-embed-text"""
from typing import List, Optional
import numpy as np

from ..config import config


class Embedder:
    """Generate embeddings using Ollama's local models"""
    
    def __init__(self, model: str = None):
        """
        Initialize embedder.
        
        Args:
            model: Embedding model name (default from config)
        """
        self.model = model or config.EMBEDDING_MODEL
        self._client = None
    
    def _get_client(self):
        """Lazy load Ollama client"""
        if self._client is None:
            try:
                import ollama
                self._client = ollama
            except ImportError:
                raise ImportError("Ollama package not installed. Run: pip install ollama")
        return self._client
    
    def embed(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector as list of floats
        """
        client = self._get_client()
        
        try:
            response = client.embeddings(
                model=self.model,
                prompt=text
            )
            return response["embedding"]
        except Exception as e:
            raise RuntimeError(f"Embedding generation failed: {e}")
    
    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process at once
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_embeddings = [self.embed(text) for text in batch]
            embeddings.extend(batch_embeddings)
        
        return embeddings
    
    def embed_numpy(self, text: str) -> np.ndarray:
        """
        Generate embedding as numpy array.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector as numpy array
        """
        return np.array(self.embed(text))
    
    def similarity(self, text1: str, text2: str) -> float:
        """
        Calculate cosine similarity between two texts.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Cosine similarity score (0-1)
        """
        emb1 = self.embed_numpy(text1)
        emb2 = self.embed_numpy(text2)
        
        # Cosine similarity
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
