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

def check_warehouse_access(user: models.User, kho_id: int):
    if not kho_id or user.is_admin or getattr(user, 'allowed_kho_ids', '*') == '*':
        return True
    try:
        allowed_str = getattr(user, 'allowed_kho_ids', '')
        if not allowed_str:
            raise HTTPException(status_code=403, detail="Bạn không được phân quyền vào bất kỳ kho nào")
        allowed = [int(x.strip()) for x in allowed_str.split(',') if x.strip().isdigit()]
        if int(kho_id) not in allowed:
            raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập kho này")
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=403, detail="Lỗi phân quyền kho")
    return True

def apply_warehouse_filter(query, model_class, user: models.User, kho_id: Optional[int] = None):
    """Áp dụng filter theo kho, hoặc danh sách kho được phép nếu kho_id = None."""
    if kho_id:
        check_warehouse_access(user, kho_id)
        return query.filter(model_class.kho_id == kho_id)
    
    if user.is_admin or getattr(user, 'allowed_kho_ids', '*') == '*':
        return query
        
    allowed_str = getattr(user, 'allowed_kho_ids', '')
    if not allowed_str:
        return query.filter(model_class.kho_id == -1) # No access
        
    allowed = [int(x.strip()) for x in allowed_str.split(',') if x.strip().isdigit()]
    return query.filter(model_class.kho_id.in_(allowed))
