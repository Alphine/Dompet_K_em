import os
import hmac
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks
import recap_service as recap
import reminder_service as reminder

router = APIRouter(prefix="/api/cron", tags=["cron"])


def _verify_secret(authorization: str):
    secret = os.environ.get("WEBHOOK_CRON_SECRET", "")
    token = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if not secret or not hmac.compare_digest(token, secret):
        raise HTTPException(401, "Unauthorized")


# Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
@router.post("/weekly-recap")
async def weekly_recap(background_tasks: BackgroundTasks, authorization: str = Header(None)):
    _verify_secret(authorization)
    background_tasks.add_task(recap.run_weekly_recap_for_all_businesses)
    return {"status": "accepted"}


# Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
@router.post("/receivable-reminders")
async def receivable_reminders(background_tasks: BackgroundTasks, authorization: str = Header(None)):
    _verify_secret(authorization)
    background_tasks.add_task(reminder.run_receivable_reminders_for_all_businesses)
    return {"status": "accepted"}
