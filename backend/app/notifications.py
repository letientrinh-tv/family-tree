import os
import json
import smtplib
import httpx
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import date
from typing import Optional, List

from sqlalchemy.orm import Session

from . import models


# ── Email ─────────────────────────────────────────────────────

def _smtp_config():
    username = os.getenv("SMTP_USERNAME", "")
    from_email = os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_FROM", username))
    from_name = os.getenv("SMTP_FROM_NAME", "Gia Phả Việt")
    return {
        "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "username": username,
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from_email": from_email,
        "from_addr": f"{from_name} <{from_email}>" if from_name else from_email,
    }


def send_email(to_email: str, subject: str, body_html: str) -> tuple:
    cfg = _smtp_config()
    if not cfg["username"] or not cfg["password"]:
        return False, "SMTP chưa được cấu hình (thiếu SMTP_USERNAME/SMTP_PASSWORD)"
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = cfg["from_addr"]
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))
        with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
            server.starttls()
            server.login(cfg["username"], cfg["password"])
            server.sendmail(cfg["from_email"], to_email, msg.as_string())
        return True, "OK"
    except Exception as e:
        return False, str(e)


# ── Zalo OA ───────────────────────────────────────────────────

def _zalo_oa_token():
    return os.getenv("ZALO_OA_ACCESS_TOKEN", "")


def _zalo_get_uid_by_phone(phone: str, token: str) -> Optional[str]:
    """Look up Zalo user_id (uid) from phone number via OA API."""
    # Normalize phone: strip spaces, ensure leading 0
    phone = phone.strip().replace(" ", "").replace("-", "")
    try:
        resp = httpx.get(
            "https://openapi.zalo.me/v2.0/oa/getfollowers",
            params={"data": json.dumps({"phone": phone, "limit": 1})},
            headers={"access_token": token},
            timeout=10,
        )
        data = resp.json()
        # Response: {"error": 0, "message": "Success", "data": {"total": 1, "followers": [{"user_id": "..."}]}}
        followers = data.get("data", {}).get("followers", [])
        if followers:
            return str(followers[0].get("user_id", ""))
    except Exception:
        pass
    return None


def send_zalo(to_phone: str, message: str) -> tuple:
    token = _zalo_oa_token()
    if not token:
        return False, "Zalo OA chưa được cấu hình (thiếu ZALO_OA_ACCESS_TOKEN)"
    try:
        uid = _zalo_get_uid_by_phone(to_phone, token)
        if not uid:
            return False, (
                "Không tìm thấy người dùng Zalo với số này. "
                "Hãy đảm bảo họ đã quan tâm OA Zalo của bạn."
            )
        resp = httpx.post(
            "https://openapi.zalo.me/v2.0/oa/message",
            headers={"access_token": token, "Content-Type": "application/json"},
            json={
                "recipient": {"user_id": uid},
                "message": {"text": message},
            },
            timeout=10,
        )
        result = resp.json()
        if result.get("error") == 0:
            return True, "OK"
        return False, result.get("message", "Zalo API lỗi")
    except Exception as e:
        return False, str(e)


# ── Facebook Messenger ────────────────────────────────────────

def send_facebook(psid: str, message: str) -> tuple:
    page_token = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "")
    if not page_token:
        return False, "Facebook Page chưa được cấu hình (thiếu FACEBOOK_PAGE_ACCESS_TOKEN)"
    try:
        resp = httpx.post(
            "https://graph.facebook.com/v21.0/me/messages",
            params={"access_token": page_token},
            json={
                "recipient": {"id": psid},
                "message": {"text": message},
                # MESSAGE_TAG + ACCOUNT_UPDATE: cho phép gửi ngoài cửa sổ 24h
                # mà không bị Facebook coi là spam — phù hợp cho nhắc nhở
                # sự kiện gia đình (tính năng của tài khoản)
                "messaging_type": "MESSAGE_TAG",
                "tag": "ACCOUNT_UPDATE",
            },
            timeout=10,
        )
        data = resp.json()
        if "message_id" in data or "recipient_id" in data:
            return True, "OK"
        err = data.get("error", {})
        return False, err.get("message", "Facebook API lỗi")
    except Exception as e:
        return False, str(e)


# ── Telegram ──────────────────────────────────────────────────

