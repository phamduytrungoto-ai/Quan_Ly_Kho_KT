@echo off
title WMS - Tat khoi dong tu dong
color 0C

echo ===================================
echo WMS - TAT KHOI DONG CUNG WINDOWS
echo ===================================
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

if exist "%STARTUP%\WMS Server.vbs" (
    del "%STARTUP%\WMS Server.vbs"
    echo Da xoa khoi dong tu dong thanh cong!
) else (
    echo Khoi dong tu dong chua duoc bat.
)

if exist "%STARTUP%\WMS Server.lnk" (
    del "%STARTUP%\WMS Server.lnk"
    echo Da xoa shortcut cu.
)

echo.
pause
