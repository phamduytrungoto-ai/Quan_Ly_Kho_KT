from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import models, schemas, auth_utils, database, deps

from sqlalchemy import func

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(request: Request, db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(func.lower(models.User.username) == form_data.username.lower()).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Ghi log đăng nhập
    from ..logger import log_action
    log_action(db, request, user, "Đăng nhập", f"Tài khoản: {user.username}")
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(deps.get_current_user)):
    return current_user

@router.post("/logout")
def logout_user(request: Request, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    from ..logger import log_action
    log_action(db, request, current_user, "Đăng xuất", f"Tài khoản: {current_user.username}")
    return {"message": "Đăng xuất thành công"}

import random
import string
from ..mail_utils import send_otp_email

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(
        (func.lower(models.User.username) == request.username.lower()) | (func.lower(models.User.email) == request.username.lower())
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản này trong hệ thống.")
    if not user.email:
        raise HTTPException(status_code=400, detail="Tài khoản này chưa được thiết lập địa chỉ email để nhận mã OTP.")
        
    # Generate 6 digit OTP
    otp = ''.join(random.choices(string.digits, k=6))
    expire_time = datetime.utcnow() + timedelta(minutes=10)
    
    user.reset_otp = otp
    user.reset_otp_expire = expire_time
    db.commit()
    
    # Send email
    try:
        send_otp_email(user.email, otp)
    except Exception as e:
        # Revert OTP if email fails
        user.reset_otp = None
        user.reset_otp_expire = None
        db.commit()
        raise HTTPException(status_code=500, detail="Không thể gửi email OTP. Vui lòng liên hệ Admin để kiểm tra lại cấu hình Email (SMTP) trong phần Cài đặt hệ thống.")
        
    # partially hide email for security
    hidden_email = user.email[:2] + "***" + user.email[user.email.find("@"):]
    return {"message": f"Mã OTP đã được gửi đến email {hidden_email}. Mã có hiệu lực trong 10 phút."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(
        (func.lower(models.User.username) == request.username.lower()) | (func.lower(models.User.email) == request.username.lower())
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản.")
        
    if not user.reset_otp or user.reset_otp != request.otp:
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác.")
        
    if not user.reset_otp_expire or user.reset_otp_expire < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn.")
        
    # Reset password
    user.hashed_password = auth_utils.get_password_hash(request.new_password)
    user.reset_otp = None
    user.reset_otp_expire = None
    db.commit()
    
    return {"message": "Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."}

@router.post("/change-password")
def change_password(request: schemas.ChangePasswordRequest, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    if not auth_utils.verify_password(request.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không chính xác.")
        
    current_user.hashed_password = auth_utils.get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Đổi mật khẩu thành công!"}