def send_telegram(chat_id: str, message: str) -> tuple:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token:
        return False, "Telegram chưa được cấu hình (thiếu TELEGRAM_BOT_TOKEN)"
    try:
        resp = httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": message, "parse_mode": "HTML"},
            timeout=10,
        )
        data = resp.json()
        if data.get("ok"):
            return True, "OK"
        return False, data.get("description", "Telegram API lỗi")
    except Exception as e:
        return False, str(e)


# ── Event helpers ─────────────────────────────────────────────

def _parse_month_day(date_str: str) -> tuple:
    """Return (month, day) or (None, None) if not parseable.
    Handles D/M/YYYY (stored format) and YYYY-MM-DD (ISO)."""
    if not date_str:
        return None, None
    date_str = date_str.strip()
    try:
        if "/" in date_str:
            parts = date_str.split("/")
            if len(parts) == 3:          # D/M/YYYY
                return int(parts[1]), int(parts[0])
        elif "-" in date_str:
            parts = date_str.split("-")
            if len(parts) == 3:          # YYYY-MM-DD
                return int(parts[1]), int(parts[2])
    except (ValueError, IndexError):
        pass
    return None, None


def get_upcoming_events(db: Session, user_id: int, days_window: int = 30) -> List[dict]:
    today = date.today()
    events = []
    trees = db.query(models.FamilyTree).filter(models.FamilyTree.user_id == user_id).all()
    for tree in trees:
        for person in tree.persons:
            if not getattr(person, "notify_events", True):
                continue
            for event_type, date_str in [
                ("birthday", person.birth_date),
                ("death_anniversary", person.death_date),
            ]:
                if not date_str:
                    continue
                month, day = _parse_month_day(date_str)
                if not month or not day:
                    continue
                try:
                    this_year = date(today.year, month, day)
                    days_until = (this_year - today).days
                    if days_until < 0:
                        next_year = date(today.year + 1, month, day)
                        days_until = (next_year - today).days
                    if 0 <= days_until <= days_window:
                        events.append({
                            "person_id": person.id,
                            "person_name": person.full_name,
                            "event_type": event_type,
                            "event_date": date_str,
                            "days_until": days_until,
                            "tree_name": tree.name,
                        })
                except ValueError:
                    continue
    return sorted(events, key=lambda x: x["days_until"])


# ── Message builders ──────────────────────────────────────────

def _build_email_html(username: str, events: List[dict]) -> str:
    rows = ""
    for e in events:
        label = "Sinh nhật" if e["event_type"] == "birthday" else "Ngày giỗ"
        days_text = "Hôm nay!" if e["days_until"] == 0 else f"Còn {e['days_until']} ngày"
        color = "#b91c1c" if e["days_until"] == 0 else "#2D5016"
        rows += f"""
        <tr>
            <td style="padding:10px 8px;border-bottom:1px solid #e8e0d0;">{e['person_name']}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e8e0d0;">{label}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e8e0d0;">{e['event_date']}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e8e0d0;
                color:{color};font-weight:bold;">{days_text}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e8e0d0;
                color:#7a5c3e;font-size:0.85em;">{e['tree_name']}</td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#FDFAF5;padding:24px;margin:0;">
<div style="max-width:620px;margin:0 auto;background:#fff;
    border:1px solid #C4A882;border-radius:10px;padding:28px;">
  <div style="border-bottom:2px solid #C4A882;padding-bottom:14px;margin-bottom:20px;">
    <h1 style="color:#2D5016;font-size:1.5rem;margin:0 0 4px 0;">🌳 Gia Phả Việt</h1>
    <p style="color:#7a5c3e;margin:0;font-size:0.9rem;">Nhắc nhở sự kiện gia đình</p>
  </div>
  <p style="color:#3C2415;">Xin chào <strong>{username}</strong>,</p>
  <p style="color:#3C2415;">Dưới đây là các sự kiện sắp diễn ra trong gia phả của bạn:</p>
  <table style="width:100%;border-collapse:collapse;margin-top:12px;">
    <thead>
      <tr style="background:#F5F0E8;">
        <th style="padding:10px 8px;text-align:left;color:#3C2415;">Họ tên</th>
        <th style="padding:10px 8px;text-align:left;color:#3C2415;">Sự kiện</th>
        <th style="padding:10px 8px;text-align:left;color:#3C2415;">Ngày</th>
        <th style="padding:10px 8px;text-align:left;color:#3C2415;">Còn lại</th>
        <th style="padding:10px 8px;text-align:left;color:#3C2415;">Gia phả</th>
      </tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>
  <p style="color:#7a5c3e;font-size:0.82rem;margin-top:24px;
      border-top:1px solid #e8e0d0;padding-top:14px;">
    Bạn nhận được email này vì đã bật tính năng thông báo trên <strong>Gia Phả Việt</strong>.
    Để thay đổi cài đặt, vào mục <em>Thông báo</em> trên trang web.
  </p>
</div>
</body></html>"""


