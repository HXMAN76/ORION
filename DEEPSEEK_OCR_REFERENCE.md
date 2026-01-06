# DeepSeek OCR Quick Reference

## Model Information
- **Model Name**: `deepseek-vl`
- **Size**: ~4GB
- **Install**: `ollama pull deepseek-vl`

## Features Enabled

### ✅ PDF Processing
- Scanned page OCR (200 DPI)
- Table extraction from images
- Metadata: `extraction_method: "ocr"` or `"native"`

### ✅ Image Processing
- Text extraction
- Table detection and markdown conversion
- Multiple tables per image

### ✅ DOCX Processing
- **NEW**: Embedded image OCR
- Extracts text from screenshots/images in DOCX
- Table extraction from embedded images

## Configuration

### Enable/Disable OCR

```python
# PDF
PDFProcessor(use_ocr=True)  # Default: True

# Images
ImageProcessor(use_ocr=True, use_vision=True)  # Default: True, True

# DOCX
DOCXProcessor(use_ocr_for_images=True)  # Default: True
```

### OCR Model Settings (config.py)

```python
DEEPSEEK_MODEL: str = "deepseek-vl"
OLLAMA_HOST: str = "http://localhost:11434"
```

## API Endpoints

All existing endpoints work unchanged:

```bash
# Ingest PDF
POST /ingest -F "file=@document.pdf"

# Ingest Image
POST /ingest -F "file=@image.png"

# Ingest DOCX
POST /ingest -F "file=@report.docx"
```

## Metadata Fields

OCR-extracted chunks include:

```python
{
    "extraction_method": "deepseek",  # or "ocr", "native"
    "content_type": "ocr_text",       # or "table", "embedded_image_text"
    "table_index": 0,                  # for tables
    "image_rel_id": "rId4"            # for DOCX embedded images
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not found | `ollama pull deepseek-vl` |
| Slow processing | Expected (Vision LLM vs traditional OCR) |
| Ollama connection failed | Check `OLLAMA_HOST` in config.py |
| OCR disabled warning | Install DeepSeek model |

## Dependencies Removed

- ❌ `paddleocr>=2.7.0`
- ❌ `paddlepaddle>=2.5.0`

## Dependencies Required

- ✅ `ollama` (already in requirements)
- ✅ DeepSeek model in Ollama

---

**Status**: ✅ Production Ready  
**Compatibility**: Fully backward compatible
