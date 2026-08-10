@echo off
chcp 65001 >nul
title Cài đặt thư viện Hệ thống Quản lý kho KT
echo ===================================================
echo   CAI DAT THU VIEN CHO HE THONG QUAN LY KHO KT
echo ===================================================
echo.

:: Kiem tra lenh py hoac python
set PYTHON_CMD=
py --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
) else (
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python
    ) else (
        echo [LOI] Khong tim thay Python tren he thong!
        echo Vui long cai dat Python 3.10 tro len va check chon "Add Python to PATH".
        pause
        exit /b 1
    )
)

echo [OK] Da tim thay trinh bien dich Python: %PYTHON_CMD%
echo.

echo ===================================================
echo Buoc 1: Cap nhat cong cu quan ly goi (PIP)...
%PYTHON_CMD% -m pip install --upgrade pip

echo.
echo ===================================================
echo Buoc 2: Cai dat cac thu vien cho may chu (backend)...
cd backend
%PYTHON_CMD% -m pip install -r requirements.txt
cd ..

echo.
echo ===================================================
echo Buoc 3: Cai dat cac thu vien phu tro (xu ly Excel)...
%PYTHON_CMD% -m pip install pandas openpyxl

echo.
echo ===================================================
echo [THANH CONG] TREN MAY NAY DA CO DU THU VIEN DE CHAY!
echo ===================================================
pause
