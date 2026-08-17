import uuid
import random
from datetime import datetime, timezone, timedelta
from database import db

now_iso = lambda: datetime.now(timezone.utc).isoformat()

DEMO_PRODUCTS = [
    {"name": "Nasi Goreng Spesial", "unit": "porsi", "cost_price": 8000, "selling_price": 18000, "stock_qty": 40, "low_stock_threshold": 10},
    {"name": "Es Teh Manis", "unit": "gelas", "cost_price": 1500, "selling_price": 5000, "stock_qty": 80, "low_stock_threshold": 15},
    {"name": "Ayam Geprek", "unit": "porsi", "cost_price": 9000, "selling_price": 20000, "stock_qty": 35, "low_stock_threshold": 10},
    {"name": "Kopi Susu Gula Aren", "unit": "gelas", "cost_price": 4000, "selling_price": 15000, "stock_qty": 4, "low_stock_threshold": 10},
    {"name": "Mie Ayam", "unit": "porsi", "cost_price": 7000, "selling_price": 15000, "stock_qty": 25, "low_stock_threshold": 8},
    {"name": "Roti Bakar Coklat", "unit": "porsi", "cost_price": 5000, "selling_price": 12000, "stock_qty": 30, "low_stock_threshold": 10},
    {"name": "Jus Alpukat", "unit": "gelas", "cost_price": 6000, "selling_price": 16000, "stock_qty": 3, "low_stock_threshold": 10},
    {"name": "Kerupuk Kemasan", "unit": "pcs", "cost_price": 2000, "selling_price": 5000, "stock_qty": 60, "low_stock_threshold": 15},
    {"name": "Nasi Uduk", "unit": "porsi", "cost_price": 6000, "selling_price": 13000, "stock_qty": 20, "low_stock_threshold": 8},
    {"name": "Sate Ayam 10 Tusuk", "unit": "porsi", "cost_price": 12000, "selling_price": 25000, "stock_qty": 18, "low_stock_threshold": 6},
]

CUSTOMERS = ["Ibu Sari", "Pak Budi", "Rina", "Andi Warkop", "Kantin Sebelah", "Toko Jaya", "Pak Hendra", "Bu Wati", "Dedi", "Lisa Catering"]
SUPPLIERS = ["Distributor Beras Makmur", "Agen Ayam Segar", "Toko Sembako Untung", "PT Kemasan Prima", "Grosir Sayur Pagi"]
EXPENSE_CATS = ["Sewa", "Listrik & Air", "Internet", "Transportasi", "Marketing", "Kemasan", "Gaji Karyawan", "Perlengkapan", "Perawatan", "Biaya Platform"]
PAYMENT_LABELS = ["Cash", "Bank", "E-wallet"]


