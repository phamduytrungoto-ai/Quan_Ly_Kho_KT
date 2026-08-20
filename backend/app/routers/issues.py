from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from typing import Optional
from datetime import date

from .. import deps
from ..deps import apply_warehouse_filter, check_warehouse_access, check_warehouse_permission
from ..logger import log_action
from ..database import get_db
from ..models import Item, Transaction, Issue, TransactionType
from ..schemas import IssueCreate, IssueResponse, IssueListResponse

router = APIRouter(prefix="/api/issues", tags=["issues"])

def generate_issue_code(db: Session, prefix: str = "PX"):
    today_str = date.today().strftime("%Y%m%d")
    base = f"{prefix}-{today_str}-"
    last_issue = db.query(Issue).filter(Issue.ma_phieu.like(f"{base}%")).order_by(desc(Issue.ma_phieu)).first()
    if not last_issue:
        return f"{base}001"
    try:
        num = int(last_issue.ma_phieu.split("-")[-1])
        return f"{base}{num+1:03d}"
    except:
        return f"{base}001"

@router.get("", response_model=IssueListResponse)
def list_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    kho_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    query = db.query(Issue)
    query = apply_warehouse_filter(query, Issue, current_user, db, kho_id)
    
    if search:
        search_lower = search.lower()
        query = query.filter(
            or_(
                func.lower(Issue.ma_phieu).contains(search_lower),
                func.lower(Issue.nguoi_yeu_cau).contains(search_lower),
                func.lower(Issue.nguoi_xuat).contains(search_lower)
            )
        )
        
    if from_date:
        query = query.filter(Issue.ngay_xuat >= from_date)
    if to_date:
        query = query.filter(Issue.ngay_xuat <= to_date)
        
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    issues = query.order_by(desc(Issue.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "issues": issues,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.post("", response_model=IssueResponse)
def create_issue(issue: IssueCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    if not issue.items:
        raise HTTPException(status_code=400, detail="Phiếu xuất phải có ít nhất 1 mặt hàng")
    check_warehouse_permission(current_user, issue.kho_id, "perm_add", db)
        
    ma_phieu = generate_issue_code(db)
    
    new_issue = Issue(
        ma_phieu=ma_phieu,
        ngay_xuat=issue.ngay_xuat,
        nguoi_yeu_cau=issue.nguoi_yeu_cau,
        nguoi_xuat=issue.nguoi_xuat,
        loai_xuat=issue.loai_xuat,
        ghi_chu=issue.ghi_chu,
        kho_id=issue.kho_id
    )
    db.add(new_issue)
    db.flush() # get id
    
    for req_item in issue.items:
        item = db.query(Item).filter(Item.id == req_item.item_id, Item.kho_id == issue.kho_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy vật tư ID {req_item.item_id} trong kho này")
            
        if item.ton_cuoi < req_item.so_luong:
            raise HTTPException(status_code=400, detail=f"Mặt hàng {item.ten_hang} không đủ tồn kho (Còn {item.ton_cuoi})")
            
        trans = Transaction(
            loai=TransactionType.EXPORT,
            item_id=item.id,
            issue_id=new_issue.id,
            ngay=issue.ngay_xuat,
            ma_quan_ly=item.ma_quan_ly,
            ten_hang=item.ten_hang,
            ma_so=item.ma_so,
            so_luong=req_item.so_luong,
            don_vi_tinh=item.don_vi_tinh,
            cong_doan=req_item.cong_doan,
            nguoi_yeu_cau=issue.nguoi_yeu_cau,
            nguoi_nhan=req_item.nguoi_nhan,
            nguoi_xuat=issue.nguoi_xuat,
            trang_thai="Có kiểm kê",
            loai_xuat=req_item.loai_xuat,
            ghi_chu=req_item.ghi_chu,
            kho_id=issue.kho_id
        )
        db.add(trans)
        
        # update item
        item.tong_xuat += req_item.so_luong
        item.ton_cuoi -= req_item.so_luong
        
    db.commit()
    db.refresh(new_issue)
    log_action(db, None, current_user, "Tạo phiếu xuất", f"Mã phiếu: {ma_phieu}, Kho ID: {issue.kho_id}")
    return new_issue

@router.get("/{id}")
def get_issue(id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất")
        
    check_warehouse_permission(current_user, issue.kho_id, "perm_view", db)
    
    return {
        "id": issue.id,
        "ma_phieu": issue.ma_phieu,
        "ngay_xuat": issue.ngay_xuat,
        "nguoi_yeu_cau": issue.nguoi_yeu_cau,
        "nguoi_xuat": issue.nguoi_xuat,
        "loai_xuat": issue.loai_xuat,
        "ghi_chu": issue.ghi_chu,
        "kho_id": issue.kho_id,
        "ma_kho": issue.warehouse.ma_kho if issue.warehouse else "DP-EE",
        "transactions": [
            {
                "ma_so": tx.ma_so,
                "ten_hang": tx.ten_hang,
                "so_luong": tx.so_luong,
                "don_vi_tinh": tx.don_vi_tinh,
                "cong_doan": tx.cong_doan,
                "loai_xuat": tx.loai_xuat,
                "nguoi_nhan": tx.nguoi_nhan,
                "ghi_chu": tx.ghi_chu,
                "ton_cuoi": tx.item.ton_cuoi if tx.item else 0,
                "dinh_muc": tx.item.dinh_muc if tx.item else 0
            } for tx in issue.transactions
        ]
    }

@router.get("/{id}/export-excel")
def export_issue_excel(id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    from fastapi.responses import StreamingResponse
    from app.excel_utils import generate_receipt_excel
    import urllib.parse
    
    # Re-use get_issue logic to get the formatted dictionary
    issue_data = get_issue(id, db, current_user)
    
    output = generate_receipt_excel(issue_data, receipt_type="issue")
    filename = f"Phieu_Xuat_{issue_data['ma_phieu']}.xlsx"
    
    # URL encode filename for safe header transmission
    encoded_filename = urllib.parse.quote(filename)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        }
    )

@router.delete("/{id}")
def delete_issue(id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất")
    check_warehouse_permission(current_user, issue.kho_id, "perm_delete", db)
        
    for trans in issue.transactions:
        item = db.query(Item).filter(Item.id == trans.item_id).first()
        if item:
            item.tong_xuat -= trans.so_luong
            item.ton_cuoi += trans.so_luong
            
    db.delete(issue)
    db.commit()
    log_action(db, None, current_user, "Xóa phiếu xuất", f"Mã phiếu: {issue.ma_phieu}")
    return {"detail": "Đã xóa phiếu xuất và cập nhật tồn kho"}
