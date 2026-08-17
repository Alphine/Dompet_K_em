"""Iteration 2 backend tests: cron (weekly recap, receivable reminders),
notifications API, photo receipt upload/download, voice endpoint shape.
"""
import io
import os
import time
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kem-finance.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
SEEDED_TOKEN = "test_session_screenshot_tok"
BUSINESS_ID = "biz_6920d0adc7"


def _read_cron_secret():
    with open("/app/backend/.env") as f:
        for line in f:
            if line.startswith("WEBHOOK_CRON_SECRET="):
                return line.split("=", 1)[1].strip()
    return ""


CRON_SECRET = _read_cron_secret()


@pytest.fixture(scope="module")
def s1():
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {SEEDED_TOKEN}"})
    return s


# ---------------- Cron auth ----------------

class TestCronAuth:
    def test_weekly_recap_requires_auth(self):
        r = requests.post(f"{API}/cron/weekly-recap")
        assert r.status_code == 401

    def test_weekly_recap_bad_secret_rejected(self):
        r = requests.post(f"{API}/cron/weekly-recap", headers={"Authorization": "Bearer wrong"})
        assert r.status_code == 401

    def test_reminders_requires_auth(self):
        r = requests.post(f"{API}/cron/receivable-reminders")
        assert r.status_code == 401


# ---------------- Weekly recap ----------------

class TestWeeklyRecap:
    def test_weekly_recap_creates_notification(self, s1):
        # Snapshot pre notification count of type weekly_recap
        pre_list = s1.get(f"{API}/notifications").json()["items"]
        pre_recap_ids = {n["id"] for n in pre_list if n.get("type") == "weekly_recap"}

        r = requests.post(
            f"{API}/cron/weekly-recap",
            headers={"Authorization": f"Bearer {CRON_SECRET}"},
        )
        assert r.status_code == 200
        assert r.json().get("status") == "accepted"

        # Wait for background task
        found = None
        for _ in range(15):
            time.sleep(1)
            data = s1.get(f"{API}/notifications").json()
            for n in data["items"]:
                if n.get("type") == "weekly_recap" and n["id"] not in pre_recap_ids:
                    found = n
                    break
            if found:
                break
        assert found is not None, "weekly_recap notification not created"
        assert "link" in found
        assert found.get("business_id") == BUSINESS_ID


# ---------------- Receivable reminders ----------------

class TestReceivableReminders:
    def test_reminders_creates_notification_for_overdue(self, s1):
        # Backdate one receivable to yesterday to trigger reminder
        script = f"""
use('test_database');
var r = db.receivables.findOne({{business_id:'{BUSINESS_ID}', outstanding:{{$gt:0}}}});
if (r) {{
  var y = new Date(Date.now()-24*60*60*1000).toISOString().slice(0,10);
  db.receivables.updateOne({{id:r.id}}, {{$set:{{due_date:y}}}});
  print('BACKDATED:'+r.id);
}}
// Also clear today's receivable_reminder notifications so dedupe doesn't skip
db.notifications.deleteMany({{business_id:'{BUSINESS_ID}', type:'receivable_reminder'}});
"""
        out = subprocess.run(["mongosh", "--quiet", "--eval", script], capture_output=True, text=True)
        assert "BACKDATED" in out.stdout, out.stdout + out.stderr

        r = requests.post(
            f"{API}/cron/receivable-reminders",
            headers={"Authorization": f"Bearer {CRON_SECRET}"},
        )
        assert r.status_code == 200

        found = None
        for _ in range(15):
            time.sleep(1)
            data = s1.get(f"{API}/notifications").json()
            for n in data["items"]:
                if n.get("type") == "receivable_reminder":
                    found = n
                    break
            if found:
                break
        assert found is not None, "receivable_reminder not created"
        assert "/receivables" in (found.get("link") or "")


# ---------------- Notifications API ----------------

class TestNotifications:
    def test_list_and_unread_count(self, s1):
        r = s1.get(f"{API}/notifications")
        assert r.status_code == 200
        d = r.json()
        assert "items" in d and "unread_count" in d
        assert isinstance(d["items"], list)
        assert isinstance(d["unread_count"], int)

    def test_mark_read_decreases_unread(self, s1):
        d = s1.get(f"{API}/notifications").json()
        unread_items = [n for n in d["items"] if not n.get("is_read")]
        if not unread_items:
            pytest.skip("no unread notifications")
        nid = unread_items[0]["id"]
        pre_count = d["unread_count"]
        r = s1.post(f"{API}/notifications/{nid}/read")
        assert r.status_code == 200
        post = s1.get(f"{API}/notifications").json()
        assert post["unread_count"] == pre_count - 1
        assert any(n["id"] == nid and n["is_read"] for n in post["items"])

    def test_read_all(self, s1):
        r = s1.post(f"{API}/notifications/read-all")
        assert r.status_code == 200
        d = s1.get(f"{API}/notifications").json()
        assert d["unread_count"] == 0


# ---------------- Photo Receipts / Uploads ----------------

# 1x1 PNG
_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
    b"\x00\x00\x00\x03\x00\x01\x5b\xd1\xda\xd5\x00\x00\x00\x00IEND\xaeB`\x82"
)


class TestUploads:
    def test_upload_and_download_receipt(self):
        s = requests.Session()
        headers = {"Authorization": f"Bearer {SEEDED_TOKEN}"}
        files = {"file": ("test.png", io.BytesIO(_PNG), "image/png")}
        r = s.post(f"{API}/uploads", files=files, headers=headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and "url" in d
        assert d["url"] == f"/api/files/{d['id']}"

        # Download
        r2 = s.get(f"{BASE_URL}{d['url']}", headers=headers)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")
        assert len(r2.content) > 0

    def test_download_missing_file_404(self):
        r = requests.get(f"{API}/files/nonexistent-id", headers={"Authorization": f"Bearer {SEEDED_TOKEN}"})
        assert r.status_code == 404

    def test_upload_requires_auth(self):
        files = {"file": ("test.png", io.BytesIO(_PNG), "image/png")}
        r = requests.post(f"{API}/uploads", files=files)
        assert r.status_code in (401, 403)


# ---------------- Voice endpoint ----------------

class TestVoiceEndpoint:
    def test_voice_parse_empty_file_rejected(self, s1):
        files = {"file": ("empty.webm", io.BytesIO(b""), "audio/webm")}
        r = requests.post(f"{API}/voice/parse", files=files,
                          headers={"Authorization": f"Bearer {SEEDED_TOKEN}"})
        assert r.status_code == 400

    def test_voice_parse_requires_auth(self):
        files = {"file": ("a.webm", io.BytesIO(b"fake"), "audio/webm")}
        r = requests.post(f"{API}/voice/parse", files=files)
        assert r.status_code in (401, 403)
