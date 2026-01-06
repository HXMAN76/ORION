# Setup Guide: DeepSeek OCR for Orion

This guide walks you through setting up DeepSeek OCR on your Ollama server.

## Prerequisites

- Ollama installed and running on your server
- Sufficient disk space (~4GB for DeepSeek model)
- Network connection for initial model download

## Installation Steps

### 1. Verify Ollama is Running

```bash
# Check Ollama status
curl http://localhost:11434/api/tags
```

If Ollama is not running:
```bash
# Start Ollama (varies by OS)
ollama serve
```

### 2. Pull DeepSeek Vision Model

```bash
ollama pull deepseek-vl
```

**Note:** This will download approximately 4GB. Wait for completion.

### 3. Verify Model Installation

```bash
ollama list | grep deepseek
```

Expected output:
```
deepseek-vl    latest    ...    4.0 GB    ...
```

### 4. Test the Integration

From the Orion project directory:

```bash
cd "e:\Orion Project\Final Updation\ORION"
python test_deepseek_integration.py
```

You should see all green checkmarks (✓).

## Using DeepSeek OCR

### Default Behavior

OCR is **enabled by default** for:
- Scanned PDF pages (when native text extraction fails)
- Image files (when `use_ocr=True`)
- Embedded images in DOCX files

### Manual Control

If you want to disable OCR for specific processors:

```python
# Disable OCR for PDFs
pdf_processor = PDFProcessor(use_ocr=False)

# Disable OCR for images
image_processor = ImageProcessor(use_ocr=False)

# Disable embedded image OCR in DOCX
docx_processor = DOCXProcessor(use_ocr_for_images=False)
```

## What DeepSeek OCR Does

1. **Text Extraction**: Reads text from images and scanned pages
2. **Table Extraction**: Detects tables and converts them to markdown format
3. **Layout Understanding**: Preserves document structure and formatting

## Troubleshooting

### Model Not Found

If you get "DeepSeek model not found":
```bash
ollama pull deepseek-vl
```

### Slow Processing

DeepSeek OCR uses a vision LLM, which is slower than traditional OCR but provides better quality. This is expected behavior.

To speed up (with quality trade-off):
- Reduce DPI in processors (currently 200 DPI)
- Process fewer pages at once

### Connection Errors

Ensure Ollama is accessible:
```bash
curl http://localhost:11434/api/tags
```

If Ollama is on a different host, update `config.py`:
```python
OLLAMA_HOST: str = "http://your-server:11434"
```

## Next Steps

After setup is complete:
1. Upload a scanned PDF to test OCR
2. Upload an image with a table to verify table extraction
3. Upload a DOCX with embedded images to test comprehensive extraction

Enjoy enhanced OCR capabilities! 🚀
