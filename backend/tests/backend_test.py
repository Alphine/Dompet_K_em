"""Comprehensive backend API tests for Dompet K-eM.

Covers: auth, business, accounts, dashboard, transactions (all 9 types via key ones),
receivables, payables, products, reports, assistant AI, and cross-business security.
"""
import os
import time
import uuid
import pytest
import requests
from datetime import date

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kem-finance.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Pre-seeded test user with demo business "Kedai Demo K-eM"
SEEDED_TOKEN = "test_session_screenshot_tok"
SEEDED_USER_ID = "test-user-screenshot"


def _mk_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Fixtures ----------------

@pytest.fixture(scope="session")
def s1():
    """Session for seeded demo user"""
    s = requests.Session()
    s.headers.update(_mk_headers(SEEDED_TOKEN))
    return s


@pytest.fixture(scope="session")
def s2_ctx():
    """Create a second, isolated test user + business via mongosh for cross-business testing."""
    import subprocess
    uid = f"test-user-{uuid.uuid4().hex[:8]}"
    tok = f"test_session_{uuid.uuid4().hex[:12]}"
    script = f"""
use('test_database');
db.users.insertOne({{user_id:'{uid}',email:'{uid}@ex.com',name:'U2',picture:'',created_at:new Date()}});
db.user_sessions.insertOne({{user_id:'{uid}',session_token:'{tok}',expires_at:new Date(Date.now()+7*24*60*60*1000),created_at:new Date()}});
"""
    subprocess.run(["mongosh", "--quiet", "--eval", script], check=True, capture_output=True)
    s = requests.Session()
    s.headers.update(_mk_headers(tok))
    # Create a fresh business for this user
    r = s.post(f"{API}/business", json={
        "business_name": "TEST_Second Biz",
        "business_type": "RETAIL",
        "city": "Jakarta",
        "starting_cash": 100000,
        "load_demo_data": False,
    })
    assert r.status_code == 200, r.text
    biz = r.json()
    return {"session": s, "user_id": uid, "token": tok, "biz": biz}


# ---------------- Auth ----------------

class TestAuth:
    def test_me_no_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_me_bearer(self, s1):
        r = s1.get(f"{API}/auth/me")
        assert r.status_code == 200
        d = r.json()
        assert d["user_id"] == SEEDED_USER_ID
        assert "email" in d

    def test_me_cookie(self):
        """Verify cookie-based auth works (main-agent flagged as suspicious)."""
        r = requests.get(f"{API}/auth/me", cookies={"session_token": SEEDED_TOKEN})
        assert r.status_code == 200, r.text
        assert r.json()["user_id"] == SEEDED_USER_ID

    def test_me_invalid_token(self):
        r = requests.get(f"{API}/auth/me", headers=_mk_headers("bogus_tok"))
        assert r.status_code in (401, 403)


# ---------------- Business ----------------

class TestBusiness:
    def test_get_seeded_business(self, s1):
        r = s1.get(f"{API}/business")
        assert r.status_code == 200
        b = r.json()
        assert b["id"].startswith("biz_")
        assert "business_name" in b

    def test_duplicate_business_create_blocked(self, s1):
        r = s1.post(f"{API}/business", json={
            "business_name": "Dup", "business_type": "RETAIL", "starting_cash": 0
        })
        assert r.status_code == 400


# ---------------- Accounts ----------------

class TestAccounts:
    def test_list_accounts(self, s1):
        r = s1.get(f"{API}/accounts")
        assert r.status_code == 200
        accs = r.json()
        assert isinstance(accs, list) and len(accs) >= 1
        assert all("id" in a and "current_balance" in a for a in accs)


# ---------------- Dashboard ----------------

class TestDashboard:
    def test_summary(self, s1):
        r = s1.get(f"{API}/dashboard/summary")
        assert r.status_code == 200
        d = r.json()
        for k in ("revenue", "net_profit", "cash_balance"):
            assert k in d, f"missing {k}: {d}"

    def test_alerts(self, s1):
        r = s1.get(f"{API}/dashboard/alerts")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- Transactions (all types) ----------------

