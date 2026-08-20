import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app.database import SessionLocal
from backend.app.models import User
from backend.app.auth_utils import get_password_hash

db = SessionLocal()
try:
    gkm = db.query(User).filter(User.username == 'GKM0000673').first()
    if gkm:
        gkm.username = 'GKM000673'
        gkm.hashed_password = get_password_hash('ThuyLinh0108')
        
    db.commit()
    print("Changed GKM0000673 to GKM000673 and pw to ThuyLinh0108")
finally:
    db.close()
