from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


# ── User Schemas ──────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    role: str
    is_active: bool
    plan: str = "free"
    plan_expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Auth Schemas ──────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    username: Optional[str] = None


# ── FamilyTree Schemas ────────────────────────────────────────
class FamilyTreeCreate(BaseModel):
    name: str
    description: Optional[str] = None


class FamilyTreeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class FamilyTreeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    user_id: int
    created_at: datetime
    updated_at: datetime
    person_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class FamilyTreeWithOwner(FamilyTreeResponse):
    owner_username: Optional[str] = None


# ── Person Schemas ────────────────────────────────────────────
class PersonCreate(BaseModel):
    full_name: str
    nickname: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    gender: Optional[str] = "unknown"
    biography: Optional[str] = None
    occupation: Optional[str] = None
    burial_place: Optional[str] = None
    notify_events: Optional[bool] = True
    position_x: Optional[float] = 0.0
    position_y: Optional[float] = 0.0


class PersonUpdate(BaseModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    gender: Optional[str] = None
    biography: Optional[str] = None
    occupation: Optional[str] = None
    burial_place: Optional[str] = None
    photo_url: Optional[str] = None
    notify_events: Optional[bool] = None


class PersonPositionUpdate(BaseModel):
    position_x: float
    position_y: float


class PersonResponse(BaseModel):
    id: int
    tree_id: int
    full_name: str
    nickname: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    gender: str
    photo_url: Optional[str] = None
    biography: Optional[str] = None
    occupation: Optional[str] = None
    burial_place: Optional[str] = None
    notify_events: bool = True
    position_x: float
    position_y: float
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Relationship Schemas ──────────────────────────────────────
class RelationshipCreate(BaseModel):
    person1_id: int
    person2_id: int
    relationship_type: str


class RelationshipResponse(BaseModel):
    id: int
    tree_id: int
    person1_id: int
    person2_id: int
    relationship_type: str

    model_config = {"from_attributes": True}


# ── Tree Detail (with persons and relationships) ──────────────
class TreeDetailResponse(BaseModel):
    tree: FamilyTreeResponse
    persons: List[PersonResponse]
    relationships: List[RelationshipResponse]

    model_config = {"from_attributes": True}


# ── Admin Schemas ─────────────────────────────────────────────
class AdminStats(BaseModel):
    total_users: int
    total_trees: int
    total_persons: int
    users_by_plan: dict = {}


class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    plan: Optional[str] = None
    plan_expires_at: Optional[datetime] = None


class UserDetailResponse(UserResponse):
    tree_count: int = 0
    total_members: int = 0
    social_provider: Optional[str] = None


# ── Notification Schemas ──────────────────────────────────────
class NotificationSettingUpdate(BaseModel):
    notify_email: Optional[EmailStr] = None
    notify_phone: Optional[str] = None
    email_enabled: Optional[bool] = None
    zalo_enabled: Optional[bool] = None
    facebook_enabled: Optional[bool] = None
    facebook_psid: Optional[str] = None
    days_before: Optional[int] = None
    active: Optional[bool] = None


class NotificationSettingResponse(BaseModel):
    id: int
    user_id: int
    notify_email: Optional[str] = None
    notify_phone: Optional[str] = None
    email_enabled: bool
    zalo_enabled: bool = False
    facebook_enabled: bool = False
    facebook_psid: Optional[str] = None
    days_before: int
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpcomingEvent(BaseModel):
    person_id: int
    person_name: str
    event_type: str
    event_date: str
    days_until: int
    tree_name: str


class NotificationLogResponse(BaseModel):
    id: int
    user_id: int
    person_id: Optional[int] = None
    event_type: str
    event_date: str
    channel: str
    recipient: str
    success: bool
    error_message: Optional[str] = None
    sent_at: datetime

    model_config = {"from_attributes": True}


# ── Print Order Schemas ───────────────────────────────────────
class PrintOrderCreate(BaseModel):
    tree_id: Optional[int] = None
    tree_name: Optional[str] = None
    template: str
    size: str = "A2"
    recipient_name: str
    phone: str
    address: str
    city: str
    notes: Optional[str] = None


class PrintOrderResponse(BaseModel):
    id: int
    user_id: int
    tree_id: Optional[int] = None
    tree_name: Optional[str] = None
    template: str
    size: str
    status: str
    recipient_name: str
    phone: str
    address: str
    city: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PrintOrderWithUser(PrintOrderResponse):
    username: Optional[str] = None
    user_email: Optional[str] = None


class AdminPrintOrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
