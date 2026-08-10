from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Setting
from ..schemas import SettingResponse, SettingUpdate
from ..deps import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Cài đặt"])

def require_admin(current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Chỉ có Admin mới có quyền thực hiện.")
    return current_user

@router.get("", response_model=List[SettingResponse])
def get_all_settings(db: Session = Depends(get_db), _ = Depends(require_admin)):
    """Lấy danh sách tất cả các cài đặt."""
    return db.query(Setting).all()

@router.put("/{key}", response_model=SettingResponse)
def update_setting(key: str, data: SettingUpdate, db: Session = Depends(get_db), _ = Depends(require_admin)):
    """Cập nhật một cài đặt."""
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        # Nếu chưa có thì tạo mới (upsert behavior)
        setting = Setting(key=key, value=data.value)
        db.add(setting)
    else:
        setting.value = data.value
    
    db.commit()
    db.refresh(setting)
    return setting
