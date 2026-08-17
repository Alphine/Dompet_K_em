import uuid
from datetime import datetime, timezone, timedelta
from database import db

now_iso = lambda: datetime.now(timezone.utc).isoformat()


def _fmt(n):
    return "Rp" + f"{round(n):,}".replace(",", ".")


async def _already_reminded_today(business_id, ref_type, ref_id):
    today = datetime.now(timezone.utc).date().isoformat()
    existing = await db.notifications.find_one({
        "business_id": business_id, "type": ref_type, "link_ref": ref_id,
        "created_at": {"$gte": today},
    }, {"_id": 0})
    return existing is not None


async def check_receivable_reminders(business):
    biz_id = business["id"]
    today = datetime.now(timezone.utc).date()
    soon = (today + timedelta(days=2)).isoformat()
    async for rec in db.receivables.find({"business_id": biz_id, "outstanding": {"$gt": 0}}, {"_id": 0}):
        due = rec.get("due_date")
        if not due or due > soon:
            continue
        if await _already_reminded_today(biz_id, "receivable_reminder", rec["id"]):
            continue
        is_overdue = due < today.isoformat()
        title = "Piutang Jatuh Tempo" if not is_overdue else "Piutang Terlambat"
        message = (
            f"Piutang {rec['customer']} sebesar {_fmt(rec['outstanding'])} "
            + (f"sudah lewat jatuh tempo ({due})." if is_overdue else f"akan jatuh tempo pada {due}.")
        )
        await db.notifications.insert_one({
            "id": f"notif_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "type": "receivable_reminder",
            "title": title, "message": message, "severity": "warning" if is_overdue else "info",
            "is_read": False, "link": "/receivables", "link_ref": rec["id"], "created_at": now_iso(),
        })


async def run_receivable_reminders_for_all_businesses():
    async for business in db.businesses.find({}, {"_id": 0}):
        try:
            await check_receivable_reminders(business)
        except Exception:
            continue
