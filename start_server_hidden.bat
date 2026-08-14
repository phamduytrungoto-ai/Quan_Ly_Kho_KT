@echo off
chcp 65001 >nul
title Khởi động WMS Server

echo Dang khoi dong server (chay ngam kem bieu tuong Tray)...
:: Khoi dong server ngam bang PowerShell (WindowStyle Hidden)
start "" /B powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0wms_tray.ps1"

:: Doi 2 giay de server san sang roi mo trinh duyet
timeout /t 2 /nobreak >nul
start http://localhost:8888
