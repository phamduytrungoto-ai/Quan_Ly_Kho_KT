from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Warehouse, Item
from ..schemas import WarehouseCreate, WarehouseUpdate, WarehouseResponse
from ..deps import get_current_admin
from ..logger import log_action

router = APIRouter(prefix="/api/warehouses", tags=["Kho"])

@router.get("", response_model=List[WarehouseResponse])
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@router.post("", response_model=WarehouseResponse)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    # Check duplicate
    existing = db.query(Warehouse).filter(Warehouse.ma_kho == warehouse.ma_kho).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mã kho đã tồn tại")
        
    db_wh = Warehouse(**warehouse.dict())
    db.add(db_wh)
    db.commit()
    db.refresh(db_wh)
    log_action(db, None, current_user, "Thêm kho mới", f"Mã kho: {db_wh.ma_kho}, Tên: {db_wh.ten_kho}")
    return db_wh

@router.put("/{id}", response_model=WarehouseResponse)
def update_warehouse(id: int, warehouse: WarehouseUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    db_wh = db.query(Warehouse).filter(Warehouse.id == id).first()
    if not db_wh:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    
    if warehouse.ma_kho:
        existing = db.query(Warehouse).filter(Warehouse.ma_kho == warehouse.ma_kho, Warehouse.id != id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Mã kho đã tồn tại")

    update_data = warehouse.dict(exclude_unset=True)
    
    # Reset last sent date if any email configuration is changed so it can trigger again based on the new settings
    if any(k in update_data for k in ["email_schedule_time", "email_enabled", "email_recipients"]):
        db_wh.email_last_sent_date = ""

    for key, value in update_data.items():
        setattr(db_wh, key, value)
    
    db.commit()
    db.refresh(db_wh)
    log_action(db, None, current_user, "Cập nhật thông tin kho", f"Mã kho: {db_wh.ma_kho}, Tên: {db_wh.ten_kho}")
    return db_wh

@router.delete("/{id}")
def delete_warehouse(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    if id == 1:
        raise HTTPException(status_code=400, detail="Không thể xóa Kho Tổng mặc định")
    db_wh = db.query(Warehouse).filter(Warehouse.id == id).first()
    if not db_wh:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    
    # Check if there are items in this warehouse
    items_count = db.query(Item).filter(Item.kho_id == id).count()
    if items_count > 0:
        raise HTTPException(status_code=400, detail="Không thể xóa kho đang có hàng tồn")
        
    db.delete(db_wh)
    db.commit()
    log_action(db, None, current_user, "Xoá kho", f"Mã kho: {db_wh.ma_kho}, Tên: {db_wh.ten_kho}")
    return {"detail": "Đã xóa kho thành công"}
