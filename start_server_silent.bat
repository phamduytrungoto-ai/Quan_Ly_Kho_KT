@echo off
cd /d "%~dp0"

:: Kiem tra Python
py --version >nul 2>&1
if %errorlevel% neq 0 (
    msg * "[LOI] Khong tim thay Python. Vui long cai dat Python 3.10+"
    exit /b 1
)

:: Cai dat thu vien neu chua co
cd backend
py -m pip install -r requirements.txt >nul 2>&1
cd ..

:: Kiem tra DB, seed neu chua co
if not exist "backend\data\wms.db" (
    py -m pip install pandas openpyxl >nul 2>&1
    py seed_data.py >nul 2>&1
)

:: Chay server, log ra file
cd backend
py -m uvicorn app.main:app --host 0.0.0.0 --port 8888 > "%~dp0server.log" 2>&1