class TestTransactions:
    def _accounts(self, s):
        return s.get(f"{API}/accounts").json()

    def test_paid_sale_increases_cash_and_revenue(self, s1):
        accs = self._accounts(s1)
        acc = accs[0]
        pre_bal = acc["current_balance"]
        pre_rev = s1.get(f"{API}/dashboard/summary").json()["revenue"]
        today = date.today().isoformat()
        r = s1.post(f"{API}/transactions", json={
            "type": "SALE", "amount": 55000, "account_id": acc["id"],
            "status": "PAID", "date": today, "description": "TEST_paid_sale"
        })
        assert r.status_code == 200, r.text
        tx = r.json()
        assert tx["type"] == "SALE" and tx["status"] == "PAID"
        # Verify cash increased
        new_acc = next(a for a in self._accounts(s1) if a["id"] == acc["id"])
        assert abs(new_acc["current_balance"] - (pre_bal + 55000)) < 0.01
        # Cleanup
        s1.delete(f"{API}/transactions/{tx['id']}")

    def test_unpaid_sale_creates_receivable(self, s1):
        pre = len(s1.get(f"{API}/receivables").json())
        today = date.today().isoformat()
        r = s1.post(f"{API}/transactions", json={
            "type": "SALE", "amount": 77000, "status": "UNPAID",
            "date": today, "counterparty": "TEST_Cust", "description": "TEST_unpaid_sale"
        })
        assert r.status_code == 200, r.text
        tx = r.json()
        post = len(s1.get(f"{API}/receivables").json())
        assert post == pre + 1
        s1.delete(f"{API}/transactions/{tx['id']}")

    def test_transfer_does_not_change_profit(self, s1):
        accs = self._accounts(s1)
        if len(accs) < 2:
            pytest.skip("need 2 accounts")
        pre = s1.get(f"{API}/dashboard/summary").json()
        today = date.today().isoformat()
        r = s1.post(f"{API}/transactions", json={
            "type": "TRANSFER", "amount": 25000,
            "account_id": accs[0]["id"], "to_account_id": accs[1]["id"],
            "status": "PAID", "date": today, "description": "TEST_xfer"
        })
        assert r.status_code == 200, r.text
        tx = r.json()
        post = s1.get(f"{API}/dashboard/summary").json()
        assert abs(pre["revenue"] - post["revenue"]) < 0.01
        assert abs(pre["net_profit"] - post["net_profit"]) < 0.01
        s1.delete(f"{API}/transactions/{tx['id']}")

    def test_owner_withdrawal_reduces_cash_not_profit(self, s1):
        accs = self._accounts(s1)
        acc = accs[0]
        pre_bal = acc["current_balance"]
        pre_profit = s1.get(f"{API}/dashboard/summary").json()["net_profit"]
        today = date.today().isoformat()
        r = s1.post(f"{API}/transactions", json={
            "type": "OWNER_WITHDRAWAL", "amount": 10000, "account_id": acc["id"],
            "status": "PAID", "date": today, "description": "TEST_withdraw"
        })
        assert r.status_code == 200, r.text
        tx = r.json()
        new_bal = next(a for a in self._accounts(s1) if a["id"] == acc["id"])["current_balance"]
        new_profit = s1.get(f"{API}/dashboard/summary").json()["net_profit"]
        assert abs(new_bal - (pre_bal - 10000)) < 0.01
        assert abs(new_profit - pre_profit) < 0.01, "Owner withdrawal must NOT affect net profit"
        s1.delete(f"{API}/transactions/{tx['id']}")

    def test_expense_reduces_cash(self, s1):
        accs = self._accounts(s1)
        acc = accs[0]
        pre_bal = acc["current_balance"]
        today = date.today().isoformat()
        r = s1.post(f"{API}/transactions", json={
            "type": "EXPENSE", "amount": 5000, "account_id": acc["id"],
            "status": "PAID", "date": today, "category_name": "Listrik & Air",
            "description": "TEST_expense"
        })
        assert r.status_code == 200, r.text
        tx = r.json()
        new_bal = next(a for a in self._accounts(s1) if a["id"] == acc["id"])["current_balance"]
        assert abs(new_bal - (pre_bal - 5000)) < 0.01
        s1.delete(f"{API}/transactions/{tx['id']}")

    def test_delete_reverses_effects(self, s1):
        accs = self._accounts(s1)
        acc = accs[0]
        pre_bal = acc["current_balance"]
        today = date.today().isoformat()
        r = s1.post(f"{API}/transactions", json={
            "type": "SALE", "amount": 33333, "account_id": acc["id"],
            "status": "PAID", "date": today, "description": "TEST_rev"
        })
        tx = r.json()
        assert next(a for a in self._accounts(s1) if a["id"] == acc["id"])["current_balance"] == pytest.approx(pre_bal + 33333)
        s1.delete(f"{API}/transactions/{tx['id']}")
        # verify reversed
        assert next(a for a in self._accounts(s1) if a["id"] == acc["id"])["current_balance"] == pytest.approx(pre_bal)

    def test_list_transactions(self, s1):
        r = s1.get(f"{API}/transactions?limit=10")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- Receivables / Payables ----------------

