from datetime import datetime, timezone, date as date_cls
from database import db

DEFAULT_EXPENSE_CATEGORIES = [
    "Sewa", "Listrik & Air", "Internet", "Transportasi", "Marketing",
    "Kemasan", "Gaji Karyawan", "Perlengkapan", "Perawatan", "Biaya Bank",
    "Biaya Platform", "Lainnya",
]


def today_str():
    return datetime.now(timezone.utc).date().isoformat()


def current_month_range():
    today = datetime.now(timezone.utc).date()
    start = today.replace(day=1)
    return start.isoformat(), today.isoformat()


def previous_month_range():
    today = datetime.now(timezone.utc).date()
    first_of_this_month = today.replace(day=1)
    last_of_prev_month = first_of_this_month.fromordinal(first_of_this_month.toordinal() - 1)
    start = last_of_prev_month.replace(day=1)
    return start.isoformat(), last_of_prev_month.isoformat()


def _range_query(business_id, start=None, end=None, extra=None):
    q = {"business_id": business_id}
    if extra:
        q.update(extra)
    if start or end:
        date_q = {}
        if start:
            date_q["$gte"] = start
        if end:
            date_q["$lte"] = end
        q["date"] = date_q
    return q


def cash_delta(tx):
    """Net effect of a transaction on TOTAL cash across all accounts."""
    t = tx.get("type")
    amt = tx.get("amount", 0) or 0
    status = tx.get("status", "PAID")
    paid_amount = tx.get("paid_amount")
    if t == "SALE":
        if status == "PAID":
            return amt
        if status == "PARTIAL":
            return paid_amount or 0
        return 0
    if t == "EXPENSE":
        return -amt
    if t == "PURCHASE":
        if status == "PAID":
            return -amt
        if status == "PARTIAL":
            return -(paid_amount or 0)
        return 0
    if t == "RECEIVABLE_PAYMENT":
        return amt
    if t == "PAYABLE_PAYMENT":
        return -amt
    if t == "OWNER_INJECTION":
        return amt
    if t == "OWNER_WITHDRAWAL":
        return -amt
    if t == "TRANSFER":
        return 0
    if t == "ADJUSTMENT":
        return amt
    return 0


def account_delta(tx, account_id):
    """Net effect of a transaction on ONE specific account's balance."""
    t = tx.get("type")
    amt = tx.get("amount", 0) or 0
    status = tx.get("status", "PAID")
    paid_amount = tx.get("paid_amount")
    if tx.get("account_id") == account_id:
        if t == "SALE":
            if status == "PAID":
                return amt
            if status == "PARTIAL":
                return paid_amount or 0
            return 0
        if t == "EXPENSE":
            return -amt
        if t == "PURCHASE":
            if status == "PAID":
                return -amt
            if status == "PARTIAL":
                return -(paid_amount or 0)
            return 0
        if t == "RECEIVABLE_PAYMENT":
            return amt
        if t == "PAYABLE_PAYMENT":
            return -amt
        if t == "OWNER_INJECTION":
            return amt
        if t == "OWNER_WITHDRAWAL":
            return -amt
        if t == "ADJUSTMENT":
            return amt
        if t == "TRANSFER":
            return -amt
    if t == "TRANSFER" and tx.get("to_account_id") == account_id:
        return amt
    return 0


async def get_cash_position(business_id, **_):
    accounts = await db.accounts.find({"business_id": business_id, "status": "active"}, {"_id": 0}).to_list(200)
    total = sum(a.get("current_balance", 0) or 0 for a in accounts)
    return {
        "total_cash": round(total, 2),
        "accounts": [
            {"id": a["id"], "name": a["name"], "type": a["type"], "balance": round(a.get("current_balance", 0) or 0, 2)}
            for a in accounts
        ],
    }


async def get_revenue(business_id, start=None, end=None, **_):
    q = _range_query(business_id, start, end, {"type": "SALE", "status": {"$ne": "CANCELLED"}})
    total = 0.0
    count = 0
    async for tx in db.transactions.find(q, {"_id": 0}):
        total += tx.get("amount", 0) or 0
        count += 1
    return {"revenue": round(total, 2), "transaction_count": count, "period": {"start": start, "end": end}}


