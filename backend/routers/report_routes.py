import io
import csv
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from database import db
from auth import get_current_business
import finance_engine as fe

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/profit-loss")
async def profit_loss(start: str = None, end: str = None, business=Depends(get_current_business)):
    if not start or not end:
        start, end = fe.current_month_range()
    return await fe.get_net_profit(business["id"], start, end)


@router.get("/cashflow")
async def cashflow(start: str = None, end: str = None, business=Depends(get_current_business)):
    if not start or not end:
        start, end = fe.current_month_range()
    return await fe.get_cashflow(business["id"], start, end)


@router.get("/sales")
async def sales_report(start: str = None, end: str = None, groupby: str = "day", business=Depends(get_current_business)):
    if not start or not end:
        start, end = fe.current_month_range()
    biz_id = business["id"]
    if groupby in ("product",):
        return await fe.get_sales_by_product(biz_id, start, end)
    q = {"business_id": biz_id, "type": "SALE", "status": {"$ne": "CANCELLED"}, "date": {"$gte": start, "$lte": end}}
    buckets = {}
    async for tx in db.transactions.find(q, {"_id": 0}):
        d = tx["date"]
        if groupby == "month":
            key = d[:7]
        elif groupby == "week":
            from datetime import date as date_cls
            dt = date_cls.fromisoformat(d)
            key = f"{dt.year}-W{dt.isocalendar()[1]:02d}"
        else:
            key = d
        buckets[key] = buckets.get(key, 0) + tx.get("amount", 0)
    items = [{"period": k, "revenue": round(v, 2)} for k, v in sorted(buckets.items())]
    return {"items": items}


@router.get("/expenses")
async def expenses_report(start: str = None, end: str = None, business=Depends(get_current_business)):
    if not start or not end:
        start, end = fe.current_month_range()
    this_month = await fe.get_expense_breakdown(business["id"], start, end)
    prev_start, prev_end = fe.previous_month_range()
    prev_month = await fe.get_expense_breakdown(business["id"], prev_start, prev_end)
    return {"current": this_month, "previous": prev_month}


@router.get("/receivables")
async def receivables_report(business=Depends(get_current_business)):
    aging = await fe.get_receivables_aging(business["id"])
    recv = await fe.get_receivables(business["id"])
    return {"aging": aging, "total_outstanding": recv["total_outstanding"], "items": recv["items"]}


@router.get("/payables")
async def payables_report(business=Depends(get_current_business)):
    aging = await fe.get_payables_aging(business["id"])
    pay = await fe.get_payables(business["id"])
    return {"aging": aging, "total_outstanding": pay["total_outstanding"], "items": pay["items"]}


@router.get("/export")
async def export_csv(type: str = Query("transactions"), start: str = None, end: str = None, business=Depends(get_current_business)):
    biz_id = business["id"]
    output = io.StringIO()
    writer = csv.writer(output)
    if type == "transactions":
        q = {"business_id": biz_id}
        if start or end:
            date_q = {}
            if start:
                date_q["$gte"] = start
            if end:
                date_q["$lte"] = end
            q["date"] = date_q
        writer.writerow(["Tanggal", "Tipe", "Jumlah", "Status", "Pihak Terkait", "Deskripsi"])
        async for tx in db.transactions.find(q, {"_id": 0}).sort("date", 1):
            writer.writerow([tx.get("date"), tx.get("type"), tx.get("amount"), tx.get("status"), tx.get("counterparty") or "", tx.get("description") or ""])
    elif type == "profit-loss":
        if not start or not end:
            start, end = fe.current_month_range()
        data = await fe.get_net_profit(biz_id, start, end)
        writer.writerow(["Metrik", "Nilai"])
        for k, v in data.items():
            writer.writerow([k, v])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={type}.csv"})
