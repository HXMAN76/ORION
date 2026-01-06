"""DeepSeek OCR using Ollama vision model for text, image, and table extraction"""
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import base64
import logging
import time

try:
    import ollama
except ImportError:
    ollama = None

from ..config import config

logger = logging.getLogger(__name__)


class DeepSeekOCR:
    """
    DeepSeek OCR wrapper using Ollama for text, image, and table extraction.
    
    This class provides a unified interface for OCR operations using DeepSeek
    vision model running locally via Ollama.
    """
    
    def __init__(
        self,
        model_name: Optional[str] = None,
        host: Optional[str] = None,
        timeout: int = 60,
        max_retries: int = 3
    ):
        """
        Initialize DeepSeek OCR.
        
        Args:
            model_name: DeepSeek model name in Ollama (default from config)
            host: Ollama host URL (default from config)
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts for failed requests
        """
        if ollama is None:
            raise ImportError(
                "Ollama package not installed. Install with: pip install ollama"
            )
        
        self.model_name = model_name or config.DEEPSEEK_MODEL
        self.host = host or config.OLLAMA_HOST
        self.timeout = timeout
        self.max_retries = max_retries
        self._client = None
    
    def _get_client(self):
        """Lazy initialize Ollama client"""
        if self._client is None:
            self._client = ollama.Client(host=self.host)
        return self._client
    
    def _encode_image(self, image_path: Path) -> str:
        """
        Encode image to base64 string.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Base64 encoded image string
        """
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    
    def _call_vision_model(
        self,
        image_path: Path,
        prompt: str,
        retry_count: int = 0
    ) -> str:
        """
        Call DeepSeek vision model via Ollama.
        
        Args:
            image_path: Path to image file
            prompt: Prompt for the vision model
            retry_count: Current retry attempt
            
        Returns:
            Model response text
            
        Raises:
            Exception: If all retries fail
        """
        try:
            client = self._get_client()
            image_b64 = self._encode_image(image_path)
            
            response = client.chat(
                model=self.model_name,
                messages=[{
                    "role": "user",
                    "content": prompt,
                    "images": [image_b64]
                }],
                options={
                    "temperature": 0.1,  # Low temperature for consistent OCR
                    "num_predict": 4096  # Allow long responses for tables
                }
            )
            
            return response["message"]["content"]
        
        except Exception as e:
            if retry_count < self.max_retries:
                logger.warning(
                    f"DeepSeek OCR attempt {retry_count + 1} failed: {e}. Retrying..."
                )
                time.sleep(1 * (retry_count + 1))  # Exponential backoff
                return self._call_vision_model(image_path, prompt, retry_count + 1)
            else:
                logger.error(f"DeepSeek OCR failed after {self.max_retries} retries: {e}")
                raise
    
    def extract_text(self, image_path: Path) -> str:
        """
        Extract plain text from an image.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Extracted text content
        """
        prompt = (
            "Extract all text from this image. "
            "Return only the extracted text without any additional commentary. "
            "Maintain the original text layout and structure. "
            "If there is no text, return an empty response."
        )
        
        try:
            text = self._call_vision_model(image_path, prompt)
            return text.strip()
        except Exception as e:
            logger.error(f"Text extraction failed for {image_path}: {e}")
            return ""
    
    def extract_tables(self, image_path: Path) -> List[str]:
        """
        Extract tables from an image in markdown format.
        
        Args:
            image_path: Path to image file
            
        Returns:
            List of markdown-formatted tables
        """
        prompt = (
            "Identify and extract all tables from this image. "
            "For each table, convert it to markdown format with proper alignment. "
            "Return each table separately with a blank line between them. "
            "If there are no tables, return an empty response. "
            "Do not include any explanatory text, only the markdown tables."
        )
        
        try:
            result = self._call_vision_model(image_path, prompt)
            
            if not result.strip():
                return []
            
            # Split by double newlines to separate multiple tables
            tables = [
                table.strip()
                for table in result.split("\n\n")
                if "|" in table  # Basic check for markdown table
            ]
            
            return tables
        
        except Exception as e:
            logger.error(f"Table extraction failed for {image_path}: {e}")
            return []
    
    def extract_full_content(self, image_path: Path) -> Dict[str, any]:
        """
        Extract comprehensive content including text, tables, and structure.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with 'text', 'tables', and 'has_tables' keys
        """
        prompt = (
            "Analyze this image and extract all content in a structured format:\n\n"
            "1. First, identify if there are any tables present\n"
            "2. If tables exist, extract them in markdown format\n"
            "3. Then extract all other text content\n\n"
            "Format your response as:\n"
            "TABLES:\n"
            "[markdown tables here, or 'None' if no tables]\n\n"
            "TEXT:\n"
            "[all other text content here]\n\n"
            "Be precise and maintain the original structure."
        )
        
        try:
            result = self._call_vision_model(image_path, prompt)
            
            # Parse the structured response
            content = {
                "text": "",
                "tables": [],
                "has_tables": False
            }
            
            if "TABLES:" in result and "TEXT:" in result:
                parts = result.split("TEXT:")
                table_section = parts[0].replace("TABLES:", "").strip()
                text_section = parts[1].strip() if len(parts) > 1 else ""
                
                # Extract tables
                if table_section.lower() != "none" and "|" in table_section:
                    tables = [
                        t.strip()
                        for t in table_section.split("\n\n")
                        if "|" in t
                    ]
                    content["tables"] = tables
                    content["has_tables"] = len(tables) > 0
                
                # Extract text
                content["text"] = text_section
            else:
                # Fallback: treat entire response as text
                content["text"] = result
            
            return content
        
        except Exception as e:
            logger.error(f"Full content extraction failed for {image_path}: {e}")
            return {"text": "", "tables": [], "has_tables": False}
    
    def extract_with_confidence(self, image_path: Path) -> Tuple[str, float]:
        """
        Extract text and estimate confidence level.
        
        Note: DeepSeek via Ollama doesn't provide confidence scores,
        so we use heuristics based on response quality.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Tuple of (extracted_text, confidence_score)
        """
        text = self.extract_text(image_path)
        
        # Heuristic confidence estimation
        confidence = 0.0
        if text:
            # Base confidence if we got any text
            confidence = 0.7
            
            # Increase if text has good structure (sentences, punctuation)
            if any(char in text for char in ".!?"):
                confidence += 0.1
            
            # Increase if text has multiple words
            if len(text.split()) > 5:
                confidence += 0.1
            
            # Decrease if text is very short (might be error/noise)
            if len(text.split()) < 3:
                confidence -= 0.2
            
            confidence = max(0.0, min(1.0, confidence))
        
        return text, confidence
    
    def is_available(self) -> bool:
        """
        Check if DeepSeek model is available in Ollama.
        
        Returns:
            True if model is available, False otherwise
        """
        try:
            client = self._get_client()
            models = client.list()
            
            # Check if DeepSeek model is in the list
            # Handle both new API (Model objects) and old API (dict)
            model_names = []
            for m in getattr(models, 'models', []):
                if hasattr(m, 'model'):
                    model_names.append(m.model)
                elif isinstance(m, dict):
                    model_names.append(m.get('name', ''))
            return any(self.model_name in name for name in model_names)
        
        except Exception as e:
            logger.error(f"Failed to check DeepSeek availability: {e}")
            return False
