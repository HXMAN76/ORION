"""Voice processor with Whisper transcription and Pyannote diarization"""
from pathlib import Path
from typing import List, Optional, Tuple
import tempfile

from .base import BaseProcessor, Chunk
from ..config import config


class VoiceProcessor(BaseProcessor):
    """Process audio files with speech-to-text and speaker diarization"""
    
    @property
    def supported_extensions(self) -> List[str]:
        return [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm"]
    
    @property
    def doc_type(self) -> str:
        return "voice"
    
    def __init__(self, use_diarization: bool = True):
        """
        Initialize voice processor.
        
        Args:
            use_diarization: Whether to use speaker diarization
        """
        self.use_diarization = use_diarization
        self._whisper = None
        self._diarization_pipeline = None
    
    def _get_whisper(self):
        """Lazy load Whisper model"""
        if self._whisper is None:
            try:
                import whisper
                self._whisper = whisper.load_model(config.WHISPER_MODEL)
            except ImportError:
                print("Warning: Whisper not installed")
        return self._whisper
    
    def _get_diarization(self):
        """Lazy load diarization pipeline"""
        if self._diarization_pipeline is None and self.use_diarization:
            try:
                from pyannote.audio import Pipeline
                import torch
                
                # Note: Requires HuggingFace token on first run
                self._diarization_pipeline = Pipeline.from_pretrained(
                    "pyannote/speaker-diarization-3.1",
                    use_auth_token=True
                )
                
                # Use GPU if available
                if torch.cuda.is_available():
                    self._diarization_pipeline.to(torch.device("cuda"))
            except Exception as e:
                print(f"Warning: Diarization not available: {e}")
        return self._diarization_pipeline
    
    def process(self, file_path: Path, document_id: Optional[str] = None) -> List[Chunk]:
        """
        Process an audio file and extract chunks.
        
        Args:
            file_path: Path to the audio file
            document_id: Optional document identifier
            
        Returns:
            List of Chunk objects with transcribed text and speaker labels
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        document_id = document_id or self._generate_document_id(file_path)
        chunks: List[Chunk] = []
        
        # Get diarization segments (who spoke when)
        if self.use_diarization:
            segments = self._diarize(file_path)
        else:
            segments = None
        
        # Transcribe with Whisper
        transcription = self._transcribe(file_path)
        
        if not transcription:
            return chunks
        
        if segments:
            # Align transcription with speaker diarization
            chunks = self._align_transcription_with_speakers(
                transcription,
                segments,
                document_id,
                file_path
            )
        else:
            # No diarization - create chunks from transcription segments
            for segment in transcription.get("segments", []):
                chunks.append(Chunk(
                    content=segment["text"].strip(),
                    document_id=document_id,
                    doc_type=self.doc_type,
                    source_file=str(file_path),
                    timestamp_start=segment["start"],
                    timestamp_end=segment["end"],
                    metadata={
                        "language": transcription.get("language", "unknown")
                    }
                ))
        
        return chunks
    
    def _transcribe(self, file_path: Path) -> Optional[dict]:
        """Transcribe audio using Whisper"""
        whisper = self._get_whisper()
        if whisper is None:
            return None
        
        try:
            result = whisper.transcribe(
                str(file_path),
                language=None,  # Auto-detect
                task="transcribe"
            )
            return result
        except Exception as e:
            print(f"Transcription error: {e}")
            return None
    
    def _diarize(self, file_path: Path) -> Optional[List[Tuple[float, float, str]]]:
        """Get speaker diarization segments"""
        pipeline = self._get_diarization()
        if pipeline is None:
            return None
        
        try:
            diarization = pipeline(str(file_path))
            
            segments = []
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                segments.append((turn.start, turn.end, speaker))
            
            return segments
        except Exception as e:
            print(f"Diarization error: {e}")
            return None
    
    def _align_transcription_with_speakers(
        self,
        transcription: dict,
        diarization_segments: List[Tuple[float, float, str]],
        document_id: str,
        file_path: Path
    ) -> List[Chunk]:
        """Align Whisper segments with diarization speaker labels"""
        chunks = []
        
        for segment in transcription.get("segments", []):
            seg_start = segment["start"]
            seg_end = segment["end"]
            seg_mid = (seg_start + seg_end) / 2
            
            # Find the speaker for this segment
            speaker = "Unknown"
            for d_start, d_end, d_speaker in diarization_segments:
                if d_start <= seg_mid <= d_end:
                    speaker = d_speaker
                    break
            
            chunks.append(Chunk(
                content=segment["text"].strip(),
                document_id=document_id,
                doc_type=self.doc_type,
                source_file=str(file_path),
                timestamp_start=seg_start,
                timestamp_end=seg_end,
                speaker=speaker,
                metadata={
                    "language": transcription.get("language", "unknown")
                }
            ))
        
        return chunks
