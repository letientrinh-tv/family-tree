from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..plans import PLAN_LIMITS

router = APIRouter(prefix="/api/billing", tags=["billing"])


class UpgradeRequest(BaseModel):
    plan: str


@router.get("/plans")
def get_plans():
    return PLAN_LIMITS


@router.get("/status", response_model=schemas.UserResponse)
def get_billing_status(
    current_user: models.User = Depends(get_current_user),
):
    return current_user


@router.post("/upgrade", response_model=schemas.UserResponse)
def upgrade_plan(
    req: UpgradeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.plan not in PLAN_LIMITS:
        raise HTTPException(status_code=400, detail="Gói không hợp lệ")
    if req.plan == "free":
        raise HTTPException(status_code=400, detail="Không thể đăng ký gói miễn phí")

    current_user.plan = req.plan
    current_user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=365)
    db.commit()
    db.refresh(current_user)
    return current_user
