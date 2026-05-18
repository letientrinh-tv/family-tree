import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..notifications import run_daily_notifications

router = APIRouter(prefix="/api/cron", tags=["cron"])


def _check_secret(request: Request):
    secret = os.getenv("CRON_SECRET", "")
    if secret:
        auth = request.headers.get("authorization", "")
        if auth != f"Bearer {secret}":
            raise HTTPException(status_code=401, detail="Unauthorized")


# Vercel Cron gửi GET request
@router.get("/daily")
def run_daily_cron_get(request: Request, db: Session = Depends(get_db)):
    _check_secret(request)
    result = run_daily_notifications(db)
    return {"status": "ok", **result}


# Giữ POST để có thể trigger thủ công
@router.post("/daily")
def run_daily_cron_post(request: Request, db: Session = Depends(get_db)):
    _check_secret(request)
    result = run_daily_notifications(db)
    return {"status": "ok", **result}
