from fastapi import APIRouter, Depends
from database import db
from auth import get_current_business

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(business=Depends(get_current_business)):
    items = await db.notifications.find({"business_id": business["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    unread = sum(1 for n in items if not n.get("is_read"))
    return {"items": items, "unread_count": unread}


@router.post("/{notification_id}/read")
async def mark_read(notification_id: str, business=Depends(get_current_business)):
    await db.notifications.update_one({"id": notification_id, "business_id": business["id"]}, {"$set": {"is_read": True}})
    return {"message": "ok"}


@router.post("/read-all")
async def mark_all_read(business=Depends(get_current_business)):
    await db.notifications.update_many({"business_id": business["id"]}, {"$set": {"is_read": True}})
    return {"message": "ok"}
