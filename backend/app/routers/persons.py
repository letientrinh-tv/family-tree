import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..plans import get_plan

router = APIRouter(tags=["persons"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_tree_and_check_access(tree_id: int, current_user: models.User, db: Session) -> models.FamilyTree:
    tree = db.query(models.FamilyTree).filter(models.FamilyTree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    if tree.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return tree


def get_person_and_check_access(person_id: int, current_user: models.User, db: Session) -> models.Person:
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    tree = db.query(models.FamilyTree).filter(models.FamilyTree.id == person.tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    if tree.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return person


# ── Person Endpoints ──────────────────────────────────────────
@router.post("/api/trees/{tree_id}/persons", response_model=schemas.PersonResponse, status_code=status.HTTP_201_CREATED)
def add_person(
    tree_id: int,
    person_data: schemas.PersonCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_tree_and_check_access(tree_id, current_user, db)

    plan = get_plan(current_user.plan)
    member_count = db.query(models.Person).filter(models.Person.tree_id == tree_id).count()
    if member_count >= plan["members_per_tree"]:
        raise HTTPException(
            status_code=403,
            detail=f"Gói '{plan['label']}' chỉ cho phép tối đa {plan['members_per_tree']} thành viên/cây. "
                   f"Hiện có {member_count} thành viên. Vui lòng nâng cấp gói."
        )

    new_person = models.Person(
        tree_id=tree_id,
        full_name=person_data.full_name,
        birth_date=person_data.birth_date,
        death_date=person_data.death_date,
        gender=person_data.gender or "unknown",
        biography=person_data.biography,
        occupation=person_data.occupation,
        burial_place=person_data.burial_place,
        position_x=person_data.position_x or 0.0,
        position_y=person_data.position_y or 0.0,
    )
    db.add(new_person)
    db.commit()
    db.refresh(new_person)
    return new_person


@router.put("/api/persons/{person_id}", response_model=schemas.PersonResponse)
def update_person(
    person_id: int,
    person_data: schemas.PersonUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    person = get_person_and_check_access(person_id, current_user, db)

    update_fields = person_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(person, field, value)

    db.commit()
    db.refresh(person)
    return person


@router.delete("/api/persons/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_person(
    person_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    person = get_person_and_check_access(person_id, current_user, db)
    db.delete(person)
    db.commit()


@router.post("/api/persons/{person_id}/photo", response_model=schemas.PersonResponse)
async def upload_photo(
    person_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    person = get_person_and_check_access(person_id, current_user, db)

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Save file
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    # Delete old photo if exists
    if person.photo_url:
        old_path = person.photo_url.lstrip("/")
        if os.path.exists(old_path):
            os.remove(old_path)

    person.photo_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(person)
    return person


@router.put("/api/persons/{person_id}/position", response_model=schemas.PersonResponse)
def update_position(
    person_id: int,
    position_data: schemas.PersonPositionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    person = get_person_and_check_access(person_id, current_user, db)
    person.position_x = position_data.position_x
    person.position_y = position_data.position_y
    db.commit()
    db.refresh(person)
    return person


# ── Relationship Endpoints ────────────────────────────────────
@router.post("/api/trees/{tree_id}/relationships", response_model=schemas.RelationshipResponse, status_code=status.HTTP_201_CREATED)
def add_relationship(
    tree_id: int,
    rel_data: schemas.RelationshipCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_tree_and_check_access(tree_id, current_user, db)

    # Validate persons exist in this tree
    p1 = db.query(models.Person).filter(
        models.Person.id == rel_data.person1_id,
        models.Person.tree_id == tree_id
    ).first()
    p2 = db.query(models.Person).filter(
        models.Person.id == rel_data.person2_id,
        models.Person.tree_id == tree_id
    ).first()

    if not p1 or not p2:
        raise HTTPException(status_code=404, detail="One or both persons not found in this tree")

    if rel_data.person1_id == rel_data.person2_id:
        raise HTTPException(status_code=400, detail="Cannot create relationship with same person")

    # Check for duplicate
    existing = db.query(models.Relationship).filter(
        models.Relationship.tree_id == tree_id,
        models.Relationship.person1_id == rel_data.person1_id,
        models.Relationship.person2_id == rel_data.person2_id,
        models.Relationship.relationship_type == rel_data.relationship_type,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Relationship already exists")

    new_rel = models.Relationship(
        tree_id=tree_id,
        person1_id=rel_data.person1_id,
        person2_id=rel_data.person2_id,
        relationship_type=rel_data.relationship_type,
    )
    db.add(new_rel)
    db.commit()
    db.refresh(new_rel)
    return new_rel


@router.delete("/api/relationships/{rel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relationship(
    rel_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rel = db.query(models.Relationship).filter(models.Relationship.id == rel_id).first()
    if not rel:
        raise HTTPException(status_code=404, detail="Relationship not found")

    tree = db.query(models.FamilyTree).filter(models.FamilyTree.id == rel.tree_id).first()
    if not tree or (tree.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(rel)
    db.commit()