async def get_cogs(business_id, start=None, end=None, **_):
    q = _range_query(business_id, start, end, {"type": "SALE", "status": {"$ne": "CANCELLED"}})
    total = 0.0
    estimated = False
    async for tx in db.transactions.find(q, {"_id": 0}):
        total += tx.get("cogs_amount", 0) or 0
        if tx.get("is_estimated_cogs"):
            estimated = True
    return {"cogs": round(total, 2), "is_estimated": estimated}


async def get_gross_profit(business_id, start=None, end=None, **_):
    rev = await get_revenue(business_id, start, end)
    cogs = await get_cogs(business_id, start, end)
    gp = rev["revenue"] - cogs["cogs"]
    margin = (gp / rev["revenue"] * 100) if rev["revenue"] > 0 else 0
    return {
        "revenue": rev["revenue"], "cogs": cogs["cogs"], "is_estimated_cogs": cogs["is_estimated"],
        "gross_profit": round(gp, 2), "gross_margin": round(margin, 2),
    }


async def get_expense_breakdown(business_id, start=None, end=None, **_):
    q = _range_query(business_id, start, end, {"type": "EXPENSE"})
    cats = {}
    async for c in db.categories.find({"business_id": business_id}, {"_id": 0}):
        cats[c["id"]] = c["name"]
    breakdown = {}
    total = 0.0
    async for tx in db.transactions.find(q, {"_id": 0}):
        name = cats.get(tx.get("category_id"), tx.get("category_id") or "Lainnya")
        breakdown[name] = breakdown.get(name, 0) + (tx.get("amount", 0) or 0)
        total += tx.get("amount", 0) or 0
    items = [{"category": k, "amount": round(v, 2), "percent": round((v / total * 100) if total else 0, 1)} for k, v in breakdown.items()]
    items.sort(key=lambda x: -x["amount"])
    return {"total": round(total, 2), "breakdown": items}


async def get_operating_expenses(business_id, start=None, end=None, **_):
    data = await get_expense_breakdown(business_id, start, end)
    return {"total_expenses": data["total"], "breakdown": data["breakdown"]}


async def get_net_profit(business_id, start=None, end=None, **_):
    gp = await get_gross_profit(business_id, start, end)
    opex = await get_operating_expenses(business_id, start, end)
    net = gp["gross_profit"] - opex["total_expenses"]
    margin = (net / gp["revenue"] * 100) if gp["revenue"] > 0 else 0
    return {
        "revenue": gp["revenue"], "cogs": gp["cogs"], "gross_profit": gp["gross_profit"],
        "gross_margin": gp["gross_margin"], "operating_expenses": opex["total_expenses"],
        "net_profit": round(net, 2), "net_margin": round(margin, 2),
    }


async def get_sales_by_product(business_id, start=None, end=None, **_):
    q = _range_query(business_id, start, end, {"type": "SALE", "status": {"$ne": "CANCELLED"}})
    products = {}
    async for p in db.products.find({"business_id": business_id}, {"_id": 0}):
        products[p["id"]] = p["name"]
    result = {}
    async for tx in db.transactions.find(q, {"_id": 0}):
        pname = products.get(tx.get("product_id"), "Lainnya / Tanpa Produk")
        if pname not in result:
            result[pname] = {"product": pname, "revenue": 0.0, "cogs": 0.0, "quantity": 0.0}
        result[pname]["revenue"] += tx.get("amount", 0) or 0
        result[pname]["cogs"] += tx.get("cogs_amount", 0) or 0
        result[pname]["quantity"] += tx.get("quantity", 0) or 0
    items = list(result.values())
    for it in items:
        it["profit"] = round(it["revenue"] - it["cogs"], 2)
        it["revenue"] = round(it["revenue"], 2)
        it["cogs"] = round(it["cogs"], 2)
    items.sort(key=lambda x: -x["revenue"])
    return {"products": items}


async def get_receivables(business_id, status=None, **_):
    q = {"business_id": business_id}
    if status:
        q["status"] = status
    else:
        q["outstanding"] = {"$gt": 0}
    items = await db.receivables.find(q, {"_id": 0}).sort("due_date", 1).to_list(500)
    total = sum(i.get("outstanding", 0) or 0 for i in items)
    return {"total_outstanding": round(total, 2), "items": items}


async def get_overdue_receivables(business_id, **_):
    today = today_str()
    items = await db.receivables.find(
        {"business_id": business_id, "outstanding": {"$gt": 0}, "due_date": {"$lt": today}}, {"_id": 0}
    ).sort("due_date", 1).to_list(500)
    total = sum(i.get("outstanding", 0) or 0 for i in items)
    return {"total_overdue": round(total, 2), "items": items}


