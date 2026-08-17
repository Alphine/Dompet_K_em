import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from database import db
from auth import get_current_business
import storage as st

router = APIRouter(prefix="/api", tags=["uploads"])
now_iso = lambda: datetime.now(timezone.utc).isoformat()

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "pdf": "application/pdf",
}


@router.post("/uploads")
async def upload_file(file: UploadFile = File(...), business=Depends(get_current_business)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(400, "Ukuran file maksimal 8MB")
    file_id = str(uuid.uuid4())
    path = f"{st.APP_NAME}/receipts/{business['id']}/{file_id}.{ext}"
    result = st.put_object(path, data, content_type)
    await db.files.insert_one({
        "id": file_id, "business_id": business["id"], "storage_path": result["path"],
        "original_filename": file.filename, "content_type": content_type,
        "size": result.get("size", len(data)), "is_deleted": False, "created_at": now_iso(),
    })
    return {"id": file_id, "url": f"/api/files/{file_id}"}


@router.get("/files/{file_id}")
async def download_file(file_id: str, business=Depends(get_current_business)):
    record = await db.files.find_one({"id": file_id, "business_id": business["id"], "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "File tidak ditemukan")
    data, content_type = st.get_object(record["storage_path"])
    return Response(content=data, media_type=record.get("content_type", content_type))
