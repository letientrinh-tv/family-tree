from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    unknown = "unknown"


class RelationshipType(str, enum.Enum):
    parent_child = "parent_child"
    spouse = "spouse"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    social_provider = Column(String, nullable=True)
    social_id = Column(String, nullable=True)
    plan = Column(String, default="free", nullable=False)
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)

    trees = relationship("FamilyTree", back_populates="owner", cascade="all, delete-orphan")
    notification_setting = relationship("NotificationSetting", back_populates="user", uselist=False)


class FamilyTree(Base):
    __tablename__ = "family_trees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="trees")
    persons = relationship("Person", back_populates="tree", cascade="all, delete-orphan")
    relationships = relationship("Relationship", back_populates="tree", cascade="all, delete-orphan")


class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("family_trees.id"), nullable=False)
    full_name = Column(String, nullable=False)
    birth_date = Column(String, nullable=True)
    death_date = Column(String, nullable=True)
    gender = Column(String, default="unknown", nullable=False)
    photo_url = Column(String, nullable=True)
    biography = Column(Text, nullable=True)
    occupation = Column(String, nullable=True)
    burial_place = Column(String, nullable=True)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tree = relationship("FamilyTree", back_populates="persons")
    relationships_as_person1 = relationship(
        "Relationship",
        foreign_keys="Relationship.person1_id",
        back_populates="person1",
        cascade="all, delete-orphan"
    )
    relationships_as_person2 = relationship(
        "Relationship",
        foreign_keys="Relationship.person2_id",
        back_populates="person2",
        cascade="all, delete-orphan"
    )


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    notify_email = Column(String, nullable=True)
    notify_phone = Column(String, nullable=True)   # dùng cho Zalo
    email_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)   # deprecated, giữ để tương thích
    zalo_enabled = Column(Boolean, default=False)
    facebook_enabled = Column(Boolean, default=False)
    facebook_psid = Column(String, nullable=True)  # Facebook Page-Scoped ID
    days_before = Column(Integer, default=7)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="notification_setting")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=True)
    event_type = Column(String, nullable=False)
    event_date = Column(String, nullable=False)
    channel = Column(String, nullable=False)
    recipient = Column(String, nullable=False)
    success = Column(Boolean, default=False)
    error_message = Column(String, nullable=True)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    person = relationship("Person")


class PrintOrder(Base):
    __tablename__ = "print_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tree_id = Column(Integer, ForeignKey("family_trees.id"), nullable=True)
    tree_name = Column(String, nullable=True)
    template = Column(String, nullable=False)
    size = Column(String, default="A2", nullable=False)
    status = Column(String, default="pending", nullable=False)
    recipient_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    tree = relationship("FamilyTree")


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("family_trees.id"), nullable=False)
    person1_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    person2_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    relationship_type = Column(String, nullable=False)

    tree = relationship("FamilyTree", back_populates="relationships")
    person1 = relationship("Person", foreign_keys=[person1_id], back_populates="relationships_as_person1")
    person2 = relationship("Person", foreign_keys=[person2_id], back_populates="relationships_as_person2")
