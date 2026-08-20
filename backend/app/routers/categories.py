"""
API endpoints for Categories (Danh mục) management.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from .. import deps
from ..database import get_db
from ..models import Category
from ..schemas import CategoryCreate, CategoryResponse
from ..logger import log_action

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
def create_category(data: CategoryCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_admin)):
    """Tạo danh mục mới."""
    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    log_action(db, None, current_user, "Thêm danh mục", f"Tên: {cat.gia_tri}")
    return cat


@router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(cat_id: int, data: CategoryCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_admin)):
    """Cập nhật danh mục."""
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")
    for key, value in data.model_dump().items():
        setattr(cat, key, value)
    db.commit()
    db.refresh(cat)
    log_action(db, None, current_user, "Cập nhật danh mục", f"ID: {cat.id}")
    return cat


@router.delete("/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_admin)):
    """Xoá danh mục."""
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")
    db.delete(cat)
    db.commit()
    log_action(db, None, current_user, "Xoá danh mục", f"Tên: {cat.gia_tri}")
    return {"message": "Đã xoá danh mục"}
