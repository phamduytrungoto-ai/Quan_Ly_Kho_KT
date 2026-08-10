' WMS Server - Khoi chay voi System Tray icon
' Double-click file nay de chay server ngam voi icon tray
' Click phai icon tray de quan ly server

Set WshShell = CreateObject("WScript.Shell")
scriptDir = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
trayScript = scriptDir & "wms_tray.ps1"

' Chay PowerShell an cua so, load tray script
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & trayScript & """", 0, False

' Doi 2 giay de server khoi dong roi mo trinh duyet
WScript.Sleep 2000
WshShell.Run "http://localhost:8888"

Set WshShell = Nothing
