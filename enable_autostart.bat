@echo off
chcp 65001 >nul 2>&1
title WMS - Bat khoi dong tu dong
color 0A

echo ===================================
echo WMS - BAT KHOI DONG CUNG WINDOWS
echo ===================================
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "PROJECT=%~dp0"

:: Xoa file cu (vbs hoac lnk)
if exist "%STARTUP%\WMS Server.vbs" del "%STARTUP%\WMS Server.vbs"
if exist "%STARTUP%\WMS Server.lnk" del "%STARTUP%\WMS Server.lnk"

:: Tao file VBS launcher bang Python (ho tro Unicode path)
py "%PROJECT%create_startup_shortcut.py"

echo.
echo Da bat khoi dong tu dong thanh cong!
echo.
echo Server se tu chay khi ban dang nhap Windows.
echo Icon W se hien o khay he thong (system tray).
echo.
echo De tat tu khoi dong, chay file: disable_autostart.bat
echo.
pause
