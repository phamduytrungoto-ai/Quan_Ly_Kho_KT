from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from .database import get_db
from . import models, schemas, auth_utils
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    return current_user

def require_permission(perm: str):
    def permission_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.is_admin:
            return current_user
        
        # Check if user has the specific permission
        has_perm = getattr(current_user, perm, False)
        if not has_perm:
            raise HTTPException(status_code=403, detail=f"User does not have {perm} permission")
        return current_user
    return permission_checker

def check_warehouse_permission(user: models.User, kho_id: int, perm: str, db: Session = None):
    if user.is_admin:
        return True
    
    if not db:
        raise HTTPException(status_code=500, detail="Database session required for permission check")

    permission = db.query(models.UserWarehousePermission).filter(
        models.UserWarehousePermission.user_id == user.id,
        models.UserWarehousePermission.warehouse_id == kho_id
    ).first()
    
    if not permission:
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập kho này.")
        
    has_perm = getattr(permission, perm, False)
    if not has_perm:
        raise HTTPException(status_code=403, detail=f"Bạn không có quyền thực hiện thao tác này tại kho được chọn.")
    return True

def get_allowed_warehouse_ids(user: models.User, db: Session, perm: str = 'perm_view'):
    if user.is_admin:
        return '*'
    perms = db.query(models.UserWarehousePermission).filter(
        models.UserWarehousePermission.user_id == user.id
    ).all()
    allowed = [p.warehouse_id for p in perms if getattr(p, perm, False)]
    return allowed

def check_warehouse_access(user: models.User, kho_id: int, db: Session):
    if not kho_id or user.is_admin:
        return True
    check_warehouse_permission(user, kho_id, 'perm_view', db)
    return True

def apply_warehouse_filter(query, model_class, user: models.User, db: Session, kho_id: Optional[int] = None):
    """Áp dụng filter theo kho."""
    if kho_id:
        check_warehouse_access(user, kho_id, db)
        return query.filter(model_class.kho_id == kho_id)
    
    if user.is_admin:
        return query
        
    allowed = get_allowed_warehouse_ids(user, db, 'perm_view')
    if not allowed:
        return query.filter(model_class.kho_id == -1) # No access
        
    return query.filter(model_class.kho_id.in_(allowed))
