from fastapi import APIRouter, Depends
from database import db
from auth import get_current_business

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("")
async def list_categories(business=Depends(get_current_business)):
    return await db.categories.find({"business_id": business["id"]}, {"_id": 0}).sort("name", 1).to_list(200)
