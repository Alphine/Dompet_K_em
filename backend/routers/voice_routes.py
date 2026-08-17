from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from auth import get_current_business
import voice_service as vs

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/parse")
async def parse_voice(file: UploadFile = File(...), business=Depends(get_current_business)):
    data = await file.read()
    if not data:
        raise HTTPException(400, "File audio kosong")
    try:
        transcript = await vs.transcribe_audio(data, file.filename or "audio.webm")
    except Exception as e:
        raise HTTPException(400, f"Gagal mentranskripsi audio: {e}")
    draft = await vs.parse_transaction_draft(transcript, business)
    return {"transcript": transcript, "draft": draft}
