from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, auth_utils, database, deps
from ..logger import log_action

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db), current_admin: models.User = Depends(deps.get_current_admin)):
    return db.query(models.User).all()

@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db), current_admin: models.User = Depends(deps.get_current_admin)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth_utils.get_password_hash(user.password)
    user_dict = user.model_dump()
    permissions_data = user_dict.pop("permissions", None)
    del user_dict["password"]
    
    db_user = models.User(**user_dict, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    if permissions_data is not None:
        for perm in permissions_data:
            new_perm = models.UserWarehousePermission(user_id=db_user.id, **perm)
            db.add(new_perm)
        db.commit()
        db.refresh(db_user)
        
    log_action(db, None, current_admin, "Tạo người dùng", f"Tài khoản: {db_user.username}, Tên: {db_user.full_name}")
    return db_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(database.get_db), current_admin: models.User = Depends(deps.get_current_admin)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user.model_dump(exclude_unset=True)
    permissions_data = update_data.pop("permissions", None)
    
    if "password" in update_data:
        update_data["hashed_password"] = auth_utils.get_password_hash(update_data.pop("password"))
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    if permissions_data is not None:
        # Delete old permissions
        db.query(models.UserWarehousePermission).filter(models.UserWarehousePermission.user_id == db_user.id).delete()
        # Add new permissions
        for perm in permissions_data:
            new_perm = models.UserWarehousePermission(user_id=db_user.id, **perm)
            db.add(new_perm)
            
    db.commit()
    db.refresh(db_user)
    log_action(db, None, current_admin, "Cập nhật người dùng", f"Tài khoản: {db_user.username}, Tên: {db_user.full_name}")
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_admin: models.User = Depends(deps.get_current_admin)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete default admin user")
        
    db.delete(db_user)
    db.commit()
    log_action(db, None, current_admin, "Xóa người dùng", f"Tài khoản: {db_user.username}")
    return {"message": "User deleted successfully"}
