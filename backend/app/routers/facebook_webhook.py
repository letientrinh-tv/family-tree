import os
import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/facebook", tags=["facebook"])

VERIFY_TOKEN = os.getenv("FACEBOOK_VERIFY_TOKEN", "")
APP_SECRET = os.getenv("FACEBOOK_APP_SECRET", "")


def _verify_signature(body: bytes, signature: str) -> bool:
    if not APP_SECRET or not signature.startswith("sha256="):
        return True  # skip nếu chưa cấu hình APP_SECRET
    expected = "sha256=" + hmac.new(
        APP_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.get("/webhook")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Facebook webhook verification handshake."""
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verify token không khớp")


@router.post("/webhook")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    """Nhận sự kiện từ Facebook Messenger.

    Khi user nhắn tin vào Page, lưu PSID của họ nếu tin nhắn chứa
    mã liên kết (link_token) hợp lệ. Nếu không có mã, vẫn lưu PSID
    để chủ Page có thể tìm thấy sau.
    """
    body = await request.body()
    sig = request.headers.get("x-hub-signature-256", "")
    if not _verify_signature(body, sig):
        raise HTTPException(status_code=403, detail="Chữ ký không hợp lệ")

    data = await request.json()
    if data.get("object") != "page":
        return {"status": "ignored"}

    for entry in data.get("entry", []):
        for event in entry.get("messaging", []):
            psid = event.get("sender", {}).get("id")
            if not psid:
                continue

            text = (event.get("message", {}).get("text") or "").strip()

            # Tìm user qua link_token (dạng "LINK:<token>") do frontend gửi
            if text.upper().startswith("LINK:"):
                token = text[5:].strip()
                setting = db.query(models.NotificationSetting).filter(
                    models.NotificationSetting.facebook_link_token == token
                ).first()
                if setting:
                    setting.facebook_psid = psid
                    setting.facebook_link_token = None
                    setting.facebook_enabled = True
                    db.commit()

    return {"status": "ok"}
