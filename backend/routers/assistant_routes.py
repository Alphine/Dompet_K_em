import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import get_current_user, get_current_business
from models import ChatRequest
import ai_service as ai

router = APIRouter(prefix="/api/assistant", tags=["assistant"])
now_iso = lambda: datetime.now(timezone.utc).isoformat()


@router.post("/chat")
async def chat(payload: ChatRequest, business=Depends(get_current_business), user=Depends(get_current_user)):
    biz_id = business["id"]
    conv_id = payload.conversation_id
    if not conv_id:
        conv_id = f"conv_{uuid.uuid4().hex[:10]}"
        await db.ai_conversations.insert_one({
            "id": conv_id, "business_id": biz_id, "user_id": user["user_id"],
            "title": payload.message[:60], "created_at": now_iso(), "updated_at": now_iso(),
        })
    else:
        conv = await db.ai_conversations.find_one({"id": conv_id, "business_id": biz_id}, {"_id": 0})
        if not conv:
            raise HTTPException(404, "Percakapan tidak ditemukan")

    prev_msgs = await db.ai_messages.find({"conversation_id": conv_id}, {"_id": 0}).sort("created_at", 1).to_list(20)
    history_text = "\n".join([f"{m['role']}: {m['content']}" for m in prev_msgs[-10:]])

    user_msg = {
        "id": f"msg_{uuid.uuid4().hex[:10]}", "conversation_id": conv_id, "role": "user",
        "content": payload.message, "tool_calls": None, "created_at": now_iso(),
    }
    await db.ai_messages.insert_one(dict(user_msg))

    answer, tool_trace = await ai.run_chat_turn(biz_id, business, payload.message, history_text)

    assistant_msg = {
        "id": f"msg_{uuid.uuid4().hex[:10]}", "conversation_id": conv_id, "role": "assistant",
        "content": answer, "tool_calls": tool_trace, "created_at": now_iso(),
    }
    await db.ai_messages.insert_one(dict(assistant_msg))
    await db.ai_conversations.update_one({"id": conv_id}, {"$set": {"updated_at": now_iso()}})

    return {"conversation_id": conv_id, "message": answer, "tool_calls": tool_trace}


@router.get("/conversations")
async def list_conversations(business=Depends(get_current_business)):
    return await db.ai_conversations.find({"business_id": business["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(100)


@router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str, business=Depends(get_current_business)):
    conv = await db.ai_conversations.find_one({"id": conv_id, "business_id": business["id"]}, {"_id": 0})
    if not conv:
        raise HTTPException(404, "Percakapan tidak ditemukan")
    messages = await db.ai_messages.find({"conversation_id": conv_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return {"conversation": conv, "messages": messages}