async def get_receivables_aging(business_id, **_):
    today = date_cls.fromisoformat(today_str())
    buckets = {"0-7": 0.0, "8-30": 0.0, "31-60": 0.0, "60+": 0.0}
    async for r in db.receivables.find({"business_id": business_id, "outstanding": {"$gt": 0}}, {"_id": 0}):
        due = r.get("due_date")
        if not due:
            buckets["0-7"] += r.get("outstanding", 0) or 0
            continue
        days = (today - date_cls.fromisoformat(due)).days
        if days <= 7:
            buckets["0-7"] += r.get("outstanding", 0) or 0
        elif days <= 30:
            buckets["8-30"] += r.get("outstanding", 0) or 0
        elif days <= 60:
            buckets["31-60"] += r.get("outstanding", 0) or 0
        else:
            buckets["60+"] += r.get("outstanding", 0) or 0
    return {k: round(v, 2) for k, v in buckets.items()}


async def get_payables(business_id, status=None, **_):
    q = {"business_id": business_id}
    if status:
        q["status"] = status
    else:
        q["outstanding"] = {"$gt": 0}
    items = await db.payables.find(q, {"_id": 0}).sort("due_date", 1).to_list(500)
    total = sum(i.get("outstanding", 0) or 0 for i in items)
    return {"total_outstanding": round(total, 2), "items": items}


async def get_due_payables(business_id, days=7, **_):
    from datetime import timedelta
    today = date_cls.fromisoformat(today_str())
    limit = (today + timedelta(days=days)).isoformat()
    items = await db.payables.find(
        {"business_id": business_id, "outstanding": {"$gt": 0}, "due_date": {"$lte": limit}}, {"_id": 0}
    ).sort("due_date", 1).to_list(500)
    total = sum(i.get("outstanding", 0) or 0 for i in items)
    return {"total_due": round(total, 2), "items": items}


async def get_payables_aging(business_id, **_):
    today = date_cls.fromisoformat(today_str())
    buckets = {"0-7": 0.0, "8-30": 0.0, "31-60": 0.0, "60+": 0.0}
    async for p in db.payables.find({"business_id": business_id, "outstanding": {"$gt": 0}}, {"_id": 0}):
        due = p.get("due_date")
        if not due:
            buckets["0-7"] += p.get("outstanding", 0) or 0
            continue
        days = (today - date_cls.fromisoformat(due)).days
        if days <= 7:
            buckets["0-7"] += p.get("outstanding", 0) or 0
        elif days <= 30:
            buckets["8-30"] += p.get("outstanding", 0) or 0
        elif days <= 60:
            buckets["31-60"] += p.get("outstanding", 0) or 0
        else:
            buckets["60+"] += p.get("outstanding", 0) or 0
    return {k: round(v, 2) for k, v in buckets.items()}


async def get_inventory_status(business_id, **_):
    products = await db.products.find({"business_id": business_id, "status": "active"}, {"_id": 0}).to_list(500)
    total_value = sum((p.get("stock_qty", 0) or 0) * (p.get("cost_price", 0) or 0) for p in products)
    return {"total_inventory_value": round(total_value, 2), "products": products}


async def get_low_stock_items(business_id, **_):
    products = await db.products.find({"business_id": business_id, "status": "active"}, {"_id": 0}).to_list(500)
    low = [p for p in products if (p.get("stock_qty", 0) or 0) <= (p.get("low_stock_threshold", 0) or 0)]
    return {"items": low, "count": len(low)}


async def get_cashflow(business_id, start=None, end=None, **_):
    accounts = await db.accounts.find({"business_id": business_id}, {"_id": 0}).to_list(200)
    opening_balance_sum = sum(a.get("opening_balance", 0) or 0 for a in accounts)
    delta_before = 0.0
    if start:
        async for tx in db.transactions.find({"business_id": business_id, "date": {"$lt": start}}, {"_id": 0}):
            delta_before += cash_delta(tx)
    opening_cash = opening_balance_sum + delta_before
    cash_in = 0.0
    cash_out = 0.0
    q = _range_query(business_id, start, end)
    async for tx in db.transactions.find(q, {"_id": 0}):
        d = cash_delta(tx)
        if d > 0:
            cash_in += d
        elif d < 0:
            cash_out += -d
    ending_cash = opening_cash + cash_in - cash_out
    return {
        "opening_cash": round(opening_cash, 2), "cash_in": round(cash_in, 2),
        "cash_out": round(cash_out, 2), "ending_cash": round(ending_cash, 2),
        "period": {"start": start, "end": end},
    }


