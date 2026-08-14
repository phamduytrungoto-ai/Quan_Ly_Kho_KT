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

:: ===================================================
:: Cau hinh Proxy mang cong ty (Sharp)
:: Neu may tinh khong dung proxy, cac dong nay se khong anh huong.
:: ===================================================
set HTTP_PROXY=http://proxy-asia.global.sharp:3080
set HTTPS_PROXY=http://proxy-asia.global.sharp:3080
set NO_PROXY=localhost,127.0.0.1,10.*,172.16.*,172.25.*,192.168.*,*.local

echo [INFO] Da cau hinh proxy: %HTTP_PROXY%
echo.

echo ===================================================
echo Buoc 1: Cap nhat cong cu quan ly goi (PIP)...
%PYTHON_CMD% -m pip install --upgrade pip --proxy %HTTP_PROXY%

echo.
echo ===================================================
echo Buoc 2: Cai dat cac thu vien cho may chu (backend)...
cd backend
%PYTHON_CMD% -m pip install -r requirements.txt --proxy %HTTP_PROXY%
if %errorlevel% neq 0 (
    echo.
    echo [CANH BAO] Cai dat qua proxy that bai, thu lai KHONG proxy...
    %PYTHON_CMD% -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [LOI] Khong the cai dat cac thu vien trong requirements.txt!
        echo Vui long kiem tra lai ket noi mang hoac loi hien thi ben tren.
        cd ..
        pause
        exit /b 1
    )
)
cd ..

echo.
echo ===================================================
echo Buoc 3: Cai dat cac thu vien phu tro (xu ly Excel)...
%PYTHON_CMD% -m pip install pandas openpyxl --proxy %HTTP_PROXY%
if %errorlevel% neq 0 (
    echo.
    echo [CANH BAO] Cai dat qua proxy that bai, thu lai KHONG proxy...
    %PYTHON_CMD% -m pip install pandas openpyxl
    if %errorlevel% neq 0 (
        echo [LOI] Khong the cai dat pandas va openpyxl!
        echo Vui long kiem tra lai ket noi mang hoac loi hien thi ben tren.
        pause
        exit /b 1
    )
)

echo.
echo ===================================================
echo [THANH CONG] TREN MAY NAY DA CO DU THU VIEN DE CHAY!
echo ===================================================
pause
