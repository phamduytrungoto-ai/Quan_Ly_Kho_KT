@echo off
title WMS - Stop Server
color 0C

echo ===================================
echo WMS - DANG DONG SERVER...
echo ===================================
echo.

echo Dang tim va tat tien trinh dang chay o port 8888...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8888" ^| find "LISTENING"') do (
    echo Phat hien tien trinh PID: %%a
    taskkill /F /PID %%a
)

echo.
echo ===================================
echo DA TAT SERVER THANH CONG!
echo ===================================
echo.
pause
