@echo off
chcp 65001 >nul
title Kiem tra loi he thong WMS
color 0E
echo ===================================================
echo   CHUONG TRINH TU DONG KIEM TRA LOI TREN MAY NAY
echo ===================================================
echo.
echo 1. Dang kiem tra file server.log...
if exist "server.log" (
    echo [Co file server.log] - Dang hien thi 15 dong loi cuoi cung:
    echo ---------------------------------------------------
    powershell -Command "Get-Content server.log -Tail 15"
    echo ---------------------------------------------------
) else (
    echo [Khong tim thay file server.log]
)

echo.
echo 2. Dang thu chay truc tiep de xem loi (Neu co)...
echo ---------------------------------------------------
cd backend
py -m uvicorn app.main:app --host 0.0.0.0 --port 8888
if %errorlevel% neq 0 (
    echo.
    echo Thu lai voi lenh python...
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8888
)
echo ---------------------------------------------------
echo.
echo Neu ban thay dong chu mau do o tren, hay chup hinh lai!
pause
