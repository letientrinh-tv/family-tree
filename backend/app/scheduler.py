from apscheduler.schedulers.background import BackgroundScheduler

from .database import SessionLocal
from .notifications import run_daily_notifications

_scheduler = BackgroundScheduler(timezone="Asia/Ho_Chi_Minh")


def _daily_job():
    db = SessionLocal()
    try:
        run_daily_notifications(db)
    finally:
        db.close()


def start_scheduler():
    _scheduler.add_job(_daily_job, "cron", hour=8, minute=0, id="daily_notifications")
    _scheduler.start()


def stop_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
