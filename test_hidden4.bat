@echo off
if "%~1"=="Hidden" goto :run
set "vbs=%temp%\hide_bat.vbs"
echo Set objShell = WScript.CreateObject("WScript.Shell") > "%vbs%"
echo objShell.Run "cmd /c """"%~dps0test_hidden4.bat"" Hidden""", 0, False >> "%vbs%"
wscript "%vbs%"
del "%vbs%"
exit /b

:run
cd /d "%~dps0"
echo Running hidden via short path! > test_cmd.log
timeout /t 2 /nobreak >> test_cmd.log 2>&1
echo Done >> test_cmd.log
