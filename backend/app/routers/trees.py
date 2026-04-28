from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..plans import get_plan

router = APIRouter(prefix="/api/trees", tags=["trees"])


@router.get("", response_model=List[schemas.FamilyTreeResponse])
def list_trees(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trees = db.query(models.FamilyTree).filter(models.FamilyTree.user_id == current_user.id).all()
    result = []
    for tree in trees:
        person_count = db.query(models.Person).filter(models.Person.tree_id == tree.id).count()
        tree_data = schemas.FamilyTreeResponse.model_validate(tree)
        tree_data.person_count = person_count
        result.append(tree_data)
    return result


@router.post("", response_model=schemas.FamilyTreeResponse, status_code=status.HTTP_201_CREATED)
def create_tree(
    tree_data: schemas.FamilyTreeCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = get_plan(current_user.plan)
    tree_count = db.query(models.FamilyTree).filter(models.FamilyTree.user_id == current_user.id).count()
    if tree_count >= plan["trees"]:
        raise HTTPException(
            status_code=403,
            detail=f"Gói '{plan['label']}' chỉ cho phép tối đa {plan['trees']} cây gia phả. "
                   f"Vui lòng nâng cấp gói để tạo thêm."
        )

    new_tree = models.FamilyTree(
        name=tree_data.name,
        description=tree_data.description,
        user_id=current_user.id,
    )
    db.add(new_tree)
    db.commit()
    db.refresh(new_tree)
    result = schemas.FamilyTreeResponse.model_validate(new_tree)
    result.person_count = 0
    return result


@router.get("/{tree_id}", response_model=schemas.TreeDetailResponse)
def get_tree(
    tree_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tree = db.query(models.FamilyTree).filter(models.FamilyTree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    if tree.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    persons = db.query(models.Person).filter(models.Person.tree_id == tree_id).all()
    relationships = db.query(models.Relationship).filter(models.Relationship.tree_id == tree_id).all()

    person_count = len(persons)
    tree_resp = schemas.FamilyTreeResponse.model_validate(tree)
    tree_resp.person_count = person_count

    return schemas.TreeDetailResponse(
        tree=tree_resp,
        persons=[schemas.PersonResponse.model_validate(p) for p in persons],
        relationships=[schemas.RelationshipResponse.model_validate(r) for r in relationships],
    )


@router.put("/{tree_id}", response_model=schemas.FamilyTreeResponse)
def update_tree(
    tree_id: int,
    tree_data: schemas.FamilyTreeUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tree = db.query(models.FamilyTree).filter(models.FamilyTree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    if tree.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    if tree_data.name is not None:
        tree.name = tree_data.name
    if tree_data.description is not None:
        tree.description = tree_data.description

    db.commit()
    db.refresh(tree)
    result = schemas.FamilyTreeResponse.model_validate(tree)
    result.person_count = db.query(models.Person).filter(models.Person.tree_id == tree.id).count()
    return result


@router.delete("/{tree_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tree(
    tree_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tree = db.query(models.FamilyTree).filter(models.FamilyTree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    if tree.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(tree)
    db.commit()
