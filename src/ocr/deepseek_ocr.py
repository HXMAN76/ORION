"""DeepSeek OCR using Ollama for text and table extraction"""
from pathlib import Path
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# Lazy import to avoid breaking if ollama not installed
_ollama = None

def _get_ollama():
    """Lazy load ollama package"""
    global _ollama
    if _ollama is None:
        try:
            import ollama
            _ollama = ollama
        except ImportError:
            logger.warning("Ollama package not installed. OCR unavailable.")
            _ollama = False
    return _ollama if _ollama is not False else None


class DeepSeekOCR:
    """
    DeepSeek OCR wrapper using Ollama.
    
    Provides text and table extraction from images using the deepseek-ocr model.
    Gracefully degrades if dependencies unavailable.
    """
    
    def __init__(self, model_name: str = "deepseek-ocr", host: Optional[str] = None):
        """
        Initialize DeepSeek OCR.
        
        Args:
            model_name: Model name in Ollama (default: "deepseek-ocr")
            host: Ollama host URL (default: None for local)
        """
        self.model_name = model_name
        self.host = host
        self._client = None
        self._available = None
    
    def _get_client(self):
        """Get Ollama client, returns None if unavailable"""
        if self._client is None:
            ollama = _get_ollama()
            if ollama is None:
                return None
            
            try:
                if self.host:
                    self._client = ollama.Client(host=self.host)
                else:
                    self._client = ollama.Client()
            except Exception as e:
                logger.error(f"Failed to initialize Ollama client: {e}")
                return None
        
        return self._client
    
    def is_available(self) -> bool:
        """Check if DeepSeek model is available"""
        if self._available is not None:
            return self._available
        
        try:
            client = self._get_client()
            if client is None:
                self._available = False
                return False
            
            models = client.list()
            model_names = [m.get("name", "") for m in models.get("models", [])]
            self._available = any(self.model_name in name for name in model_names)
            return self._available
        
        except Exception as e:
            logger.error(f"Failed to check model availability: {e}")
            self._available = False
            return False
    
    def _call_model(self, image_path: Path, prompt: str) -> str:
        """Call DeepSeek vision model"""
        client = self._get_client()
        if client is None:
            return ""
        
        try:
            response = client.chat(
                model=self.model_name,
                messages=[{
                    "role": "user",
                    "content": prompt,
                    "images": [str(image_path)]
                }]
            )
            return response.get("message", {}).get("content", "")
        
        except Exception as e:
            logger.error(f"DeepSeek OCR call failed: {e}")
            return ""
    
    def extract_text(self, image_path: Path) -> str:
        """Extract text from image"""
        prompt = (
            "Extract all text from this image. "
            "Return only the text without commentary."
        )
        return self._call_model(image_path, prompt).strip()
    
    def extract_tables(self, image_path: Path) -> List[str]:
        """Extract tables in markdown format"""
        prompt = (
            "Extract all tables from this image in markdown format. "
            "Return each table separately. No commentary."
        )
        result = self._call_model(image_path, prompt)
        
        if not result:
            return []
        
        # Split by double newlines
        tables = [t.strip() for t in result.split("\n\n") if "|" in t]
        return tables
    
    def extract_full_content(self, image_path: Path) -> Dict[str, any]:
        """Extract text and tables together"""
        prompt = (
            "Extract content from this image:\n"
            "TABLES:\n[tables in markdown or 'None']\n\n"
            "TEXT:\n[all other text]"
        )
        
        result = self._call_model(image_path, prompt)
        content = {"text": "", "tables": [], "has_tables": False}
        
        if not result:
            return content
        
        try:
            if "TABLES:" in result and "TEXT:" in result:
                parts = result.split("TEXT:")
                table_section = parts[0].replace("TABLES:", "").strip()
                text_section = parts[1].strip() if len(parts) > 1 else ""
                
                if table_section.lower() != "none" and "|" in table_section:
                    tables = [t.strip() for t in table_section.split("\n\n") if "|" in t]
                    content["tables"] = tables
                    content["has_tables"] = len(tables) > 0
                
                content["text"] = text_section
            else:
                content["text"] = result
        except Exception as e:
            logger.error(f"Failed to parse OCR result: {e}")
            content["text"] = result
        
        return content
