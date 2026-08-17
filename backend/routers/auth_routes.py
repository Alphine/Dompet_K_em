import uuid
import requests
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/session")
async def create_session(payload: dict, response: Response):
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(400, "session_id wajib diisi")
    r = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": session_id}, timeout=10,
    )
    if r.status_code != 200:
        raise HTTPException(401, "Sesi login tidak valid")
    data = r.json()
    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data.get("name"), "picture": data.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name"), "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {
            "user_id": user_id, "session_token": session_token,
            "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", max_age=7 * 24 * 3600, path="/")
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return user


@router.post("/logout")
async def logout(request: Request, response: Response, user=Depends(get_current_user)):
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Berhasil logout"}
