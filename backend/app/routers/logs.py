from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func
from typing import Optional
from datetime import date

from ..database import get_db
from ..models import ActionLog
from ..deps import get_current_admin

router = APIRouter(prefix="/api/logs", tags=["Logs"])

@router.get("")
def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    query = db.query(ActionLog)
    
    if search:
        search_lower = search.lower()
        query = query.filter(
            or_(
                func.lower(ActionLog.username).contains(search_lower),
                func.lower(ActionLog.action).contains(search_lower),
                func.lower(ActionLog.details).contains(search_lower)
            )
        )
        
    if from_date:
        query = query.filter(func.date(ActionLog.created_at) >= from_date)
    if to_date:
        query = query.filter(func.date(ActionLog.created_at) <= to_date)
        
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    logs = query.order_by(desc(ActionLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "username": log.username,
                "action": log.action,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else None
            } for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
