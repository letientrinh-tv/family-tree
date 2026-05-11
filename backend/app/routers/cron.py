import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..notifications import run_daily_notifications

router = APIRouter(prefix="/api/cron", tags=["cron"])


@router.post("/daily")
def run_daily_cron(request: Request, db: Session = Depends(get_db)):
    secret = os.getenv("CRON_SECRET", "")
    if secret:
        auth = request.headers.get("authorization", "")
        if auth != f"Bearer {secret}":
            raise HTTPException(status_code=401, detail="Unauthorized")
    run_daily_notifications(db)
    return {"status": "ok"}
