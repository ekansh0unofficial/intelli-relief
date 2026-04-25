from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, status
from loguru import logger
from pydantic import BaseModel

from app.core.auth import Roles, require_roles
from app.infrastructure.inference import infer_from_description
from app.infrastructure.speech import transcribe_audio
from app.services.alert.models import IncidentType, Severity
from app.services.auth.models import User

router = APIRouter()


class TranscribeResponse(BaseModel):
    transcript: str
    inferred_title: str
    inferred_incident_type: IncidentType
    inferred_severity: Severity


@router.post(
    "",
    response_model=TranscribeResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe voice audio and infer alert fields",
)
async def transcribe_voice(
    file: UploadFile = File(..., description="Audio file (WAV, MP3, M4A, OGG)"),
    current_user: User = Depends(require_roles(*Roles.ADMIN_OPERATOR)),
):
    """
    Accept an audio file, transcribe it, and return the transcript with
    inferred incident_type, severity, and a suggested title.
    The operator reviews these fields before submitting POST /api/alerts.
    No database writes.
    """
    file_bytes = await file.read()
    transcript = await transcribe_audio(file_bytes, filename=file.filename or "audio.wav")
    logger.info(
        "Transcription by {} ({} chars): {}",
        current_user.username,
        len(transcript),
        transcript[:80],
    )

    inferred = infer_from_description(transcript)
    return TranscribeResponse(
        transcript=transcript,
        inferred_title=inferred.title,
        inferred_incident_type=inferred.incident_type,
        inferred_severity=inferred.severity,
    )