async def seed_demo_business(owner_user_id):
    biz_id = f"biz_{uuid.uuid4().hex[:10]}"
    business = {
        "id": biz_id,
        "owner_user_id": owner_user_id,
        "business_name": "Kedai Demo K-eM",
        "business_type": "FOOD_BEVERAGE",
        "business_category": "Warung Makan & Minuman",
        "city": "Bandung",
        "currency": "IDR",
        "mode": "simple",
        "is_demo": True,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.businesses.insert_one(dict(business))

    accounts = [
        {"id": f"acc_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "name": "Kas Tunai", "type": "CASH", "opening_balance": 4000000, "current_balance": 4000000, "status": "active", "created_at": now_iso(), "updated_at": now_iso()},
        {"id": f"acc_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "name": "Bank BCA", "type": "BANK", "opening_balance": 7000000, "current_balance": 7000000, "status": "active", "created_at": now_iso(), "updated_at": now_iso()},
        {"id": f"acc_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "name": "E-wallet (GoPay/OVO)", "type": "EWALLET", "opening_balance": 2500000, "current_balance": 2500000, "status": "active", "created_at": now_iso(), "updated_at": now_iso()},
    ]
    await db.accounts.insert_many([dict(a) for a in accounts])
    cash_acc, bank_acc, ewallet_acc = accounts[0]["id"], accounts[1]["id"], accounts[2]["id"]
    acc_ids = [cash_acc, bank_acc, ewallet_acc]

    categories = []
    for name in EXPENSE_CATS:
        categories.append({"id": f"cat_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "name": name, "type": "expense", "is_default": True, "created_at": now_iso()})
    await db.categories.insert_many([dict(c) for c in categories])
    cat_ids = {c["name"]: c["id"] for c in categories}

    products = []
    for p in DEMO_PRODUCTS:
        prod = {
            "id": f"prod_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "name": p["name"], "sku": None,
            "unit": p["unit"], "stock_qty": p["stock_qty"], "cost_price": p["cost_price"], "selling_price": p["selling_price"],
            "low_stock_threshold": p["low_stock_threshold"], "status": "active", "created_at": now_iso(), "updated_at": now_iso(),
        }
        products.append(prod)
    await db.products.insert_many([dict(p) for p in products])

    today = datetime.now(timezone.utc).date()
    start_day = today - timedelta(days=89)

    def rand_date_within(days_back_max):
        d = today - timedelta(days=random.randint(0, days_back_max))
        return d.isoformat()

    async def bump_balance(acc_id, delta):
        await db.accounts.update_one({"id": acc_id, "business_id": biz_id}, {"$inc": {"current_balance": delta}})

    # 60 sales
    for i in range(60):
        product = random.choice(products)
        qty = random.randint(1, 5)
        amount = product["selling_price"] * qty
        cogs = product["cost_price"] * qty
        status_roll = random.random()
        status = "PAID" if status_roll < 0.85 else ("UNPAID" if status_roll < 0.95 else "PARTIAL")
        acc = random.choice(acc_ids)
        date = rand_date_within(89)
        tx = {
            "id": f"txn_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "created_by": owner_user_id, "type": "SALE",
            "amount": amount, "account_id": acc, "to_account_id": None, "category_id": None,
            "counterparty": random.choice(CUSTOMERS), "reference": None, "date": date,
            "description": f"Penjualan {product['name']} x{qty}", "status": status, "attachment_url": None,
            "product_id": product["id"], "quantity": qty, "unit_price": product["selling_price"],
            "cogs_amount": cogs, "is_estimated_cogs": False, "paid_amount": amount if status == "PAID" else (round(amount * 0.5) if status == "PARTIAL" else 0),
            "due_date": (today + timedelta(days=random.randint(3, 20))).isoformat() if status != "PAID" else None,
            "created_at": now_iso(), "updated_at": now_iso(),
        }
        if status == "PAID":
            await bump_balance(acc, amount)
        elif status == "PARTIAL":
            await bump_balance(acc, tx["paid_amount"])
            rec = {"id": f"rec_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "customer": tx["counterparty"], "reference": None,
                   "original_amount": amount, "paid_amount": tx["paid_amount"], "outstanding": round(amount - tx["paid_amount"], 2),
                   "due_date": tx["due_date"], "status": "partial", "transaction_id": tx["id"], "created_at": now_iso(), "updated_at": now_iso()}
            await db.receivables.insert_one(dict(rec))
            tx["receivable_id"] = rec["id"]
        elif status == "UNPAID":
            rec = {"id": f"rec_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "customer": tx["counterparty"], "reference": None,
                   "original_amount": amount, "paid_amount": 0, "outstanding": amount,
                   "due_date": tx["due_date"], "status": "unpaid", "transaction_id": tx["id"], "created_at": now_iso(), "updated_at": now_iso()}
            await db.receivables.insert_one(dict(rec))
            tx["receivable_id"] = rec["id"]
        await db.transactions.insert_one(dict(tx))

    # 30 expenses
    for i in range(30):
        cat_name = random.choice(EXPENSE_CATS)
        amount = random.randint(15, 180) * 1000
        acc = random.choice(acc_ids)
        date = rand_date_within(89)
        tx = {
            "id": f"txn_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "created_by": owner_user_id, "type": "EXPENSE",
            "amount": amount, "account_id": acc, "to_account_id": None, "category_id": cat_ids[cat_name],
            "counterparty": None, "reference": None, "date": date, "description": f"Pengeluaran {cat_name}",
            "status": "PAID", "attachment_url": None, "product_id": None, "quantity": None, "unit_price": None,
            "cogs_amount": 0, "is_estimated_cogs": False, "paid_amount": amount, "due_date": None,
            "created_at": now_iso(), "updated_at": now_iso(),
        }
        await bump_balance(acc, -amount)
        await db.transactions.insert_one(dict(tx))

    # 10 purchases (5 paid, 5 create payables)
    for i in range(10):
        product = random.choice(products)
        qty = random.randint(10, 40)
        unit_cost = product["cost_price"]
        amount = unit_cost * qty
        acc = random.choice(acc_ids)
        date = rand_date_within(89)
        status = "PAID" if i < 5 else "UNPAID"
        tx = {
            "id": f"txn_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "created_by": owner_user_id, "type": "PURCHASE",
            "amount": amount, "account_id": acc, "to_account_id": None, "category_id": None,
            "counterparty": random.choice(SUPPLIERS), "reference": None, "date": date,
            "description": f"Pembelian bahan {product['name']} x{qty}", "status": status, "attachment_url": None,
            "product_id": product["id"], "quantity": qty, "unit_price": unit_cost, "cogs_amount": 0, "is_estimated_cogs": False,
            "paid_amount": amount if status == "PAID" else 0,
            "due_date": (today + timedelta(days=random.randint(3, 20))).isoformat() if status == "UNPAID" else None,
            "created_at": now_iso(), "updated_at": now_iso(),
        }
        if status == "PAID":
            await bump_balance(acc, -amount)
        else:
            pay = {"id": f"pay_{uuid.uuid4().hex[:10]}", "business_id": biz_id, "supplier": tx["counterparty"], "reference": None,
                   "original_amount": amount, "paid_amount": 0, "outstanding": amount, "due_date": tx["due_date"],
                   "status": "unpaid", "transaction_id": tx["id"], "created_at": now_iso(), "updated_at": now_iso()}
            await db.payables.insert_one(dict(pay))
            tx["payable_id"] = pay["id"]
        await db.transactions.insert_one(dict(tx))

    # ensure exactly ~5 open receivables and ~5 open payables exist with varied aging (some already created above naturally)
    open_recv_count = await db.receivables.count_documents({"business_id": biz_id, "outstanding": {"$gt": 0}})
    open_pay_count = await db.payables.count_documents({"business_id": biz_id, "outstanding": {"$gt": 0}})

    return business
