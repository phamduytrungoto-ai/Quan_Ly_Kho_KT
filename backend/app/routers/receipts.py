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
from ..schemas import ReceiptCreate, ReceiptResponse, ReceiptListResponse, ReceiptUpdate

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
    log_action(db, None, current_user, "Tạo phiếu nhập", f"Mã phiếu: {ma_phieu}, Kho ID: {receipt.kho_id}, Gồm {len(receipt.items)} mặt hàng, Tổng SL: {sum(i.so_luong for i in receipt.items)}")
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
                "item_id": tx.item_id,
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

@router.put("/{id}", response_model=ReceiptResponse)
def update_receipt(id: int, receipt: ReceiptUpdate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    # Check permissions
    check_warehouse_permission(current_user, receipt.kho_id, "perm_edit", db)
    
    old_receipt = db.query(Receipt).filter(Receipt.id == id).first()
    if not old_receipt:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập")
        
    if old_receipt.kho_id != receipt.kho_id:
        raise HTTPException(status_code=400, detail="Không được thay đổi kho của phiếu")

    # 1. Rollback old transactions
    for trans in old_receipt.transactions:
        item = db.query(Item).filter(Item.id == trans.item_id, Item.kho_id == old_receipt.kho_id).first()
        if item:
            item.tong_nhap -= trans.so_luong
            item.ton_cuoi -= trans.so_luong
            
    # Calculate changes for logging
    changes = []
    if old_receipt.ngay_nhap != receipt.ngay_nhap:
        changes.append(f"Ngày: {old_receipt.ngay_nhap}->{receipt.ngay_nhap}")
    if (old_receipt.nguoi_nhap or '') != (receipt.nguoi_nhap or ''):
        changes.append(f"Ng.nhập: '{old_receipt.nguoi_nhap}'->'{receipt.nguoi_nhap}'")
    if (old_receipt.ghi_chu or '') != (receipt.ghi_chu or ''):
        changes.append(f"Ghi chú: '{old_receipt.ghi_chu}'->'{receipt.ghi_chu}'")

    old_items_dict = {t.item_id: t for t in old_receipt.transactions}
    new_items_dict = {req.item_id: req for req in receipt.items}

    for item_id, old_t in old_items_dict.items():
        if item_id not in new_items_dict:
            changes.append(f"Xóa VT {old_t.ma_so}")
    
    # 2. Delete old transactions (they will be recreated)
    db.query(Transaction).filter(Transaction.receipt_id == id).delete()

    # 3. Update header
    old_receipt.ngay_nhap = receipt.ngay_nhap
    old_receipt.nguoi_nhap = receipt.nguoi_nhap
    old_receipt.ghi_chu = receipt.ghi_chu
    
    # 4. Create new transactions & apply to inventory
    for req_item in receipt.items:
        item = db.query(Item).filter(Item.id == req_item.item_id, Item.kho_id == receipt.kho_id).first()
        if not item:
            # If item not found, rollback the whole transaction automatically by throwing error
            raise HTTPException(status_code=404, detail=f"Không tìm thấy vật tư ID {req_item.item_id}")
            
        # Log item changes
        if req_item.item_id not in old_items_dict:
            changes.append(f"Thêm VT {item.ma_so} (SL: {req_item.so_luong})")
        else:
            old_t = old_items_dict[req_item.item_id]
            item_changes = []
            if old_t.so_luong != req_item.so_luong:
                item_changes.append(f"SL {old_t.so_luong}->{req_item.so_luong}")
            if (old_t.ghi_chu or '') != (req_item.ghi_chu or ''):
                item_changes.append(f"Ghi chú '{old_t.ghi_chu}'->'{req_item.ghi_chu}'")
            if item_changes:
                changes.append(f"VT {item.ma_so}: " + ", ".join(item_changes))
            
        trans = Transaction(
            loai=TransactionType.IMPORT,
            item_id=item.id,
            receipt_id=old_receipt.id,
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
    db.refresh(old_receipt)
    
    change_detail = "; ".join(changes) if changes else "Không thay đổi"
    log_action(db, None, current_user, "Sửa phiếu nhập", f"Mã phiếu: {old_receipt.ma_phieu}. {change_detail}")
    return old_receipt

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
    log_action(db, None, current_user, "Xóa phiếu nhập", f"Mã phiếu: {receipt.ma_phieu}, Gồm {len(receipt.transactions)} mặt hàng, Tổng SL: {sum(t.so_luong for t in receipt.transactions)}")
    return {"detail": "Đã xóa phiếu nhập và cập nhật tồn kho"}
