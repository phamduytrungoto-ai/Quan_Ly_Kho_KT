"""
API endpoints for Inventory (Tá»“n kho) management.
"""
import math
import os
import shutil
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from sqlalchemy import or_, func, literal_column

from .. import deps
from ..deps import apply_warehouse_filter, check_warehouse_access, check_warehouse_permission
from ..database import get_db
from ..logger import log_action
from ..models import Item, Transaction
from ..schemas import (
    ItemCreate, ItemUpdate, ItemResponse,
    ItemListResponse,
)

router = APIRouter(prefix="/api/items", tags=["Tá»“n kho"])


@router.get("", response_model=ItemListResponse)
def list_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    ma_quan_ly: Optional[str] = None,
    trang_thai: Optional[str] = None,
    cong_doan: Optional[str] = None,
    sort_by: Optional[str] = "id",
    sort_dir: Optional[str] = "asc",
    low_stock: Optional[bool] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    kho_id: Optional[int] = None,
    loai_vat_tu: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    """Lấy danh sách tồn kho với phân trang, tìm kiếm, lọc."""
    query = db.query(Item)
    query = apply_warehouse_filter(query, Item, current_user, db, kho_id)

    # Search
    if search:
        search_lower = search.lower()
        query = query.filter(
            or_(
                func.lower(Item.ten_hang).contains(search_lower),
                func.lower(Item.ma_so).contains(search_lower),
                func.lower(Item.vi_tri).contains(search_lower),
                func.lower(Item.ma_quan_ly).contains(search_lower),
            )
        )

    # Filters
    if loai_vat_tu:
        query = query.filter(Item.loai_vat_tu == loai_vat_tu)
        
    if ma_quan_ly:
        query = query.filter(Item.ma_quan_ly == ma_quan_ly)
    if trang_thai:
        query = query.filter(Item.trang_thai == trang_thai)
    if cong_doan:
        query = query.filter(func.lower(Item.cong_doan).contains(cong_doan.lower()))
    if low_stock:
        query = query.filter(Item.ton_cuoi <= Item.dinh_muc)

    # Count
    total = query.count()

    # Sort
    sort_column = getattr(Item, sort_by, Item.id)
    if sort_dir == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)

    # Paginate
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    # Dynamic calculation if dates are provided
    results = []
    if from_date or to_date:
        item_ids = [item.id for item in items]
        if item_ids:
            # Query transactions for these items
            tx_query = db.query(
                Transaction.item_id,
                Transaction.loai,
                func.sum(Transaction.so_luong).label('total'),
                (Transaction.ngay < from_date).label('is_before') if from_date else literal_column("0").label('is_before')
            ).filter(Transaction.item_id.in_(item_ids))

            if to_date:
                tx_query = tx_query.filter(Transaction.ngay <= to_date)
            
            from sqlalchemy import literal_column
            tx_query = tx_query.group_by(
                Transaction.item_id, 
                Transaction.loai,
                (Transaction.ngay < from_date) if from_date else literal_column("0")
            ).all()

            # Group transactions
            tx_map = {}
            for row in tx_query:
                i_id, loai, total, is_before = row
                if i_id not in tx_map:
                    tx_map[i_id] = {'nhap_before': 0, 'xuat_before': 0, 'nhap_in': 0, 'xuat_in': 0}
                if is_before:
                    if loai == 'NHAP': tx_map[i_id]['nhap_before'] += total
                    elif loai == 'XUAT': tx_map[i_id]['xuat_before'] += total
                else:
                    if loai == 'NHAP': tx_map[i_id]['nhap_in'] += total
                    elif loai == 'XUAT': tx_map[i_id]['xuat_in'] += total

            for item in items:
                stats = tx_map.get(item.id, {'nhap_before': 0, 'xuat_before': 0, 'nhap_in': 0, 'xuat_in': 0})
                
                dyn_ton_dau = item.ton_dau + stats['nhap_before'] - stats['xuat_before']
                dyn_nhap = stats['nhap_in']
                dyn_xuat = stats['xuat_in']
                dyn_ton_cuoi = dyn_ton_dau + dyn_nhap - dyn_xuat

                # Create response object and override values
                resp = ItemResponse.model_validate(item)
                resp.ton_dau = dyn_ton_dau
                resp.tong_nhap = dyn_nhap
                resp.tong_xuat = dyn_xuat
                resp.ton_cuoi = dyn_ton_cuoi
                results.append(resp)
        else:
            results = [ItemResponse.model_validate(item) for item in items]
    else:
        results = [ItemResponse.model_validate(item) for item in items]

    return ItemListResponse(
        items=results,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/all")
def list_all_items(
    search: Optional[str] = None,
    kho_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    """Lấy tất cả items (cho autocomplete). Trả về id, ten_hang, ma_so, don_vi_tinh, ton_cuoi."""
    query = db.query(Item.id, Item.ten_hang, Item.ma_so, Item.don_vi_tinh, Item.ton_cuoi, Item.ma_quan_ly)
    
    query = apply_warehouse_filter(query, Item, current_user, db, kho_id)
    
    if search:
        search_lower = search.lower()
        query = query.filter(
            or_(
                func.lower(Item.ten_hang).contains(search_lower),
                func.lower(Item.ma_so).contains(search_lower),
            )
        )
    items = query.order_by(Item.ten_hang).all()
    return [
        {
            "id": i.id,
            "ten_hang": i.ten_hang,
            "ma_so": i.ma_so,
            "don_vi_tinh": i.don_vi_tinh,
            "ton_cuoi": i.ton_cuoi,
            "ma_quan_ly": i.ma_quan_ly,
        }
        for i in items
    ]


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Khong tim thay Item")
    check_warehouse_permission(current_user, item.kho_id, "perm_view", db)
    return item


@router.post("", response_model=ItemResponse, status_code=201)
def create_item(data: ItemCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    check_warehouse_permission(current_user, data.kho_id, "perm_add", db)
    # Check if duplicate in the same warehouse
    kho_id = data.kho_id if data.kho_id else 1
    existing = db.query(Item).filter(
        Item.ma_so == data.ma_so,
        Item.kho_id == kho_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Mặt hàng với mã số {data.ma_so} đã tồn tại trong kho này."
        )
    new_item = Item(**data.model_dump())
    new_item.ton_cuoi = new_item.ton_dau
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    log_action(db, None, current_user, "Thêm hàng hóa", f"Mã quản lý: {new_item.ma_quan_ly}, Mã số: {new_item.ma_so}")
    return new_item


@router.put("/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, data: ItemUpdate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    check_warehouse_permission(current_user, item.kho_id, "perm_edit", db)

    if data.ma_so:
        existing = db.query(Item).filter(
            Item.ma_so == data.ma_so, 
            Item.kho_id == item.kho_id,
            Item.id != item_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Mã số {data.ma_so} đã được sử dụng cho một mặt hàng khác trong kho này."
            )

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    log_action(db, None, current_user, "Cập nhật hàng hóa", f"ID: {item.id}, Mã: {item.ma_so}")
    return item


@router.delete("/{item_id}")
def delete_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    check_warehouse_permission(current_user, item.kho_id, "perm_delete", db)

    # Check if there are transactions
    has_transactions = db.query(Transaction).filter(Transaction.item_id == item_id).first() is not None
    if has_transactions:
        raise HTTPException(status_code=400, detail="Cannot delete item with transaction history")

    db.delete(item)
    db.commit()
    log_action(db, None, current_user, "Xóa hàng hóa", f"Mã: {item.ma_so}")
    return {"message": "Deleted successfully"}

@router.post("/{item_id}/image")
def upload_item_image(
    item_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    check_warehouse_permission(current_user, item.kho_id, "perm_edit", db)

    # Validate file type
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid image format. Allowed: JPG, PNG, GIF, WEBP")

    # Create uploads directory if not exists
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "uploads", "items")
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    # Update item model to support multiple images
    old_image_data = item.hinh_anh
    images = []
    if old_image_data:
        try:
            images = json.loads(old_image_data)
            if not isinstance(images, list):
                images = [old_image_data] # Fallback for legacy single string
        except:
            images = [old_image_data] # Fallback for legacy single string
    
    new_url = f"/uploads/items/{unique_filename}"
    images.append(new_url)
    item.hinh_anh = json.dumps(images)
    db.commit()

    return {"message": "Image uploaded successfully", "url": new_url, "images": images}

@router.post("/import")
async def import_excel(
    file: UploadFile = File(...),
    kho_id: int = Query(1),
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    check_warehouse_permission(current_user, kho_id, "perm_add", db)
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file Excel (.xlsx, .xls)")
        
    import pandas as pd
    import io
    
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file Excel: {str(e)}")
        
    success_count = 0
    skip_count = 0
    
    for index, row in df.iterrows():
        ma_so = str(row.get('Mã số', '')).strip()
        if not ma_so or ma_so == 'nan':
            ma_so = str(row.get('Part No.', '')).strip()
        if not ma_so or ma_so == 'nan':
            continue
            
        ten_hang = str(row.get('Tên hàng', '')).strip()
        if ten_hang == 'nan': ten_hang = ''
        
        # Check existing
        existing = db.query(Item).filter(Item.ma_so == ma_so, Item.kho_id == kho_id).first()
        if existing:
            skip_count += 1
            continue
            
        try:
            ton_dau = int(float(row.get('Tồn kho', 0)))
        except:
            ton_dau = 0
            
        new_item = Item(
            ma_so=ma_so,
            ten_hang=ten_hang,
            kho_id=kho_id,
            ton_dau=ton_dau,
            ton_cuoi=ton_dau,
            ma_quan_ly=str(row.get('Mã quản lý', '')).replace('nan', ''),
            don_vi_tinh=str(row.get('ĐVT', 'PCS')).replace('nan', ''),
            vi_tri=str(row.get('Vị trí', '')).replace('nan', ''),
            ghi_chu=str(row.get('Ghi chú', '')).replace('nan', '')
        )
        db.add(new_item)
        success_count += 1
        
    db.commit()
    log_action(db, None, current_user, "Nhập tồn kho từ Excel", f"Kho ID: {kho_id}, Thành công: {success_count}, Bỏ qua: {skip_count}")
    
    return {"message": f"Nhập thành công {success_count} mã hàng, bỏ qua {skip_count} mã hàng"}
