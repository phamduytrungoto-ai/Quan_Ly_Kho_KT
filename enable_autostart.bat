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

:: Tao file VBS launcher bang Python (ho tro Unicode path)
%PYTHON_CMD% "%PROJECT%create_startup_shortcut.py"

echo.
echo Da bat khoi dong tu dong thanh cong!
echo.
echo Server se tu chay khi ban dang nhap Windows.
echo Icon W se hien o khay he thong (system tray).
echo.
echo De tat tu khoi dong, chay file: disable_autostart.bat
echo.
pause
