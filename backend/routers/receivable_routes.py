import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import get_current_business
from models import ReceivableCreate, ReceivablePayment
import transaction_service as ts

router = APIRouter(prefix="/api/receivables", tags=["receivables"])
now_iso = lambda: datetime.now(timezone.utc).isoformat()


@router.get("")
async def list_receivables(status: str = None, business=Depends(get_current_business)):
    q = {"business_id": business["id"]}
    if status:
        q["status"] = status
    else:
        q["outstanding"] = {"$gt": 0}
    items = await db.receivables.find(q, {"_id": 0}).sort("due_date", 1).to_list(500)
    total = sum(i.get("outstanding", 0) or 0 for i in items)
    return {"total_outstanding": round(total, 2), "items": items}


@router.post("")
async def create_receivable(payload: ReceivableCreate, business=Depends(get_current_business)):
    rec = {
        "id": f"rec_{uuid.uuid4().hex[:10]}", "business_id": business["id"], "customer": payload.customer,
        "reference": payload.reference, "original_amount": payload.original_amount, "paid_amount": 0,
        "outstanding": payload.original_amount, "due_date": payload.due_date, "status": "unpaid",
        "transaction_id": None, "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.receivables.insert_one(dict(rec))
    return rec


@router.put("/{receivable_id}")
async def pay_receivable(receivable_id: str, payload: ReceivablePayment, business=Depends(get_current_business), user=None):
    rec = await db.receivables.find_one({"id": receivable_id, "business_id": business["id"]}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "Piutang tidak ditemukan")
    tx = await ts.create_transaction(business["id"], "system", {
        "type": "RECEIVABLE_PAYMENT", "amount": payload.amount, "account_id": payload.account_id,
        "date": payload.date, "receivable_id": receivable_id, "status": "PAID",
    })
    return {"transaction": tx, "receivable": await db.receivables.find_one({"id": receivable_id, "business_id": business["id"]}, {"_id": 0})}
