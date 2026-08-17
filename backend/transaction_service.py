import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from database import db
import finance_engine as fe

now_iso = lambda: datetime.now(timezone.utc).isoformat()


async def _get_account(business_id, account_id):
    if not account_id:
        return None
    acc = await db.accounts.find_one({"id": account_id, "business_id": business_id}, {"_id": 0})
    if not acc:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan")
    return acc


async def _adjust_account_balance(business_id, account_id, delta):
    if not account_id or delta == 0:
        return
    await db.accounts.update_one(
        {"id": account_id, "business_id": business_id},
        {"$inc": {"current_balance": delta}, "$set": {"updated_at": now_iso()}},
    )


def _recompute_status(outstanding):
    if outstanding <= 0.009:
        return "paid"
    return "partial"


async def _create_receivable(business_id, tx):
    outstanding = tx["amount"] - (tx.get("paid_amount") or 0)
    rec = {
        "id": f"rec_{uuid.uuid4().hex[:10]}",
        "business_id": business_id,
        "customer": tx.get("counterparty") or "Pelanggan",
        "reference": tx.get("reference"),
        "original_amount": tx["amount"],
        "paid_amount": tx.get("paid_amount") or 0,
        "outstanding": round(outstanding, 2),
        "due_date": tx.get("due_date"),
        "status": "unpaid" if not tx.get("paid_amount") else "partial",
        "transaction_id": tx["id"],
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.receivables.insert_one(dict(rec))
    return rec


async def _create_payable(business_id, tx):
    outstanding = tx["amount"] - (tx.get("paid_amount") or 0)
    pay = {
        "id": f"pay_{uuid.uuid4().hex[:10]}",
        "business_id": business_id,
        "supplier": tx.get("counterparty") or "Pemasok",
        "reference": tx.get("reference"),
        "original_amount": tx["amount"],
        "paid_amount": tx.get("paid_amount") or 0,
        "outstanding": round(outstanding, 2),
        "due_date": tx.get("due_date"),
        "status": "unpaid" if not tx.get("paid_amount") else "partial",
        "transaction_id": tx["id"],
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.payables.insert_one(dict(pay))
    return pay


async def create_transaction(business_id, user_id, payload: dict):
    ttype = payload["type"]
    amount = float(payload["amount"])
    status = payload.get("status") or "PAID"
    tx_id = f"txn_{uuid.uuid4().hex[:10]}"
    tx = {
        "id": tx_id,
        "business_id": business_id,
        "created_by": user_id,
        "type": ttype,
        "amount": amount,
        "account_id": payload.get("account_id"),
        "to_account_id": payload.get("to_account_id"),
        "category_id": payload.get("category_id"),
        "counterparty": payload.get("counterparty"),
        "reference": payload.get("reference"),
        "date": payload["date"],
        "description": payload.get("description"),
        "status": status,
        "attachment_url": payload.get("attachment_url"),
        "product_id": payload.get("product_id"),
        "quantity": payload.get("quantity"),
        "unit_price": payload.get("unit_price"),
        "paid_amount": payload.get("paid_amount"),
        "due_date": payload.get("due_date"),
        "cogs_amount": 0,
        "is_estimated_cogs": False,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }

    if ttype == "TRANSFER":
        if not payload.get("account_id") or not payload.get("to_account_id"):
            raise HTTPException(400, "Rekening asal dan tujuan wajib diisi")
        await _get_account(business_id, payload["account_id"])
        await _get_account(business_id, payload["to_account_id"])
        await _adjust_account_balance(business_id, payload["account_id"], -amount)
        await _adjust_account_balance(business_id, payload["to_account_id"], amount)

    elif ttype == "SALE":
        product = None
        if payload.get("product_id"):
            product = await db.products.find_one({"id": payload["product_id"], "business_id": business_id}, {"_id": 0})
            if not product:
                raise HTTPException(404, "Produk tidak ditemukan")
            qty = payload.get("quantity") or 1
            tx["cogs_amount"] = round((product.get("cost_price") or 0) * qty, 2)
            await db.products.update_one(
                {"id": product["id"], "business_id": business_id},
                {"$inc": {"stock_qty": -qty}, "$set": {"updated_at": now_iso()}},
            )
        elif payload.get("estimated_cogs_percent") is not None:
            tx["cogs_amount"] = round(amount * (payload["estimated_cogs_percent"] / 100.0), 2)
            tx["is_estimated_cogs"] = True

        if status == "PAID":
            await _get_account(business_id, payload.get("account_id"))
            await _adjust_account_balance(business_id, payload.get("account_id"), amount)
            tx["paid_amount"] = amount
        elif status == "PARTIAL":
            paid = payload.get("paid_amount") or 0
            await _get_account(business_id, payload.get("account_id"))
            await _adjust_account_balance(business_id, payload.get("account_id"), paid)
            rec = await _create_receivable(business_id, tx)
            tx["receivable_id"] = rec["id"]
        elif status == "UNPAID":
            tx["paid_amount"] = 0
            rec = await _create_receivable(business_id, tx)
            tx["receivable_id"] = rec["id"]

    elif ttype == "EXPENSE":
        if not payload.get("category_id") and not payload.get("category_name"):
            raise HTTPException(400, "Kategori pengeluaran wajib diisi")
        await _get_account(business_id, payload.get("account_id"))
        await _adjust_account_balance(business_id, payload.get("account_id"), -amount)

    elif ttype == "PURCHASE":
        if payload.get("product_id") and payload.get("quantity"):
            product = await db.products.find_one({"id": payload["product_id"], "business_id": business_id}, {"_id": 0})
            if not product:
                raise HTTPException(404, "Produk tidak ditemukan")
            await db.products.update_one(
                {"id": product["id"], "business_id": business_id},
                {"$inc": {"stock_qty": payload["quantity"]}, "$set": {"updated_at": now_iso()}},
            )
            if payload.get("unit_price"):
                await db.products.update_one(
                    {"id": product["id"], "business_id": business_id},
                    {"$set": {"cost_price": payload["unit_price"], "updated_at": now_iso()}},
                )
        if status == "PAID":
            await _get_account(business_id, payload.get("account_id"))
            await _adjust_account_balance(business_id, payload.get("account_id"), -amount)
            tx["paid_amount"] = amount
        elif status == "PARTIAL":
            paid = payload.get("paid_amount") or 0
            await _get_account(business_id, payload.get("account_id"))
            await _adjust_account_balance(business_id, payload.get("account_id"), -paid)
            pay = await _create_payable(business_id, tx)
            tx["payable_id"] = pay["id"]
        elif status == "UNPAID":
            tx["paid_amount"] = 0
            pay = await _create_payable(business_id, tx)
            tx["payable_id"] = pay["id"]

    elif ttype == "RECEIVABLE_PAYMENT":
        rec_id = payload.get("receivable_id")
        if not rec_id:
            raise HTTPException(400, "receivable_id wajib diisi")
        rec = await db.receivables.find_one({"id": rec_id, "business_id": business_id}, {"_id": 0})
        if not rec:
            raise HTTPException(404, "Piutang tidak ditemukan")
        if amount > rec["outstanding"] + 0.01:
            raise HTTPException(400, "Jumlah pembayaran lebih besar dari sisa piutang")
        await _get_account(business_id, payload.get("account_id"))
        await _adjust_account_balance(business_id, payload.get("account_id"), amount)
        new_outstanding = round(rec["outstanding"] - amount, 2)
        new_paid = round(rec["paid_amount"] + amount, 2)
        await db.receivables.update_one(
            {"id": rec_id, "business_id": business_id},
            {"$set": {"outstanding": new_outstanding, "paid_amount": new_paid, "status": _recompute_status(new_outstanding), "updated_at": now_iso()}},
        )
        tx["counterparty"] = tx.get("counterparty") or rec["customer"]

    elif ttype == "PAYABLE_PAYMENT":
        pay_id = payload.get("payable_id")
        if not pay_id:
            raise HTTPException(400, "payable_id wajib diisi")
        pay = await db.payables.find_one({"id": pay_id, "business_id": business_id}, {"_id": 0})
        if not pay:
            raise HTTPException(404, "Utang tidak ditemukan")
        if amount > pay["outstanding"] + 0.01:
            raise HTTPException(400, "Jumlah pembayaran lebih besar dari sisa utang")
        await _get_account(business_id, payload.get("account_id"))
        await _adjust_account_balance(business_id, payload.get("account_id"), -amount)
        new_outstanding = round(pay["outstanding"] - amount, 2)
        new_paid = round(pay["paid_amount"] + amount, 2)
        await db.payables.update_one(
            {"id": pay_id, "business_id": business_id},
            {"$set": {"outstanding": new_outstanding, "paid_amount": new_paid, "status": _recompute_status(new_outstanding), "updated_at": now_iso()}},
        )
        tx["counterparty"] = tx.get("counterparty") or pay["supplier"]

    elif ttype == "OWNER_INJECTION":
        await _get_account(business_id, payload.get("account_id"))
        await _adjust_account_balance(business_id, payload.get("account_id"), amount)

    elif ttype == "OWNER_WITHDRAWAL":
        await _get_account(business_id, payload.get("account_id"))
        await _adjust_account_balance(business_id, payload.get("account_id"), -amount)

    elif ttype == "ADJUSTMENT":
        await _get_account(business_id, payload.get("account_id"))
        await _adjust_account_balance(business_id, payload.get("account_id"), amount)

    await db.transactions.insert_one(dict(tx))
    return tx


async def reverse_transaction(business_id, tx):
    ttype = tx["type"]
    amount = tx.get("amount", 0) or 0
    status = tx.get("status", "PAID")

    if ttype == "TRANSFER":
        await _adjust_account_balance(business_id, tx.get("account_id"), amount)
        await _adjust_account_balance(business_id, tx.get("to_account_id"), -amount)

    elif ttype == "SALE":
        if tx.get("product_id") and tx.get("quantity"):
            await db.products.update_one(
                {"id": tx["product_id"], "business_id": business_id},
                {"$inc": {"stock_qty": tx["quantity"]}},
            )
        if status == "PAID":
            await _adjust_account_balance(business_id, tx.get("account_id"), -amount)
        elif status == "PARTIAL":
            rec = await db.receivables.find_one({"id": tx.get("receivable_id"), "business_id": business_id}, {"_id": 0})
            if rec and rec.get("paid_amount", 0) > (tx.get("paid_amount") or 0) + 0.01:
                raise HTTPException(400, "Tidak bisa menghapus: sudah ada pembayaran piutang tambahan")
            await _adjust_account_balance(business_id, tx.get("account_id"), -(tx.get("paid_amount") or 0))
            await db.receivables.delete_one({"id": tx.get("receivable_id"), "business_id": business_id})
        elif status == "UNPAID":
            rec = await db.receivables.find_one({"id": tx.get("receivable_id"), "business_id": business_id}, {"_id": 0})
            if rec and rec.get("paid_amount", 0) > 0.01:
                raise HTTPException(400, "Tidak bisa menghapus: piutang sudah dibayar sebagian/lunas")
            await db.receivables.delete_one({"id": tx.get("receivable_id"), "business_id": business_id})

    elif ttype == "EXPENSE":
        await _adjust_account_balance(business_id, tx.get("account_id"), amount)

    elif ttype == "PURCHASE":
        if tx.get("product_id") and tx.get("quantity"):
            await db.products.update_one(
                {"id": tx["product_id"], "business_id": business_id},
                {"$inc": {"stock_qty": -tx["quantity"]}},
            )
        if status == "PAID":
            await _adjust_account_balance(business_id, tx.get("account_id"), amount)
        elif status == "PARTIAL":
            pay = await db.payables.find_one({"id": tx.get("payable_id"), "business_id": business_id}, {"_id": 0})
            if pay and pay.get("paid_amount", 0) > (tx.get("paid_amount") or 0) + 0.01:
                raise HTTPException(400, "Tidak bisa menghapus: sudah ada pembayaran utang tambahan")
            await _adjust_account_balance(business_id, tx.get("account_id"), (tx.get("paid_amount") or 0))
            await db.payables.delete_one({"id": tx.get("payable_id"), "business_id": business_id})
        elif status == "UNPAID":
            pay = await db.payables.find_one({"id": tx.get("payable_id"), "business_id": business_id}, {"_id": 0})
            if pay and pay.get("paid_amount", 0) > 0.01:
                raise HTTPException(400, "Tidak bisa menghapus: utang sudah dibayar sebagian/lunas")
            await db.payables.delete_one({"id": tx.get("payable_id"), "business_id": business_id})

    elif ttype == "RECEIVABLE_PAYMENT":
        rec = await db.receivables.find_one({"id": tx.get("receivable_id"), "business_id": business_id}, {"_id": 0})
        if rec:
            await db.receivables.update_one(
                {"id": rec["id"], "business_id": business_id},
                {"$set": {"outstanding": round(rec["outstanding"] + amount, 2), "paid_amount": round(rec["paid_amount"] - amount, 2), "status": _recompute_status(rec["outstanding"] + amount), "updated_at": now_iso()}},
            )
        await _adjust_account_balance(business_id, tx.get("account_id"), -amount)

    elif ttype == "PAYABLE_PAYMENT":
        pay = await db.payables.find_one({"id": tx.get("payable_id"), "business_id": business_id}, {"_id": 0})
        if pay:
            await db.payables.update_one(
                {"id": pay["id"], "business_id": business_id},
                {"$set": {"outstanding": round(pay["outstanding"] + amount, 2), "paid_amount": round(pay["paid_amount"] - amount, 2), "status": _recompute_status(pay["outstanding"] + amount), "updated_at": now_iso()}},
            )
        await _adjust_account_balance(business_id, tx.get("account_id"), amount)

    elif ttype == "OWNER_INJECTION":
        await _adjust_account_balance(business_id, tx.get("account_id"), -amount)

    elif ttype == "OWNER_WITHDRAWAL":
        await _adjust_account_balance(business_id, tx.get("account_id"), amount)

    elif ttype == "ADJUSTMENT":
        await _adjust_account_balance(business_id, tx.get("account_id"), -amount)


async def delete_transaction(business_id, tx_id):
    tx = await db.transactions.find_one({"id": tx_id, "business_id": business_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    await reverse_transaction(business_id, tx)
    await db.transactions.delete_one({"id": tx_id, "business_id": business_id})
    return {"message": "Transaksi dihapus"}
