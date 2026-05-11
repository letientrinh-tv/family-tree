import os
import re
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)


class SocialLoginData(BaseModel):
    token: str

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Check if username already exists
    if db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = models.User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        role="user",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    access_token = create_access_token(data={"sub": user.username})
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(user),
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ── Social Login helpers ──────────────────────────────────────
def _unique_username(base: str, db: Session) -> str:
    base = re.sub(r'[^a-z0-9_]', '', base.lower())[:20] or "user"
    username, counter = base, 1
    while db.query(models.User).filter(models.User.username == username).first():
        username = f"{base}{counter}"
        counter += 1
    return username


def _issue_token(user: models.User, provider: str, social_id: str, db: Session) -> schemas.Token:
    if not user.social_provider:
        user.social_provider = provider
        user.social_id = social_id
        db.commit()
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Tài khoản đã bị vô hiệu hóa")
    access_token = create_access_token(data={"sub": user.username})
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(user),
    )


def _find_or_create(email: str, name: str, provider: str, social_id: str, db: Session) -> schemas.Token:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        username = _unique_username(email.split("@")[0], db)
        user = models.User(
            email=email,
            username=username,
            hashed_password=get_password_hash(os.urandom(32).hex()),
            role="user",
            is_active=True,
            social_provider=provider,
            social_id=social_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return _issue_token(user, provider, social_id, db)


# ── Google Login ──────────────────────────────────────────────
@router.post("/google", response_model=schemas.Token)
async def google_login(data: SocialLoginData, db: Session = Depends(get_db)):
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {data.token}"},
            )
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail="Token Google không hợp lệ")
        info = r.json()
        email = info.get("email")
        name = info.get("name", "")
        social_id = info.get("sub", "")
        if not email:
            raise HTTPException(status_code=400, detail="Không lấy được email từ Google")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi xác thực Google: {e}")
    return _find_or_create(email, name, "google", social_id, db)


# ── Facebook Login ────────────────────────────────────────────
@router.post("/facebook", response_model=schemas.Token)
async def facebook_login(data: SocialLoginData, db: Session = Depends(get_db)):
    app_id = os.getenv("VITE_FACEBOOK_APP_ID", "")
    app_secret = os.getenv("FACEBOOK_APP_SECRET", "")
    if not app_id or not app_secret:
        raise HTTPException(status_code=400, detail="Facebook OAuth chưa được cấu hình (thiếu VITE_FACEBOOK_APP_ID/SECRET)")
    try:
        import httpx
        app_token = f"{app_id}|{app_secret}"
        async with httpx.AsyncClient() as client:
            debug_r = await client.get(
                "https://graph.facebook.com/debug_token",
                params={"input_token": data.token, "access_token": app_token},
            )
            debug_data = debug_r.json()
        if not debug_data.get("data", {}).get("is_valid"):
            raise HTTPException(status_code=400, detail="Token Facebook không hợp lệ")
        async with httpx.AsyncClient() as client:
            me_r = await client.get(
                "https://graph.facebook.com/me",
                params={"fields": "id,name,email", "access_token": data.token},
            )
            fb_user = me_r.json()
        fb_id = fb_user.get("id", "")
        if not fb_id:
            raise HTTPException(status_code=400, detail="Không lấy được thông tin Facebook")
        # Check if a user already linked this Facebook ID
        existing = db.query(models.User).filter(
            models.User.social_provider == "facebook",
            models.User.social_id == fb_id,
        ).first()
        if existing:
            return _issue_token(existing, "facebook", fb_id, db)
        email = fb_user.get("email") or f"fb_{fb_id}@facebook-user.com"
        return _find_or_create(email, fb_user.get("name", ""), "facebook", fb_id, db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi Facebook: {e}")
