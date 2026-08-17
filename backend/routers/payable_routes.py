import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import get_current_business
from models import PayableCreate, PayablePayment
import transaction_service as ts

router = APIRouter(prefix="/api/payables", tags=["payables"])
now_iso = lambda: datetime.now(timezone.utc).isoformat()


@router.get("")
async def list_payables(status: str = None, business=Depends(get_current_business)):
    q = {"business_id": business["id"]}
    if status:
        q["status"] = status
    else:
        q["outstanding"] = {"$gt": 0}
    items = await db.payables.find(q, {"_id": 0}).sort("due_date", 1).to_list(500)
    total = sum(i.get("outstanding", 0) or 0 for i in items)
    return {"total_outstanding": round(total, 2), "items": items}


@router.post("")
async def create_payable(payload: PayableCreate, business=Depends(get_current_business)):
    pay = {
        "id": f"pay_{uuid.uuid4().hex[:10]}", "business_id": business["id"], "supplier": payload.supplier,
        "reference": payload.reference, "original_amount": payload.original_amount, "paid_amount": 0,
        "outstanding": payload.original_amount, "due_date": payload.due_date, "status": "unpaid",
        "transaction_id": None, "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.payables.insert_one(dict(pay))
    return pay


@router.put("/{payable_id}")
async def pay_payable(payable_id: str, payload: PayablePayment, business=Depends(get_current_business)):
    pay = await db.payables.find_one({"id": payable_id, "business_id": business["id"]}, {"_id": 0})
    if not pay:
        raise HTTPException(404, "Utang tidak ditemukan")
    tx = await ts.create_transaction(business["id"], "system", {
        "type": "PAYABLE_PAYMENT", "amount": payload.amount, "account_id": payload.account_id,
        "date": payload.date, "payable_id": payable_id, "status": "PAID",
    })
    return {"transaction": tx, "payable": await db.payables.find_one({"id": payable_id, "business_id": business["id"]}, {"_id": 0})}
