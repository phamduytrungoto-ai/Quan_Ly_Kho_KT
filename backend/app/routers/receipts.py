from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from typing import Optional
from datetime import date

from .. import deps
from ..deps import apply_warehouse_filter, check_warehouse_access, check_warehouse_permission
from ..logger import log_action
from ..database import get_db
from ..models import Item, Transaction, Receipt, TransactionType
from ..schemas import ReceiptCreate, ReceiptResponse, ReceiptListResponse

router = APIRouter(prefix="/api/receipts", tags=["receipts"])

def generate_receipt_code(db: Session, prefix: str = "PN"):
    today_str = date.today().strftime("%Y%m%d")
    base = f"{prefix}-{today_str}-"
    last_receipt = db.query(Receipt).filter(Receipt.ma_phieu.like(f"{base}%")).order_by(desc(Receipt.ma_phieu)).first()
    if not last_receipt:
        return f"{base}001"
    try:
        num = int(last_receipt.ma_phieu.split("-")[-1])
        return f"{base}{num+1:03d}"
    except:
        return f"{base}001"

@router.get("", response_model=ReceiptListResponse)
def list_receipts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    kho_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    query = db.query(Receipt)
    query = apply_warehouse_filter(query, Receipt, current_user, db, kho_id)
    
    if search:
        search_lower = search.lower()
        query = query.filter(
            or_(
                func.lower(Receipt.ma_phieu).contains(search_lower),
                func.lower(Receipt.nguoi_nhap).contains(search_lower)
            )
        )
        
    if from_date:
        query = query.filter(Receipt.ngay_nhap >= from_date)
    if to_date:
        query = query.filter(Receipt.ngay_nhap <= to_date)
        
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    receipts = query.order_by(desc(Receipt.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "receipts": receipts,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.post("", response_model=ReceiptResponse)
def create_receipt(receipt: ReceiptCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    if not receipt.items:
        raise HTTPException(status_code=400, detail="Phiếu nhập phải có ít nhất 1 mặt hàng")
    check_warehouse_permission(current_user, receipt.kho_id, "perm_add", db)
        
    ma_phieu = generate_receipt_code(db)
    
    new_receipt = Receipt(
        ma_phieu=ma_phieu,
        ngay_nhap=receipt.ngay_nhap,
        nguoi_nhap=receipt.nguoi_nhap,
        ghi_chu=receipt.ghi_chu,
        kho_id=receipt.kho_id
    )
    db.add(new_receipt)
    db.flush() # get id
    
    for req_item in receipt.items:
        item = db.query(Item).filter(Item.id == req_item.item_id, Item.kho_id == receipt.kho_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy vật tư ID {req_item.item_id} trong kho này")
            
        trans = Transaction(
            loai=TransactionType.IMPORT,
            item_id=item.id,
            receipt_id=new_receipt.id,
            ngay=receipt.ngay_nhap,
            ma_quan_ly=item.ma_quan_ly,
            ten_hang=item.ten_hang,
            ma_so=item.ma_so,
            so_luong=req_item.so_luong,
            don_vi_tinh=item.don_vi_tinh,
            cong_doan=item.cong_doan,
            nguoi_nhap=receipt.nguoi_nhap,
            trang_thai="Có kiểm kê",
            ghi_chu=req_item.ghi_chu,
            kho_id=receipt.kho_id
        )
        db.add(trans)
        
        # update item
        item.tong_nhap += req_item.so_luong
        item.ton_cuoi += req_item.so_luong
        
    db.commit()
    db.refresh(new_receipt)
    log_action(db, None, current_user, "Tạo phiếu nhập", f"Mã phiếu: {ma_phieu}, Kho ID: {receipt.kho_id}")
    return new_receipt

@router.get("/{id}")
def get_receipt(id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    receipt = db.query(Receipt).filter(Receipt.id == id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập")
        
    check_warehouse_permission(current_user, receipt.kho_id, "perm_view", db)
    
    return {
        "id": receipt.id,
        "ma_phieu": receipt.ma_phieu,
        "ngay_nhap": receipt.ngay_nhap,
        "nguoi_nhap": receipt.nguoi_nhap,
        "ghi_chu": receipt.ghi_chu,
        "kho_id": receipt.kho_id,
        "ma_kho": receipt.warehouse.ma_kho if receipt.warehouse else "DP-EE",
        "transactions": [
            {
                "ma_so": tx.ma_so,
                "ten_hang": tx.ten_hang,
                "so_luong": tx.so_luong,
                "don_vi_tinh": tx.don_vi_tinh,
                "cong_doan": tx.item.cong_doan if tx.item else "",
                "ghi_chu": tx.ghi_chu,
                "ton_cuoi": tx.item.ton_cuoi if tx.item else 0,
                "dinh_muc": tx.item.dinh_muc if tx.item else 0
            } for tx in receipt.transactions
        ]
    }

@router.get("/{id}/export-excel")
def export_receipt_excel(id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    from fastapi.responses import StreamingResponse
    from app.excel_utils import generate_receipt_excel
    import urllib.parse
    
    receipt_data = get_receipt(id, db, current_user)
    
    output = generate_receipt_excel(receipt_data, receipt_type="receipt")
    filename = f"Phieu_Nhap_{receipt_data['ma_phieu']}.xlsx"
    encoded_filename = urllib.parse.quote(filename)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        }
    )

@router.delete("/{id}")
def delete_receipt(id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    receipt = db.query(Receipt).filter(Receipt.id == id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập")
    check_warehouse_permission(current_user, receipt.kho_id, "perm_delete", db)
        
    for trans in receipt.transactions:
        item = db.query(Item).filter(Item.id == trans.item_id).first()
        if item:
            item.tong_nhap -= trans.so_luong
            item.ton_cuoi -= trans.so_luong
            
    db.delete(receipt)
    db.commit()
    log_action(db, None, current_user, "Xóa phiếu nhập", f"Mã phiếu: {receipt.ma_phieu}")
    return {"detail": "Đã xóa phiếu nhập và cập nhật tồn kho"}
