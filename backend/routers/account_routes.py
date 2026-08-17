import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import get_current_business
from models import AccountCreate, AccountUpdate

router = APIRouter(prefix="/api/accounts", tags=["accounts"])
now_iso = lambda: datetime.now(timezone.utc).isoformat()


@router.get("")
async def list_accounts(business=Depends(get_current_business)):
    accounts = await db.accounts.find({"business_id": business["id"]}, {"_id": 0}).to_list(200)
    return accounts


@router.post("")
async def create_account(payload: AccountCreate, business=Depends(get_current_business)):
    acc = {
        "id": f"acc_{uuid.uuid4().hex[:10]}", "business_id": business["id"], "name": payload.name,
        "type": payload.type.value, "opening_balance": payload.opening_balance, "current_balance": payload.opening_balance,
        "status": "active", "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.accounts.insert_one(dict(acc))
    return acc


@router.put("/{account_id}")
async def update_account(account_id: str, payload: AccountUpdate, business=Depends(get_current_business)):
    acc = await db.accounts.find_one({"id": account_id, "business_id": business["id"]}, {"_id": 0})
    if not acc:
        raise HTTPException(404, "Akun tidak ditemukan")
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update:
        update["updated_at"] = now_iso()
        await db.accounts.update_one({"id": account_id, "business_id": business["id"]}, {"$set": update})
    return await db.accounts.find_one({"id": account_id, "business_id": business["id"]}, {"_id": 0})
