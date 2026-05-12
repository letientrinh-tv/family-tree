import os
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..notifications import (
    get_upcoming_events, send_email, send_zalo, send_facebook, send_telegram,
    _build_email_html, _build_short_message,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _get_or_create_setting(user: models.User, db: Session) -> models.NotificationSetting:
    setting = db.query(models.NotificationSetting).filter(
        models.NotificationSetting.user_id == user.id
    ).first()
    if not setting:
        setting = models.NotificationSetting(user_id=user.id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.get("/settings", response_model=schemas.NotificationSettingResponse)
def get_settings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_or_create_setting(current_user, db)


@router.put("/settings", response_model=schemas.NotificationSettingResponse)
def update_settings(
    data: schemas.NotificationSettingUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    setting = _get_or_create_setting(current_user, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(setting, field, value)
    db.commit()
    db.refresh(setting)
    return setting


@router.get("/upcoming", response_model=List[schemas.UpcomingEvent])
def get_upcoming(
    days: int = 30,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="days phải trong khoảng 1–365")
    return get_upcoming_events(db, current_user.id, days)


@router.post("/test")
def send_test_notification(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        already = db.query(models.NotificationLog).filter(
            models.NotificationLog.user_id == current_user.id,
            models.NotificationLog.event_type == "test",
        ).first()
        if already:
            raise HTTPException(
                status_code=429,
                detail="Bạn đã gửi thông báo test rồi. Mỗi tài khoản chỉ được gửi 1 lần.",
            )

    setting = _get_or_create_setting(current_user, db)
    results = {}

    events = get_upcoming_events(db, current_user.id, 30)
    sample = events or [{
        "person_name": "Nguyễn Văn Ví Dụ",
        "event_type": "birthday",
        "event_date": "1950-03-15",
        "days_until": 5,
        "tree_name": "Gia phả của bạn",
        "person_id": 0,
    }]

    if setting.email_enabled:
        email_to = setting.notify_email or current_user.email
        ok, err = send_email(email_to, "Gia Phả Việt – Test thông báo", _build_email_html(current_user.username, sample))
        results["email"] = {"success": ok, "recipient": email_to, "error": err if not ok else None}
        db.add(models.NotificationLog(user_id=current_user.id, person_id=None, event_type="test",
            event_date="test", channel="email", recipient=email_to, success=ok, error_message=None if ok else err))

    if setting.zalo_enabled and setting.notify_phone:
        msg = _build_short_message(current_user.username, sample)
        ok, err = send_zalo(setting.notify_phone, msg)
        results["zalo"] = {"success": ok, "recipient": setting.notify_phone, "error": err if not ok else None}
        db.add(models.NotificationLog(user_id=current_user.id, person_id=None, event_type="test",
            event_date="test", channel="zalo", recipient=setting.notify_phone, success=ok, error_message=None if ok else err))

    if setting.facebook_enabled and setting.facebook_psid:
        msg = _build_short_message(current_user.username, sample)
        ok, err = send_facebook(setting.facebook_psid, msg)
        results["facebook"] = {"success": ok, "recipient": setting.facebook_psid, "error": err if not ok else None}
        db.add(models.NotificationLog(user_id=current_user.id, person_id=None, event_type="test",
            event_date="test", channel="facebook", recipient=setting.facebook_psid, success=ok, error_message=None if ok else err))

    if setting.telegram_enabled and setting.telegram_chat_id:
        msg = _build_short_message(current_user.username, sample)
        ok, err = send_telegram(setting.telegram_chat_id, msg)
        results["telegram"] = {"success": ok, "recipient": setting.telegram_chat_id, "error": err if not ok else None}
        db.add(models.NotificationLog(user_id=current_user.id, person_id=None, event_type="test",
            event_date="test", channel="telegram", recipient=setting.telegram_chat_id, success=ok, error_message=None if ok else err))

    db.commit()

    if not results:
        raise HTTPException(status_code=400, detail="Chưa bật kênh thông báo nào.")
    return {"results": results}


@router.post("/telegram/link-token")
def generate_telegram_link_token(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot_username = os.getenv("TELEGRAM_BOT_USERNAME", "GiaPhaVietBot")
    setting = _get_or_create_setting(current_user, db)
    token = secrets.token_urlsafe(12)
    setting.telegram_link_token = token
    db.commit()
    return {
        "token": token,
        "telegram_url": f"https://t.me/{bot_username}?start={token}",
    }


@router.get("/telegram/status")
def telegram_link_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    setting = _get_or_create_setting(current_user, db)
    return {"linked": bool(setting.telegram_chat_id), "enabled": setting.telegram_enabled}


@router.delete("/telegram/unlink")
def unlink_telegram(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    setting = _get_or_create_setting(current_user, db)
    setting.telegram_chat_id = None
    setting.telegram_link_token = None
    setting.telegram_enabled = False
    db.commit()
    return {"status": "unlinked"}


@router.post("/facebook/link-token")
def generate_facebook_link_token(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sinh token tạm để user liên kết PSID.

    Frontend hiển thị hướng dẫn: nhắn tin "LINK:<token>" vào Page.
    Webhook nhận tin → lưu PSID vào notification_settings.
    """
    page_name = os.getenv("FACEBOOK_PAGE_NAME", "")
    if not page_name:
        raise HTTPException(status_code=503, detail="FACEBOOK_PAGE_NAME chưa được cấu hình trong .env")
    setting = _get_or_create_setting(current_user, db)
    token = secrets.token_urlsafe(12)
    setting.facebook_link_token = token
    db.commit()
    return {
        "token": token,
        "instruction": f"Nhắn tin 'LINK:{token}' vào Messenger Page của ứng dụng",
        "messenger_url": f"https://m.me/{page_name}",
    }


@router.get("/facebook/status")
def facebook_link_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kiểm tra PSID đã được liên kết chưa."""
    setting = _get_or_create_setting(current_user, db)
    return {
        "linked": bool(setting.facebook_psid),
        "enabled": setting.facebook_enabled,
    }


@router.delete("/facebook/unlink")
def unlink_facebook(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Huỷ liên kết Facebook – user có thể opt-out bất cứ lúc nào."""
    setting = _get_or_create_setting(current_user, db)
    setting.facebook_psid = None
    setting.facebook_link_token = None
    setting.facebook_enabled = False
    db.commit()
    return {"status": "unlinked"}


@router.get("/logs", response_model=List[schemas.NotificationLogResponse])
def get_logs(
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.NotificationLog)
        .filter(models.NotificationLog.user_id == current_user.id)
        .order_by(models.NotificationLog.sent_at.desc())
        .limit(limit)
        .all()
    )
