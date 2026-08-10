"""
API endpoints for Categories (Danh mục) management.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..deps import require_permission
from ..database import get_db
from ..models import Category
from ..schemas import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Danh mục"])


@router.get("")
def list_categories(
    loai: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Lấy danh mục theo loại."""
    query = db.query(Category)
    if loai:
        query = query.filter(Category.loai == loai)
    categories = query.order_by(Category.thu_tu, Category.gia_tri).all()
    return [CategoryResponse.model_validate(c) for c in categories]


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), _=Depends(require_permission("perm_add"))):
    """Tạo danh mục mới."""
    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(cat_id: int, data: CategoryCreate, db: Session = Depends(get_db), _=Depends(require_permission("perm_edit"))):
    """Cập nhật danh mục."""
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")
    for key, value in data.model_dump().items():
        setattr(cat, key, value)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db), _=Depends(require_permission("perm_delete"))):
    """Xoá danh mục."""
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")
    db.delete(cat)
    db.commit()
    return {"message": "Đã xoá danh mục"}