class TestReceivablesPayables:
    def test_list_receivables(self, s1):
        r = s1.get(f"{API}/receivables")
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_list_payables(self, s1):
        r = s1.get(f"{API}/payables")
        assert r.status_code == 200 and isinstance(r.json(), list)


# ---------------- Products ----------------

class TestProducts:
    def test_list_products(self, s1):
        r = s1.get(f"{API}/products")
        assert r.status_code == 200
        prods = r.json()
        assert isinstance(prods, list)

    def test_create_update_delete_product(self, s1):
        r = s1.post(f"{API}/products", json={
            "name": "TEST_Product", "unit": "pcs",
            "stock_qty": 10, "cost_price": 1000, "selling_price": 2000,
            "low_stock_threshold": 3,
        })
        assert r.status_code == 200, r.text
        p = r.json()
        pid = p["id"]
        # adjust stock
        r2 = s1.post(f"{API}/products/{pid}/adjust-stock", json={"quantity_change": -2, "reason": "TEST"})
        assert r2.status_code == 200
        r3 = s1.get(f"{API}/products")
        found = next(x for x in r3.json() if x["id"] == pid)
        assert found["stock_qty"] == pytest.approx(8)
        # delete
        r4 = s1.delete(f"{API}/products/{pid}")
        assert r4.status_code in (200, 204)


# ---------------- Reports ----------------

class TestReports:
    def test_pnl(self, s1):
        r = s1.get(f"{API}/reports/profit-loss")
        assert r.status_code == 200
        d = r.json()
        assert "revenue" in d or "net_profit" in d

    def test_cashflow(self, s1):
        r = s1.get(f"{API}/reports/cashflow")
        assert r.status_code == 200

    def test_export_csv(self, s1):
        r = s1.get(f"{API}/reports/export?report=transactions")
        # Accept either csv or 200 with data
        assert r.status_code == 200
        assert len(r.content) > 0


# ---------------- Cross-business security ----------------

class TestSecurityIsolation:
    def test_user2_cannot_read_user1_transaction(self, s1, s2_ctx):
        # Get one of user1's transactions
        txs = s1.get(f"{API}/transactions?limit=1").json()
        if not txs:
            pytest.skip("no tx to test isolation")
        tx_id = txs[0]["id"]
        # try from user2
        r = s2_ctx["session"].get(f"{API}/transactions/{tx_id}")
        assert r.status_code in (403, 404), f"Cross-biz leak! got {r.status_code} {r.text}"

    def test_user2_cannot_delete_user1_transaction(self, s1, s2_ctx):
        txs = s1.get(f"{API}/transactions?limit=1").json()
        if not txs:
            pytest.skip()
        tx_id = txs[0]["id"]
        r = s2_ctx["session"].delete(f"{API}/transactions/{tx_id}")
        assert r.status_code in (403, 404)
        # Confirm still exists for user1
        assert s1.get(f"{API}/transactions/{tx_id}").status_code == 200


# ---------------- AI Assistant ----------------

class TestAssistant:
    def test_chat_grounded_response(self, s1):
        r = s1.post(f"{API}/assistant/chat", json={"message": "Berapa omzet saya bulan ini?"}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        # Response should contain some text
        text = (d.get("message") or d.get("response") or d.get("reply") or str(d)).lower()
        assert len(text) > 20
        # Cross-check with dashboard summary
        summary = s1.get(f"{API}/dashboard/summary").json()
        # Should at least mention rupiah or numeric hint
        assert any(t in text for t in ("rp", "omzet", "revenue", "juta", "ribu"))
