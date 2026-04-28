from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/print-orders", tags=["print-orders"])


@router.post("", response_model=schemas.PrintOrderResponse)
def create_order(
    order: schemas.PrintOrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_order = models.PrintOrder(**order.model_dump(), user_id=current_user.id)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("", response_model=List[schemas.PrintOrderResponse])
def get_my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.PrintOrder)
        .filter(models.PrintOrder.user_id == current_user.id)
        .order_by(models.PrintOrder.created_at.desc())
        .all()
    )
