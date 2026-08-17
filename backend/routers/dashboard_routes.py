from fastapi import APIRouter, Depends
from auth import get_current_business
import finance_engine as fe

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(business=Depends(get_current_business)):
    biz_id = business["id"]
    start, end = fe.current_month_range()
    net = await fe.get_net_profit(biz_id, start, end)
    cash = await fe.get_cash_position(biz_id)
    recv = await fe.get_receivables(biz_id)
    overdue_recv = await fe.get_overdue_receivables(biz_id)
    pay = await fe.get_payables(biz_id)
    due_pay = await fe.get_due_payables(biz_id, days=7)
    low_stock = await fe.get_low_stock_items(biz_id)
    return {
        "period": {"start": start, "end": end},
        "revenue": net["revenue"], "cogs": net["cogs"], "gross_profit": net["gross_profit"],
        "gross_margin": net["gross_margin"], "operating_expenses": net["operating_expenses"],
        "net_profit": net["net_profit"], "net_margin": net["net_margin"],
        "cash_balance": cash["total_cash"], "accounts": cash["accounts"],
        "receivables_outstanding": recv["total_outstanding"], "receivables_overdue": overdue_recv["total_overdue"],
        "payables_outstanding": pay["total_outstanding"], "payables_due_this_week": due_pay["total_due"],
        "low_stock_count": low_stock["count"],
    }


@router.get("/cashflow")
async def cashflow(start: str = None, end: str = None, business=Depends(get_current_business)):
    if not start or not end:
        start, end = fe.current_month_range()
    return await fe.get_cashflow(business["id"], start, end)


@router.get("/profit-loss")
async def profit_loss(start: str = None, end: str = None, business=Depends(get_current_business)):
    if not start or not end:
        start, end = fe.current_month_range()
    return await fe.get_net_profit(business["id"], start, end)


@router.get("/alerts")
async def alerts(business=Depends(get_current_business)):
    biz_id = business["id"]
    result = []
    forecast = await fe.get_cashflow_forecast(biz_id, days=7)
    if forecast["projected_cash"] < 2_000_000:
        result.append({
            "type": "cashflow_risk", "severity": "warning",
            "title": "Risiko arus kas",
            "message": f"Estimasi kas dapat turun menjadi Rp{forecast['projected_cash']:,.0f} dalam 7 hari.".replace(",", "."),
            "data": forecast,
        })
    overdue = await fe.get_overdue_receivables(biz_id)
    if overdue["total_overdue"] > 0:
        result.append({
            "type": "receivable_overdue", "severity": "warning",
            "title": "Piutang jatuh tempo",
            "message": f"Rp{overdue['total_overdue']:,.0f} piutang sudah lewat jatuh tempo.".replace(",", "."),
            "data": overdue,
        })
    due = await fe.get_due_payables(biz_id, days=7)
    if due["total_due"] > 0:
        result.append({
            "type": "payable_due", "severity": "info",
            "title": "Tagihan minggu ini",
            "message": f"Rp{due['total_due']:,.0f} tagihan ke pemasok jatuh tempo minggu ini.".replace(",", "."),
            "data": due,
        })
    this_start, this_end = fe.current_month_range()
    prev_start, prev_end = fe.previous_month_range()
    this_gp = await fe.get_gross_profit(biz_id, this_start, this_end)
    prev_gp = await fe.get_gross_profit(biz_id, prev_start, prev_end)
    if prev_gp["revenue"] > 0 and this_gp["revenue"] > 0 and (prev_gp["gross_margin"] - this_gp["gross_margin"]) > 5:
        result.append({
            "type": "margin_drop", "severity": "warning",
            "title": "Margin kotor turun",
            "message": f"Margin kotor turun dari {prev_gp['gross_margin']:.0f}% menjadi {this_gp['gross_margin']:.0f}%.",
            "data": {"previous": prev_gp["gross_margin"], "current": this_gp["gross_margin"]},
        })
    anomalies = await fe.find_anomalies(biz_id)
    for a in anomalies["anomalies"]:
        result.append({
            "type": "expense_anomaly", "severity": "warning",
            "title": f"Pengeluaran {a['category']} tidak biasa",
            "message": f"Pengeluaran {a['category']} naik {a['increase_percent']:.0f}% dari rata-rata.",
            "data": a,
        })
    this_opex = await fe.get_operating_expenses(biz_id, this_start, this_end)
    prev_opex = await fe.get_operating_expenses(biz_id, prev_start, prev_end)
    if prev_opex["total_expenses"] > 0:
        change = (this_opex["total_expenses"] - prev_opex["total_expenses"]) / prev_opex["total_expenses"] * 100
        if change < -5:
            result.append({
                "type": "positive", "severity": "success",
                "title": "Biaya operasional turun",
                "message": f"Biaya operasional {abs(change):.0f}% lebih rendah dari bulan lalu.",
                "data": {"change_percent": round(change, 1)},
            })
    low_stock = await fe.get_low_stock_items(biz_id)
    if low_stock["count"] > 0:
        result.append({
            "type": "low_stock", "severity": "info",
            "title": "Stok menipis",
            "message": f"{low_stock['count']} produk stoknya menipis.",
            "data": low_stock,
        })
    return result
