import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from sqlalchemy import text
from .database import engine, SessionLocal
from . import models
from .auth import get_password_hash
from .routers import auth, trees, persons, admin, notifications, billing, print_orders, settings
from .plans import PLAN_LIMITS
from .scheduler import start_scheduler, stop_scheduler

# Create upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Gia Pha Viet API",
    description="Backend API for the Vietnamese genealogy website",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://frontend:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(trees.router)
app.include_router(persons.router)
app.include_router(admin.router)
app.include_router(notifications.router)
app.include_router(billing.router)
app.include_router(print_orders.router)
app.include_router(settings.router)


def _migrate_notification_columns():
    db = SessionLocal()
    try:
        for col, ddl in [
            ("zalo_enabled",    "ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS zalo_enabled BOOLEAN DEFAULT FALSE"),
            ("facebook_enabled","ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS facebook_enabled BOOLEAN DEFAULT FALSE"),
            ("facebook_psid",   "ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS facebook_psid VARCHAR"),
            ("print_orders",    None),  # table created by create_all
            ("nickname",        "ALTER TABLE persons ADD COLUMN IF NOT EXISTS nickname VARCHAR"),
            ("notify_events",   "ALTER TABLE persons ADD COLUMN IF NOT EXISTS notify_events BOOLEAN DEFAULT TRUE NOT NULL"),
        ]:
            if ddl:
                db.execute(text(ddl))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Migration warning: {e}")
    finally:
        db.close()


@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()


@app.on_event("startup")
def startup_event():
    start_scheduler()
    # Create all tables
    models.Base.metadata.create_all(bind=engine)

    # Migrate: add new notification columns if missing
    _migrate_notification_columns()

    # Seed plan_settings with defaults if empty
    db2: Session = SessionLocal()
    try:
        for key, cfg in PLAN_LIMITS.items():
            if not db2.query(models.PlanSetting).filter_by(key=key).first():
                db2.add(models.PlanSetting(
                    key=key,
                    label=cfg["label"],
                    trees=cfg["trees"],
                    members_per_tree=cfg["members_per_tree"],
                    price=cfg["price"],
                    description="",
                ))
        db2.commit()
    except Exception as e:
        db2.rollback()
        print(f"Plan seed warning: {e}")
    finally:
        db2.close()

    # Create default admin user if not exists
    db: Session = SessionLocal()
    try:
        existing_admin = db.query(models.User).filter(models.User.username == "trinhlt").first()
        if not existing_admin:
            admin_user = models.User(
                email="trinhlt@nal.vn",
                username="trinhlt",
                hashed_password=get_password_hash("111"),
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created: trinhlt")
        else:
            print("Admin user already exists")
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Gia Pha Viet API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
