@echo off
if "%~1"=="Hidden" goto :run
powershell.exe -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c', '\"\"\"%~f0\"\"\"', 'Hidden' -WindowStyle Hidden"
exit /b

:run
cd /d "%~dp0"
echo Running hidden via powershell... > test_cmd.log
timeout /t 2 /nobreak >> test_cmd.log 2>&1
echo Done >> test_cmd.log
