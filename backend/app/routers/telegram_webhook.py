import os
import httpx
from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/telegram", tags=["telegram"])


def _bot_token():
    return os.getenv("TELEGRAM_BOT_TOKEN", "")


def _reply(chat_id: int, text: str):
    token = _bot_token()
    if not token:
        return
    httpx.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
        timeout=5,
    )


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    message = data.get("message") or data.get("edited_message")
    if not message:
        return {"ok": True}

    chat_id = message.get("chat", {}).get("id")
    text = (message.get("text") or "").strip()
    if not chat_id:
        return {"ok": True}

    if text.startswith("/start"):
        parts = text.split(maxsplit=1)
        token = parts[1].strip() if len(parts) > 1 else ""

        if token:
            setting = db.query(models.NotificationSetting).filter(
                models.NotificationSetting.telegram_link_token == token
            ).first()
            if setting:
                setting.telegram_chat_id = str(chat_id)
                setting.telegram_link_token = None
                setting.telegram_enabled = True
                db.commit()
                _reply(chat_id, "✅ <b>Kết nối thành công!</b>\n\nBạn sẽ nhận thông báo sinh nhật &amp; ngày giỗ từ <b>Gia Phả Việt</b> qua Telegram.")
            else:
                _reply(chat_id, "❌ Mã liên kết không hợp lệ hoặc đã hết hạn.\n\nVui lòng vào trang cài đặt và tạo lại link kết nối.")
        else:
            _reply(chat_id, f"👋 Xin chào! Vui lòng sử dụng link kết nối từ trang <b>Cài đặt thông báo</b> của Gia Phả Việt để kết nối tài khoản.")

    return {"ok": True}


@router.post("/poll")
def poll_updates(db: Session = Depends(get_db)):
    """Polling fallback khi chưa có webhook.
    Gọi getUpdates từ Telegram, xử lý /start <token> và lưu chat_id.
    """
    token = _bot_token()
    if not token:
        return {"error": "TELEGRAM_BOT_TOKEN chưa cấu hình"}
    try:
        resp = httpx.get(
            f"https://api.telegram.org/bot{token}/getUpdates",
            params={"limit": 50, "timeout": 0},
            timeout=10,
        )
        updates = resp.json().get("result", [])
        linked = []
        for update in updates:
            message = update.get("message", {})
            chat_id = message.get("chat", {}).get("id")
            text = (message.get("text") or "").strip()
            if not chat_id or not text.startswith("/start"):
                continue
            parts = text.split(maxsplit=1)
            link_token = parts[1].strip() if len(parts) > 1 else ""
            if not link_token:
                continue
            setting = db.query(models.NotificationSetting).filter(
                models.NotificationSetting.telegram_link_token == link_token
            ).first()
            if setting:
                setting.telegram_chat_id = str(chat_id)
                setting.telegram_link_token = None
                setting.telegram_enabled = True
                db.commit()
                linked.append(chat_id)
                _reply(chat_id, "✅ <b>Kết nối thành công!</b>\n\nBạn sẽ nhận thông báo sinh nhật &amp; ngày giỗ từ <b>Gia Phả Việt</b> qua Telegram.")
        return {"processed": len(updates), "linked": linked}
    except Exception as e:
        return {"error": str(e)}


@router.get("/set-webhook")
def set_webhook():
    """Đăng ký webhook URL với Telegram. Gọi 1 lần sau khi deploy."""
    token = _bot_token()
    app_url = os.getenv("APP_URL", "")
    if not token:
        return {"error": "TELEGRAM_BOT_TOKEN chưa cấu hình"}
    if not app_url:
        return {"error": "APP_URL chưa cấu hình"}
    webhook_url = f"{app_url.rstrip('/')}/api/telegram/webhook"
    resp = httpx.get(
        f"https://api.telegram.org/bot{token}/setWebhook",
        params={"url": webhook_url},
        timeout=10,
    )
    return resp.json()