async def get_cashflow_forecast(business_id, days=7, **_):
    from datetime import timedelta
    today = date_cls.fromisoformat(today_str())
    start_30 = (today - timedelta(days=30)).isoformat()
    cf = await get_cashflow(business_id, start_30, today.isoformat())
    daily_net = (cf["cash_in"] - cf["cash_out"]) / 30.0
    current_cash = (await get_cash_position(business_id))["total_cash"]
    due = await get_due_payables(business_id, days=days)
    projected = current_cash + (daily_net * days) - due["total_due"]
    return {
        "current_cash": round(current_cash, 2), "days": days,
        "avg_daily_net_cashflow": round(daily_net, 2),
        "upcoming_payables": due["total_due"],
        "projected_cash": round(projected, 2),
        "is_estimated": True,
    }


def calculate_margin(revenue, cost, **_):
    revenue = revenue or 0
    cost = cost or 0
    profit = revenue - cost
    margin = (profit / revenue * 100) if revenue > 0 else 0
    return {"revenue": revenue, "cost": cost, "profit": round(profit, 2), "margin_percent": round(margin, 2)}


async def compare_periods(business_id, start1, end1, start2, end2, **_):
    p1 = await get_net_profit(business_id, start1, end1)
    p2 = await get_net_profit(business_id, start2, end2)

    def pct_change(a, b):
        if a == 0:
            return None
        return round((b - a) / abs(a) * 100, 1)

    return {
        "period_1": {"start": start1, "end": end1, **p1},
        "period_2": {"start": start2, "end": end2, **p2},
        "revenue_change_percent": pct_change(p1["revenue"], p2["revenue"]),
        "net_profit_change_percent": pct_change(p1["net_profit"], p2["net_profit"]),
    }


async def find_anomalies(business_id, **_):
    from datetime import timedelta
    today = date_cls.fromisoformat(today_str())
    this_start, this_end = current_month_range()
    this_month = await get_expense_breakdown(business_id, this_start, this_end)
    hist_start = (today.replace(day=1) - timedelta(days=90)).isoformat()
    hist_end = (today.replace(day=1) - timedelta(days=1)).isoformat()
    hist = await get_expense_breakdown(business_id, hist_start, hist_end)
    hist_avg = {}
    for item in hist["breakdown"]:
        hist_avg[item["category"]] = item["amount"] / 3.0
    anomalies = []
    for item in this_month["breakdown"]:
        avg = hist_avg.get(item["category"])
        if avg and avg > 0 and item["amount"] > avg * 1.3:
            pct = round((item["amount"] - avg) / avg * 100, 1)
            anomalies.append({"category": item["category"], "current": item["amount"], "average": round(avg, 2), "increase_percent": pct})
    return {"anomalies": anomalies}


async def simulate_cost_reduction(business_id, percent, start=None, end=None, **_):
    if not start or not end:
        start, end = current_month_range()
    current = await get_net_profit(business_id, start, end)
    new_opex = current["operating_expenses"] * (1 - percent / 100.0)
    new_net = current["gross_profit"] - new_opex
    return {
        "reduction_percent": percent, "current_operating_expenses": current["operating_expenses"],
        "current_net_profit": current["net_profit"], "simulated_operating_expenses": round(new_opex, 2),
        "simulated_net_profit": round(new_net, 2), "is_simulation": True,
    }


async def simulate_price_change(business_id, percent, product_id=None, start=None, end=None, **_):
    if not start or not end:
        start, end = current_month_range()
    current = await get_net_profit(business_id, start, end)
    new_revenue = current["revenue"] * (1 + percent / 100.0)
    new_gross_profit = new_revenue - current["cogs"]
    new_net_profit = new_gross_profit - current["operating_expenses"]
    return {
        "price_change_percent": percent, "current_revenue": current["revenue"],
        "simulated_revenue": round(new_revenue, 2), "simulated_gross_profit": round(new_gross_profit, 2),
        "simulated_net_profit": round(new_net_profit, 2),
        "assumption": "Asumsi jumlah unit terjual tetap sama (belum memperhitungkan perubahan permintaan).",
        "is_simulation": True,
    }
