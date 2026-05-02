import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import BankSetting, PlanSetting
from ..plans import PLAN_LIMITS
from ..auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/settings", tags=["settings"])

UPLOAD_DIR = "uploads/qr"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_or_create(db: Session) -> BankSetting:
    setting = db.query(BankSetting).first()
    if not setting:
        setting = BankSetting(id=1)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.get("/bank")
def get_bank_setting(db: Session = Depends(get_db)):
    s = _get_or_create(db)
    return {
        "bank_name": s.bank_name,
        "account_number": s.account_number,
        "account_holder": s.account_holder,
        "bank_branch": s.bank_branch,
        "transfer_content": s.transfer_content,
        "qr_code_url": s.qr_code_url,
    }


@router.put("/bank")
def update_bank_setting(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    s = _get_or_create(db)
    for field in ("bank_name", "account_number", "account_holder", "bank_branch", "transfer_content"):
        if field in payload:
            setattr(s, field, payload[field])
    db.commit()
    db.refresh(s)
    return {
        "bank_name": s.bank_name,
        "account_number": s.account_number,
        "account_holder": s.account_holder,
        "bank_branch": s.bank_branch,
        "transfer_content": s.transfer_content,
        "qr_code_url": s.qr_code_url,
    }


@router.post("/bank/qr")
async def upload_qr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Chỉ chấp nhận file ảnh")
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    filename = f"qr_{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    url = f"/uploads/qr/{filename}"
    s = _get_or_create(db)
    s.qr_code_url = url
    db.commit()
    return {"qr_code_url": url}


# ── Plan settings ─────────────────────────────────────────────

@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    rows = db.query(PlanSetting).all()
    order = list(PLAN_LIMITS.keys())
    result = {r.key: {"label": r.label, "trees": r.trees, "members_per_tree": r.members_per_tree, "price": r.price, "description": r.description} for r in rows}
    return {k: result.get(k, PLAN_LIMITS[k]) for k in order if k in result or k in PLAN_LIMITS}


@router.put("/plans")
def update_plans(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    for key, data in payload.items():
        row = db.query(PlanSetting).filter_by(key=key).first()
        if not row:
            row = PlanSetting(key=key, **{k: data.get(k, PLAN_LIMITS.get(key, {}).get(k, "")) for k in ("label", "trees", "members_per_tree", "price", "description")})
            db.add(row)
        else:
            for field in ("label", "trees", "members_per_tree", "price", "description"):
                if field in data:
                    setattr(row, field, data[field])
    db.commit()
    return get_plans(db)
