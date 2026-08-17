import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import get_current_user, get_current_business
from models import BusinessCreate, BusinessUpdate
from seed import seed_demo_business

router = APIRouter(prefix="/api/business", tags=["business"])
now_iso = lambda: datetime.now(timezone.utc).isoformat()

DEFAULT_EXPENSE_CATEGORIES = [
    "Sewa", "Listrik & Air", "Internet", "Transportasi", "Marketing",
    "Kemasan", "Gaji Karyawan", "Perlengkapan", "Perawatan", "Biaya Bank",
    "Biaya Platform", "Lainnya",
]


@router.get("")
async def get_business(user=Depends(get_current_user)):
    business = await db.businesses.find_one({"owner_user_id": user["user_id"]}, {"_id": 0})
    if not business:
        raise HTTPException(404, "NO_BUSINESS")
    return business


@router.post("")
async def create_business(payload: BusinessCreate, user=Depends(get_current_user)):
    existing = await db.businesses.find_one({"owner_user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(400, "Anda sudah memiliki bisnis")

    if payload.load_demo_data:
        business = await seed_demo_business(user["user_id"])
        return business

    biz_id = f"biz_{uuid.uuid4().hex[:10]}"
    business = {
        "id": biz_id, "owner_user_id": user["user_id"], "business_name": payload.business_name,
        "business_type": payload.business_type.value, "business_category": payload.business_category,
        "city": payload.city, "currency": payload.currency, "mode": "simple", "is_demo": False,
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.businesses.insert_one(dict(business))

    accounts = [
        {"id": f"acc_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "name": "Kas Tunai", "type": "CASH", "opening_balance": payload.starting_cash, "current_balance": payload.starting_cash, "status": "active", "created_at": now_iso(), "updated_at": now_iso()},
        {"id": f"acc_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "name": "Bank", "type": "BANK", "opening_balance": 0, "current_balance": 0, "status": "active", "created_at": now_iso(), "updated_at": now_iso()},
        {"id": f"acc_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "name": "E-wallet", "type": "EWALLET", "opening_balance": 0, "current_balance": 0, "status": "active", "created_at": now_iso(), "updated_at": now_iso()},
    ]
    await db.accounts.insert_many([dict(a) for a in accounts])

    categories = [
        {"id": f"cat_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "name": name, "type": "expense", "is_default": True, "created_at": now_iso()}
        for name in DEFAULT_EXPENSE_CATEGORIES
    ]
    await db.categories.insert_many([dict(c) for c in categories])

    return business


@router.put("")
async def update_business(payload: BusinessUpdate, business=Depends(get_current_business)):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update:
        update["updated_at"] = now_iso()
        await db.businesses.update_one({"id": business["id"]}, {"$set": update})
    updated = await db.businesses.find_one({"id": business["id"]}, {"_id": 0})
    return updated
