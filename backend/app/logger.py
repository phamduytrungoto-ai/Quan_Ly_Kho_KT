from sqlalchemy.orm import Session
from fastapi import Request
from .models import ActionLog, User

def log_action(db: Session, request: Request, user: User, action: str, details: str = ""):
    """
    Ghi nhận lịch sử thao tác của người dùng.
    """
    ip_address = ""
    if request:
        ip_address = request.client.host if request.client else ""

    log_entry = ActionLog(
        user_id=user.id if user else None,
        username=user.username if user else "System",
        action=action,
        details=details,
        ip_address=ip_address
    )
    db.add(log_entry)
    db.commit()
