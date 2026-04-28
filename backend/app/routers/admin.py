from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_admin
from ..plans import PLAN_LIMITS, get_plan

router = APIRouter(prefix="/api/admin", tags=["admin"])

VALID_PLANS = list(PLAN_LIMITS.keys())
VALID_ROLES = ["admin", "user"]


def _enrich_user(user: models.User, db: Session) -> schemas.UserDetailResponse:
    tree_count = db.query(models.FamilyTree).filter(models.FamilyTree.user_id == user.id).count()
    total_members = (
        db.query(models.Person)
        .join(models.FamilyTree, models.Person.tree_id == models.FamilyTree.id)
        .filter(models.FamilyTree.user_id == user.id)
        .count()
    )
    data = schemas.UserDetailResponse.model_validate(user)
    data.tree_count = tree_count
    data.total_members = total_members
    return data


@router.get("/users", response_model=List[schemas.UserDetailResponse])
def list_users(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return [_enrich_user(u, db) for u in users]


@router.get("/users/{user_id}", response_model=schemas.UserDetailResponse)
def get_user(
    user_id: int,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _enrich_user(user, db)


@router.put("/users/{user_id}", response_model=schemas.UserDetailResponse)
def update_user(
    user_id: int,
    data: schemas.AdminUserUpdate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.role is not None:
        if data.role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail=f"Role phải là: {VALID_ROLES}")
        if user.id == current_user.id and data.role != "admin":
            raise HTTPException(status_code=400, detail="Không thể tự bỏ quyền admin của mình")
        user.role = data.role

    if data.is_active is not None:
        if user.id == current_user.id and not data.is_active:
            raise HTTPException(status_code=400, detail="Không thể tự khóa tài khoản của mình")
        user.is_active = data.is_active

    if data.plan is not None:
        if data.plan not in VALID_PLANS:
            raise HTTPException(status_code=400, detail=f"Plan phải là: {VALID_PLANS}")
        user.plan = data.plan
        if data.plan != "free" and data.plan_expires_at is None:
            user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=365)
        elif data.plan == "free":
            user.plan_expires_at = None

    if data.plan_expires_at is not None:
        user.plan_expires_at = data.plan_expires_at

    db.commit()
    db.refresh(user)
    return _enrich_user(user, db)


@router.put("/users/{user_id}/toggle", response_model=schemas.UserDetailResponse)
def toggle_user(
    user_id: int,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Không thể tự khóa tài khoản của mình")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return _enrich_user(user, db)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Không thể xóa tài khoản của mình")
    db.delete(user)
    db.commit()


@router.get("/trees", response_model=List[schemas.FamilyTreeWithOwner])
def list_all_trees(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    trees = db.query(models.FamilyTree).order_by(models.FamilyTree.created_at.desc()).all()
    result = []
    for tree in trees:
        person_count = db.query(models.Person).filter(models.Person.tree_id == tree.id).count()
        owner = db.query(models.User).filter(models.User.id == tree.user_id).first()
        tree_data = schemas.FamilyTreeWithOwner.model_validate(tree)
        tree_data.person_count = person_count
        tree_data.owner_username = owner.username if owner else None
        result.append(tree_data)
    return result


@router.get("/stats", response_model=schemas.AdminStats)
def get_stats(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(models.User).count()
    total_trees = db.query(models.FamilyTree).count()
    total_persons = db.query(models.Person).count()

    users_by_plan = {}
    for plan in VALID_PLANS:
        users_by_plan[plan] = db.query(models.User).filter(models.User.plan == plan).count()

    return schemas.AdminStats(
        total_users=total_users,
        total_trees=total_trees,
        total_persons=total_persons,
        users_by_plan=users_by_plan,
    )


@router.get("/plans")
def get_plans():
    return PLAN_LIMITS


@router.get("/print-orders", response_model=List[schemas.PrintOrderWithUser])
def list_print_orders(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(models.PrintOrder)
        .order_by(models.PrintOrder.created_at.desc())
        .all()
    )
    result = []
    for o in orders:
        data = schemas.PrintOrderWithUser.model_validate(o)
        data.username = o.user.username if o.user else None
        data.user_email = o.user.email if o.user else None
        result.append(data)
    return result


@router.put("/print-orders/{order_id}", response_model=schemas.PrintOrderWithUser)
def update_print_order(
    order_id: int,
    update: schemas.AdminPrintOrderUpdate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order = db.query(models.PrintOrder).filter(models.PrintOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    if update.status is not None:
        order.status = update.status
    if update.notes is not None:
        order.notes = update.notes
    db.commit()
    db.refresh(order)
    data = schemas.PrintOrderWithUser.model_validate(order)
    data.username = order.user.username if order.user else None
    data.user_email = order.user.email if order.user else None
    return data
