"""
Speech-to-text using faster-whisper (local, CPU, fully open-source).
Model is downloaded on first call (~75 MB for 'tiny', ~150 MB for 'base').
Thread-safe singleton load — never blocks the async event loop.
"""
import asyncio
import os
import tempfile
import threading

from loguru import logger

from app.core.config import settings
from app.core.exceptions import ServiceUnavailableException

_model = None
_model_lock = threading.Lock()


def _load_model():
    global _model
    with _model_lock:
        if _model is None:
            from faster_whisper import WhisperModel
            _model = WhisperModel(
                settings.WHISPER_MODEL,
                device="cpu",
                compute_type="int8",
            )
            logger.info("Whisper model '{}' loaded", settings.WHISPER_MODEL)
    return _model


def _transcribe_sync(file_bytes: bytes) -> str:
    """Blocking transcription — always called via run_in_executor."""
    model = _load_model()
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(file_bytes)
            tmp_path = f.name
        segments, _ = model.transcribe(tmp_path, beam_size=1)
        return " ".join(seg.text.strip() for seg in segments).strip()
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


async def transcribe_audio(file_bytes: bytes, filename: str = "audio.wav") -> str:
    """
    Transcribe audio bytes to text using local faster-whisper.
    First call downloads the model if not cached (~75 MB for 'tiny').
    Raises ServiceUnavailableException on failure.
    """
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _transcribe_sync, file_bytes)
    except Exception as exc:
        logger.error("Transcription failed: {}", exc)
        raise ServiceUnavailableException("Speech transcription")
