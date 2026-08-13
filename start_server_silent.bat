@echo off
cd /d "%~dp0"

:: Kiem tra Python (py hoac python)
set PYTHON_CMD=
py --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
) else (
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python
    ) else (
        msg * "[LOI] Khong tim thay Python (py/python). Vui long cai dat Python 3.10+"
        exit /b 1
    )
)

:: Cai dat thu vien neu chua co
cd backend
%PYTHON_CMD% -m pip install -r requirements.txt >nul 2>&1
cd ..

:: Kiem tra DB, seed neu chua co
if not exist "backend\data\wms.db" (
    %PYTHON_CMD% -m pip install pandas openpyxl >nul 2>&1
    %PYTHON_CMD% seed_data.py >nul 2>&1
)

:: Chay server, log ra file
cd backend
%PYTHON_CMD% -m uvicorn app.main:app --host 0.0.0.0 --port 8888 > "%~dp0server.log" 2>&1
