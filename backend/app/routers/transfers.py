from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from sqlalchemy import desc

from ..database import get_db
from ..models import Transfer, Transaction, Item, TransactionType
from ..schemas import TransferCreate, TransferResponse
from ..deps import check_warehouse_permission, get_allowed_warehouse_ids
from .. import deps
from ..logger import log_action
from sqlalchemy import or_

router = APIRouter(prefix="/api/transfers", tags=["Chuyển kho"])

@router.get("", response_model=List[TransferResponse])
def list_transfers(
    tu_kho_id: Optional[int] = None,
    den_kho_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    if tu_kho_id:
        check_warehouse_permission(current_user, tu_kho_id, "perm_view", db)
    if den_kho_id:
        check_warehouse_permission(current_user, den_kho_id, "perm_view", db)
    
    query = db.query(Transfer).order_by(desc(Transfer.id))
    if tu_kho_id:
        query = query.filter(Transfer.tu_kho_id == tu_kho_id)
    if den_kho_id:
        query = query.filter(Transfer.den_kho_id == den_kho_id)
        
    if not current_user.is_admin:
        allowed = get_allowed_warehouse_ids(current_user, db, "perm_view")
        if not allowed:
            query = query.filter(Transfer.id == -1)
        else:
            query = query.filter(or_(Transfer.tu_kho_id.in_(allowed), Transfer.den_kho_id.in_(allowed)))
            
    return query.all()

@router.post("", response_model=TransferResponse)
def create_transfer(data: TransferCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    if data.tu_kho_id == data.den_kho_id:
        raise HTTPException(status_code=400, detail="Kho xuất và kho nhập phải khác nhau")
        
    # User only needs permission for the source warehouse to create a transfer out
    check_warehouse_permission(current_user, data.tu_kho_id, "perm_add", db)
        
    # Check ma phieu unique
    if db.query(Transfer).filter(Transfer.ma_phieu == data.ma_phieu).first():
        raise HTTPException(status_code=400, detail="Mã phiếu đã tồn tại")
        
    # Create Transfer
    transfer = Transfer(
        ma_phieu=data.ma_phieu,
        ngay_chuyen=data.ngay_chuyen,
        tu_kho_id=data.tu_kho_id,
        den_kho_id=data.den_kho_id,
        nguoi_chuyen=data.nguoi_chuyen,
        ghi_chu=data.ghi_chu
    )
    db.add(transfer)
    db.flush() # To get transfer.id
    
    # Process items
    for item_req in data.items:
        if item_req.so_luong <= 0:
            raise HTTPException(status_code=400, detail="Số lượng chuyển phải > 0")
            
        # Get source item
        src_item = db.query(Item).filter(Item.id == item_req.item_id, Item.kho_id == data.tu_kho_id).first()
        if not src_item:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy sản phẩm id {item_req.item_id} ở kho nguồn")
            
        if src_item.ton_cuoi < item_req.so_luong:
            raise HTTPException(status_code=400, detail=f"Không đủ tồn kho cho {src_item.ten_hang} (Còn {src_item.ton_cuoi})")
            
        # Decrement source
        src_item.tong_xuat += item_req.so_luong
        src_item.ton_cuoi -= item_req.so_luong
        
        # Create Export Transaction
        tx_out = Transaction(
            loai=TransactionType.EXPORT,
            item_id=src_item.id,
            kho_id=data.tu_kho_id,
            transfer_id=transfer.id,
            ngay=data.ngay_chuyen,
            ma_quan_ly=src_item.ma_quan_ly,
            ten_hang=src_item.ten_hang,
            ma_so=src_item.ma_so,
            so_luong=item_req.so_luong,
            don_vi_tinh=src_item.don_vi_tinh,
            nguoi_xuat=data.nguoi_chuyen,
            ghi_chu=data.ghi_chu
        )
        db.add(tx_out)
        
        # Get or create destination item
        dst_item = db.query(Item).filter(Item.ma_so == src_item.ma_so, Item.kho_id == data.den_kho_id).first()
        if not dst_item:
            dst_item = Item(
                ma_quan_ly=src_item.ma_quan_ly,
                ten_hang=src_item.ten_hang,
                ma_so=src_item.ma_so,
                nha_cung_cap=src_item.nha_cung_cap,
                don_gia=src_item.don_gia,
                vi_tri="",
                don_vi_tinh=src_item.don_vi_tinh,
                dinh_muc=src_item.dinh_muc,
                trang_thai=src_item.trang_thai,
                cong_doan=src_item.cong_doan,
                ghi_chu=src_item.ghi_chu,
                hinh_anh=src_item.hinh_anh,
                thong_so_ky_thuat=src_item.thong_so_ky_thuat,
                kho_id=data.den_kho_id,
                ton_dau=0,
                tong_nhap=0,
                tong_xuat=0,
                ton_cuoi=0
            )
            db.add(dst_item)
            db.flush()
            
        # Increment destination
        dst_item.tong_nhap += item_req.so_luong
        dst_item.ton_cuoi += item_req.so_luong
        
        # Create Import Transaction
        tx_in = Transaction(
            loai=TransactionType.IMPORT,
            item_id=dst_item.id,
            kho_id=data.den_kho_id,
            transfer_id=transfer.id,
            ngay=data.ngay_chuyen,
            ma_quan_ly=dst_item.ma_quan_ly,
            ten_hang=dst_item.ten_hang,
            ma_so=dst_item.ma_so,
            so_luong=item_req.so_luong,
            don_vi_tinh=dst_item.don_vi_tinh,
            nguoi_nhap=data.nguoi_chuyen,
            ghi_chu=data.ghi_chu
        )
        db.add(tx_in)
        
    db.commit()
    db.refresh(new_transfer)
    log_action(db, None, current_user, "Tạo lệnh chuyển kho", f"Mã phiếu: {new_transfer.ma_phieu}")
    return new_transfer

@router.get("/{id}")
def get_transfer(id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    transfer = db.query(Transfer).filter(Transfer.id == id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu chuyển")
        
    # Check permission for either source or destination warehouse
    try:
        check_warehouse_permission(current_user, transfer.tu_kho_id, "perm_view", db)
    except HTTPException:
        check_warehouse_permission(current_user, transfer.den_kho_id, "perm_view", db)
    
    # We only take EXPORT transactions to avoid counting items twice (import and export)
    txs = [t for t in transfer.transactions if t.loai == TransactionType.EXPORT]
    
    transactions_list = []
    for tx in txs:
        import_tx = db.query(Transaction).filter(
            Transaction.transfer_id == id,
            Transaction.loai == TransactionType.IMPORT,
            Transaction.ma_so == tx.ma_so
        ).first()
        
        vi_tri_cu = tx.item.vi_tri if tx.item and tx.item.vi_tri else ""
        vi_tri_moi = import_tx.item.vi_tri if import_tx and import_tx.item and import_tx.item.vi_tri else ""
        
        transactions_list.append({
            "ma_so": tx.ma_so,
            "ten_hang": tx.ten_hang,
            "so_luong": tx.so_luong,
            "don_vi_tinh": tx.don_vi_tinh,
            "cong_doan": tx.item.cong_doan if tx.item else "",
            "ghi_chu": tx.ghi_chu,
            "ton_cuoi": tx.item.ton_cuoi if tx.item else 0,
            "dinh_muc": tx.item.dinh_muc if tx.item else 0,
            "vi_tri_cu": vi_tri_cu,
            "vi_tri_moi": vi_tri_moi
        })
    
    return {
        "id": transfer.id,
        "ma_phieu": transfer.ma_phieu,
        "ngay_chuyen": transfer.ngay_chuyen,
        "tu_kho_id": transfer.tu_kho_id,
        "den_kho_id": transfer.den_kho_id,
        "nguoi_chuyen": transfer.nguoi_chuyen,
        "ghi_chu": transfer.ghi_chu,
        "ma_kho": transfer.tu_kho.ma_kho if transfer.tu_kho else "DP-EE",
        "transactions": transactions_list
    }

@router.get("/{id}/export-excel")
def export_transfer_excel(id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    from fastapi.responses import StreamingResponse
    from app.excel_utils import generate_receipt_excel
    import urllib.parse
    
    transfer_data = get_transfer(id, db, current_user)
    
    output = generate_receipt_excel(transfer_data, receipt_type="transfer")
    filename = f"Phieu_Chuyen_{transfer_data['ma_phieu']}.xlsx"
    encoded_filename = urllib.parse.quote(filename)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        }
    )

@router.delete("/{id}")
def delete_transfer(id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    transfer = db.query(Transfer).filter(Transfer.id == id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu chuyển")
        
    # Check permission for the source warehouse to delete
    check_warehouse_permission(current_user, transfer.tu_kho_id, "perm_delete", db)
        
    # Revert inventory for each transaction
    txs = db.query(Transaction).filter(Transaction.transfer_id == id).all()
    for tx in txs:
        item = db.query(Item).filter(Item.id == tx.item_id).first()
        if item:
            if tx.loai == TransactionType.EXPORT:
                item.tong_xuat -= tx.so_luong
                item.ton_cuoi += tx.so_luong
            elif tx.loai == TransactionType.IMPORT:
                item.tong_nhap -= tx.so_luong
                item.ton_cuoi -= tx.so_luong
                
    db.delete(transfer)
    db.commit()
    log_action(db, None, current_user, "Xoá lệnh chuyển kho", f"Mã phiếu: {transfer.ma_phieu}")
    return {"detail": "Đã xóa phiếu chuyển kho và khôi phục tồn kho"}
