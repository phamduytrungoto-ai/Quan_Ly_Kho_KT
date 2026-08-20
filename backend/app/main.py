"""
FastAPI application entry point for WMS (Warehouse Management System).
Serves both the API and the frontend static files.
"""
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db, SessionLocal
from .routers import inventory, transactions, categories, reports, receipts, issues, auth, users, settings, warehouses, transfers, logs
from . import models, auth_utils
from .scheduler import run_scheduler
import asyncio

# Create FastAPI app
app = FastAPI(
    title="Há»‡ thá»‘ng Quáº£n lÃ½ Kho",
    description="WMS - Warehouse Management System",
    version="1.0.0",
)

# CORS - allow all origins for LAN access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(inventory.router)
app.include_router(transactions.router)
app.include_router(receipts.router)
app.include_router(issues.router)
app.include_router(categories.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(warehouses.router)
app.include_router(transfers.router)
app.include_router(logs.router)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()
    
    # Create default admin user if not exists
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            hashed_pw = auth_utils.get_password_hash("admin")
            admin_user = models.User(
                username="admin",
                hashed_password=hashed_pw,
                full_name="Administrator",
                role="Admin",
                is_admin=True,
                perm_view=True,
                perm_add=True,
                perm_edit=True,
                perm_delete=True,
                perm_approve=True,
                perm_print=True,
                perm_excel=True
            )
            db.add(admin_user)
            db.commit()
            print("Created default admin user: admin / admin")
    finally:
        db.close()
        
    print("Database initialized")
    
    # Start the background email scheduler
    asyncio.create_task(run_scheduler())
    print("Email scheduler started")
    
    print("WMS Server is running!")

# Serve frontend static files
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "frontend")

# Mount static assets
if os.path.exists(os.path.join(FRONTEND_DIR, "css")):
    app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
if os.path.exists(os.path.join(FRONTEND_DIR, "js")):
    app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")

# Mount uploads directory
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "items"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Serve index.html for the root URL
@app.get("/")
def serve_frontend():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not found. Place index.html in /frontend/"}

# Serve user guide
@app.get("/guide")
@app.get("/api/guide")
def serve_guide():
    guide_path = os.path.join(FRONTEND_DIR, "..", "HUONG_DAN_SU_DUNG.html")
    if os.path.exists(guide_path):
        return FileResponse(guide_path)
    return {"message": "Guide not found."}
