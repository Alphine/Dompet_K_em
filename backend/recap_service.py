import uuid
from datetime import datetime, timezone, timedelta
from database import db
import finance_engine as fe

now_iso = lambda: datetime.now(timezone.utc).isoformat()


def _fmt(n):
    return "Rp" + f"{round(n):,}".replace(",", ".")


async def build_recap_text(business_id):
    today = datetime.now(timezone.utc).date()
    start = (today - timedelta(days=6)).isoformat()
    end = today.isoformat()
    net = await fe.get_net_profit(business_id, start, end)
    expenses = await fe.get_expense_breakdown(business_id, start, end)
    top_expense = expenses["breakdown"][0] if expenses["breakdown"] else None

    lines = [
        f"Rekap Mingguan K-eM ({start} s/d {end})",
        "",
        f"Omzet minggu ini: {_fmt(net['revenue'])}",
        f"Laba bersih: {_fmt(net['net_profit'])}",
    ]
    if top_expense:
        lines.append(f"Pengeluaran terbesar: {top_expense['category']} ({_fmt(top_expense['amount'])})")
    else:
        lines.append("Belum ada pengeluaran tercatat minggu ini.")
    lines.append("")
    if net["net_profit"] >= 0:
        lines.append("Saran K-eM: usaha tetap untung minggu ini, pertahankan kontrol biaya operasional.")
    else:
        lines.append("Saran K-eM: laba bersih negatif minggu ini, coba cek kembali pengeluaran terbesar Anda.")
    return "\n".join(lines), net, top_expense


async def send_weekly_recap(business):
    biz_id = business["id"]
    text, net, top_expense = await build_recap_text(biz_id)

    conv_id = f"conv_recap_{biz_id[-10:]}"
    conv = await db.ai_conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        await db.ai_conversations.insert_one({
            "id": conv_id, "business_id": biz_id, "user_id": business.get("owner_user_id"),
            "title": "Rekap Mingguan K-eM", "created_at": now_iso(), "updated_at": now_iso(),
        })
    await db.ai_messages.insert_one({
        "id": f"msg_{uuid.uuid4().hex[:10]}", "conversation_id": conv_id, "role": "assistant",
        "content": text, "tool_calls": None, "created_at": now_iso(),
    })
    await db.ai_conversations.update_one({"id": conv_id}, {"$set": {"updated_at": now_iso()}})

    await db.notifications.insert_one({
        "id": f"notif_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "type": "weekly_recap",
        "title": "Rekap Mingguan Siap", "message": f"Omzet: {_fmt(net['revenue'])} · Laba: {_fmt(net['net_profit'])}",
        "severity": "info", "is_read": False, "link": "/assistant", "created_at": now_iso(),
    })


async def run_weekly_recap_for_all_businesses():
    async for business in db.businesses.find({}, {"_id": 0}):
        try:
            await send_weekly_recap(business)
        except Exception:
            continue
