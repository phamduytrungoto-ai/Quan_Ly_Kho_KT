import os, sys

tray_script = r'D:\DP\Nghiên cứu\Quản lý kho KT\wms_tray.ps1'
workdir = r'D:\DP\Nghiên cứu\Quản lý kho KT'
startup_dir = os.path.join(os.environ['APPDATA'], r'Microsoft\Windows\Start Menu\Programs\Startup')

# Clean up old files
for ext in ['.lnk', '.vbs']:
    old = os.path.join(startup_dir, f'WMS Server{ext}')
    if os.path.exists(old):
        os.remove(old)

# Create .vbs launcher content
DQ = '"'
lines = [
    "' WMS Server - Auto start with Windows",
    "Dim objShell",
    f'Set objShell = CreateObject({DQ}WScript.Shell{DQ})',
    f'objShell.CurrentDirectory = {DQ}{workdir}{DQ}',
    f'objShell.Run {DQ}powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File {DQ}{DQ}{tray_script}{DQ}{DQ}{DQ}, 0, False',
    "Set objShell = Nothing",
]
vbs_content = "\r\n".join(lines)

startup_vbs = os.path.join(startup_dir, 'WMS Server.vbs')
# Write as UTF-16LE with BOM (VBScript natively reads this encoding)
with open(startup_vbs, 'wb') as f:
    f.write(b'\xff\xfe')  # UTF-16LE BOM
    f.write(vbs_content.encode('utf-16-le'))

# Verify
if os.path.exists(startup_vbs):
    content = open(startup_vbs, 'rb').read()
    test = 'Nghiên cứu'.encode('utf-16-le')
    if test in content:
        sys.stdout.buffer.write(b'SUCCESS: Unicode path verified in VBS file!\n')
    else:
        sys.stdout.buffer.write(b'WARNING: Unicode path may be corrupted\n')
else:
    sys.stdout.buffer.write(b'FAILED: File was not created\n')
