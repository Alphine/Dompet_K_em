import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import get_current_business
from models import ProductCreate, ProductUpdate, StockAdjust

router = APIRouter(prefix="/api/products", tags=["products"])
now_iso = lambda: datetime.now(timezone.utc).isoformat()


@router.get("")
async def list_products(business=Depends(get_current_business)):
    return await db.products.find({"business_id": business["id"]}, {"_id": 0}).sort("name", 1).to_list(500)


@router.post("")
async def create_product(payload: ProductCreate, business=Depends(get_current_business)):
    prod = {
        "id": f"prod_{uuid.uuid4().hex[:10]}", "business_id": business["id"], **payload.model_dump(),
        "status": "active", "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.products.insert_one(dict(prod))
    return prod


@router.put("/{product_id}")
async def update_product(product_id: str, payload: ProductUpdate, business=Depends(get_current_business)):
    prod = await db.products.find_one({"id": product_id, "business_id": business["id"]}, {"_id": 0})
    if not prod:
        raise HTTPException(404, "Produk tidak ditemukan")
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update:
        update["updated_at"] = now_iso()
        await db.products.update_one({"id": product_id, "business_id": business["id"]}, {"$set": update})
    return await db.products.find_one({"id": product_id, "business_id": business["id"]}, {"_id": 0})


@router.delete("/{product_id}")
async def delete_product(product_id: str, business=Depends(get_current_business)):
    prod = await db.products.find_one({"id": product_id, "business_id": business["id"]}, {"_id": 0})
    if not prod:
        raise HTTPException(404, "Produk tidak ditemukan")
    await db.products.update_one({"id": product_id, "business_id": business["id"]}, {"$set": {"status": "inactive", "updated_at": now_iso()}})
    return {"message": "Produk dihapus"}


@router.post("/{product_id}/adjust-stock")
async def adjust_stock(product_id: str, payload: StockAdjust, business=Depends(get_current_business)):
    prod = await db.products.find_one({"id": product_id, "business_id": business["id"]}, {"_id": 0})
    if not prod:
        raise HTTPException(404, "Produk tidak ditemukan")
    await db.products.update_one(
        {"id": product_id, "business_id": business["id"]},
        {"$inc": {"stock_qty": payload.quantity_change}, "$set": {"updated_at": now_iso()}},
    )
    return await db.products.find_one({"id": product_id, "business_id": business["id"]}, {"_id": 0})
