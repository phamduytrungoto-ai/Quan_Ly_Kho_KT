import os, sys

# Xac dinh thu muc hien tai dong (giup chay duoc tren may moi ma khong bi sai duong dan)
workdir = os.path.dirname(os.path.abspath(__file__))
tray_script = os.path.join(workdir, 'wms_tray.ps1')
startup_dir = os.path.join(os.environ['APPDATA'], r'Microsoft\Windows\Start Menu\Programs\Startup')

# Clean up old files
for ext in ['.lnk', '.vbs', '.bat']:
    old = os.path.join(startup_dir, f'WMS Server{ext}')
    if os.path.exists(old):
        try: os.remove(old)
        except: pass

# Bat content (chay ngam PowerShell ma khong dung VBS)
bat_content = f'''@echo off
chcp 65001 >nul
cd /d "{workdir}"
start "" /B powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "{tray_script}"
'''

startup_bat = os.path.join(startup_dir, 'WMS Server.bat')
with open(startup_bat, 'w', encoding='utf-8') as f:
    f.write(bat_content)

print('SUCCESS: Created startup bat file!')
