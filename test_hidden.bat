@echo off
if "%~1"=="Hidden" goto :run
set "vbs=%temp%\hide_bat.vbs"
echo Set objShell = WScript.CreateObject("WScript.Shell") > "%vbs%"
echo objShell.Run "cmd /c """"%~f0"" Hidden""", 0, False >> "%vbs%"
wscript "%vbs%"
del "%vbs%"
exit /b

:run
echo Running hidden... > test_cmd.log
timeout /t 2 /nobreak >> test_cmd.log 2>&1
echo Done >> test_cmd.log