def _build_short_message(username: str, events: List[dict]) -> str:
    lines = [f"🌳 Gia Phả Việt nhắc {username}:"]
    for e in events[:5]:
        label = "Sinh nhật" if e["event_type"] == "birthday" else "Ngày giỗ"
        days = "hôm nay!" if e["days_until"] == 0 else f"còn {e['days_until']} ngày"
        lines.append(f"• {label} {e['person_name']} ({e['tree_name']}) – {days}")
    if len(events) > 5:
        lines.append(f"... và {len(events) - 5} sự kiện khác")
    return "\n".join(lines)


# ── Daily job ─────────────────────────────────────────────────

def run_daily_notifications(db: Session):
    settings_list = db.query(models.NotificationSetting).filter(
        models.NotificationSetting.active == True
    ).all()

    for setting in settings_list:
        user = db.query(models.User).filter(
            models.User.id == setting.user_id,
            models.User.is_active == True,
        ).first()
        if not user:
            continue

        events = get_upcoming_events(db, user.id, setting.days_before)
        if not events:
            continue

        today_str = str(date.today())

        def _already_sent(channel: str) -> bool:
            return db.query(models.NotificationLog).filter(
                models.NotificationLog.user_id == user.id,
                models.NotificationLog.channel == channel,
                models.NotificationLog.event_date == today_str,
                models.NotificationLog.success == True,
            ).first() is not None

        # Email
        if setting.email_enabled and not _already_sent("email"):
            email_to = setting.notify_email or user.email
            subject = f"Gia Phả Việt – {len(events)} sự kiện sắp tới"
            body = _build_email_html(user.username, events)
            ok, err = send_email(email_to, subject, body)
            for e in events:
                db.add(models.NotificationLog(
                    user_id=user.id,
                    person_id=e["person_id"],
                    event_type=e["event_type"],
                    event_date=today_str,
                    channel="email",
                    recipient=email_to,
                    success=ok,
                    error_message=None if ok else err,
                ))

        # Zalo
        if setting.zalo_enabled and setting.notify_phone and not _already_sent("zalo"):
            msg = _build_short_message(user.username, events)
            ok, err = send_zalo(setting.notify_phone, msg)
            db.add(models.NotificationLog(
                user_id=user.id,
                person_id=None,
                event_type="summary",
                event_date=today_str,
                channel="zalo",
                recipient=setting.notify_phone,
                success=ok,
                error_message=None if ok else err,
            ))

        # Telegram
        if setting.telegram_enabled and setting.telegram_chat_id and not _already_sent("telegram"):
            msg = _build_short_message(user.username, events)
            ok, err = send_telegram(setting.telegram_chat_id, msg)
            db.add(models.NotificationLog(
                user_id=user.id, person_id=None, event_type="summary",
                event_date=today_str, channel="telegram",
                recipient=setting.telegram_chat_id, success=ok,
                error_message=None if ok else err,
            ))

        # Facebook Messenger – max 1 tin/ngày/user, dùng MESSAGE_TAG tránh spam
        if setting.facebook_enabled and setting.facebook_psid and not _already_sent("facebook"):
            msg = _build_short_message(user.username, events)
            ok, err = send_facebook(setting.facebook_psid, msg)
            db.add(models.NotificationLog(
                user_id=user.id,
                person_id=None,
                event_type="summary",
                event_date=today_str,
                channel="facebook",
                recipient=setting.facebook_psid,
                success=ok,
                error_message=None if ok else err,
            ))

        db.commit()
