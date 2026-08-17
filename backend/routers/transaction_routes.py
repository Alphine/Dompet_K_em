from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from database import db
from auth import get_current_user, get_current_business
from models import TransactionCreate, TransactionUpdate
import transaction_service as ts

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
now_iso = lambda: datetime.now(timezone.utc).isoformat()


@router.get("")
async def list_transactions(
    type: str = None, start_date: str = None, end_date: str = None, limit: int = Query(50, le=500),
    business=Depends(get_current_business),
):
    q = {"business_id": business["id"]}
    if type:
        q["type"] = type
    if start_date or end_date:
        date_q = {}
        if start_date:
            date_q["$gte"] = start_date
        if end_date:
            date_q["$lte"] = end_date
        q["date"] = date_q
    items = await db.transactions.find(q, {"_id": 0}).sort("date", -1).to_list(limit)
    return items


@router.post("")
async def create_transaction(payload: TransactionCreate, business=Depends(get_current_business), user=Depends(get_current_user)):
    data = payload.model_dump()
    data["type"] = data["type"].value if hasattr(data["type"], "value") else data["type"]
    data["status"] = data["status"].value if hasattr(data["status"], "value") else data["status"]
    if data.get("category_name") and not data.get("category_id"):
        cat = await db.categories.find_one({"business_id": business["id"], "name": data["category_name"]}, {"_id": 0})
        if not cat:
            import uuid
            cat = {"id": f"cat_{uuid.uuid4().hex[:10]}", "business_id": business["id"], "name": data["category_name"], "type": "expense", "is_default": False, "created_at": now_iso()}
            await db.categories.insert_one(dict(cat))
        data["category_id"] = cat["id"]
    tx = await ts.create_transaction(business["id"], user["user_id"], data)
    return tx


@router.get("/{tx_id}")
async def get_transaction(tx_id: str, business=Depends(get_current_business)):
    tx = await db.transactions.find_one({"id": tx_id, "business_id": business["id"]}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    return tx


@router.put("/{tx_id}")
async def update_transaction(tx_id: str, payload: TransactionUpdate, business=Depends(get_current_business)):
    tx = await db.transactions.find_one({"id": tx_id, "business_id": business["id"]}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update:
        update["updated_at"] = now_iso()
        await db.transactions.update_one({"id": tx_id, "business_id": business["id"]}, {"$set": update})
    return await db.transactions.find_one({"id": tx_id, "business_id": business["id"]}, {"_id": 0})


@router.delete("/{tx_id}")
async def delete_transaction(tx_id: str, business=Depends(get_current_business)):
    return await ts.delete_transaction(business["id"], tx_id)
