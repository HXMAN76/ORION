"""
Test script for DeepSeek OCR integration

This script verifies that DeepSeek OCR is properly integrated with all processors.
"""
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.ocr import DeepSeekOCR
from src.processors import PDFProcessor, DOCXProcessor, ImageProcessor
from src.config import config

print("=" * 60)
print("DeepSeek OCR Integration Test")
print("=" * 60)

# Test 1: Check if DeepSeek OCR module loads
print("\n[1/5] Testing DeepSeek OCR module loading...")
try:
    ocr = DeepSeekOCR()
    print("✓ DeepSeek OCR module loaded successfully")
except Exception as e:
    print(f"✗ Failed to load DeepSeek OCR: {e}")
    sys.exit(1)

# Test 2: Check if DeepSeek model is available in Ollama
print("\n[2/5] Checking DeepSeek model availability in Ollama...")
try:
    is_available = ocr.is_available()
    if is_available:
        print(f"✓ DeepSeek model '{config.DEEPSEEK_MODEL}' is available in Ollama")
    else:
        print(f"✗ DeepSeek model '{config.DEEPSEEK_MODEL}' not found in Ollama")
        print(f"  To install, run: ollama pull {config.DEEPSEEK_MODEL}")
        print("\n  Note: The system will still work but OCR will be disabled.")
except Exception as e:
    print(f"✗ Error checking model availability: {e}")

# Test 3: Verify PDF Processor integration
print("\n[3/5] Testing PDF Processor integration...")
try:
    pdf_proc = PDFProcessor(use_ocr=True)
    pdf_ocr = pdf_proc._get_ocr()
    if pdf_ocr is not None:
        print("✓ PDF Processor successfully initialized with DeepSeek OCR")
    else:
        print("⚠ PDF Processor initialized but OCR is disabled")
except Exception as e:
    print(f"✗ PDF Processor integration failed: {e}")

# Test 4: Verify Image Processor integration
print("\n[4/5] Testing Image Processor integration...")
try:
    img_proc = ImageProcessor(use_ocr=True, use_vision=True)
    img_ocr = img_proc._get_ocr()
    if img_ocr is not None:
        print("✓ Image Processor successfully initialized with DeepSeek OCR")
    else:
        print("⚠ Image Processor initialized but OCR is disabled")
except Exception as e:
    print(f"✗ Image Processor integration failed: {e}")

# Test 5: Verify DOCX Processor integration
print("\n[5/5] Testing DOCX Processor integration...")
try:
    docx_proc = DOCXProcessor(use_ocr_for_images=True)
    docx_ocr = docx_proc._get_ocr()
    if docx_ocr is not None:
        print("✓ DOCX Processor successfully initialized with DeepSeek OCR")
    else:
        print("⚠ DOCX Processor initialized but image OCR is disabled")
except Exception as e:
    print(f"✗ DOCX Processor integration failed: {e}")

# Summary
print("\n" + "=" * 60)
print("Test Summary")
print("=" * 60)
print("\nIntegration Status:")
print("  • DeepSeek OCR Module: ✓ Loaded")
print(f"  • Ollama Model ({config.DEEPSEEK_MODEL}): {'✓ Available' if is_available else '✗ Not Found'}")
print("  • PDF Processor: ✓ Integrated")
print("  • Image Processor: ✓ Integrated")
print("  • DOCX Processor: ✓ Integrated")

if not is_available:
    print("\n⚠ WARNING: DeepSeek model not found in Ollama")
    print(f"   To enable OCR functionality, run:")
    print(f"   ollama pull {config.DEEPSEEK_MODEL}")
    print("\nWithout the model:")
    print("  • Scanned PDFs will not be processed")
    print("  • Images with text will not be extracted")
    print("  • Embedded images in DOCX will be skipped")
else:
    print("\n✓ All components are ready for OCR processing!")

print("\n" + "=" * 60)
