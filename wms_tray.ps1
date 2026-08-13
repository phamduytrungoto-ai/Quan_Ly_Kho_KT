# ============================================================
# WMS Server - System Tray Manager
# Hien thi icon tray, quan ly server ngam
# ============================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- Duong dan ---
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:scriptDir = $scriptDir
$script:backendDir = Join-Path $scriptDir "backend"
$backendDir = $script:backendDir
$logFile = Join-Path $scriptDir "server.log"
$script:logFile = $logFile
$reqFile = Join-Path $backendDir "requirements.txt"
$dbFile = Join-Path $backendDir "data\wms.db"
$vbsPath = Join-Path $scriptDir "start_server_hidden.vbs"
$trayScript = Join-Path $scriptDir "wms_tray.ps1"
Out-File -FilePath "$scriptDir\tray_error.log" -InputObject "Started tray in scriptDir: $scriptDir" -Append
$startupLink = [System.IO.Path]::Combine($env:APPDATA, 'Microsoft\Windows\Start Menu\Programs\Startup\WMS Server.vbs')

# --- Tao icon 16x16 bang System.Drawing ---
function New-TrayIcon {
    $bmp = New-Object System.Drawing.Bitmap(16, 16)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Nen xanh emerald tron
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))
    $g.FillEllipse($brush, 0, 0, 15, 15)

    # Vien ngoai
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(5, 150, 105), 1)
    $g.DrawEllipse($pen, 0, 0, 15, 15)

    # Chu "W" trang
    $font = New-Object System.Drawing.Font("Arial", 7, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, 16, 16)
    $g.DrawString("W", $font, [System.Drawing.Brushes]::White, $rect, $sf)

    $g.Dispose()
    $hIcon = $bmp.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)
    return $icon
}

# --- Tao icon offline (do) ---
function New-OfflineIcon {
    $bmp = New-Object System.Drawing.Bitmap(16, 16)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239, 68, 68))
    $g.FillEllipse($brush, 0, 0, 15, 15)

    $font = New-Object System.Drawing.Font("Arial", 7, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, 16, 16)
    $g.DrawString("W", $font, [System.Drawing.Brushes]::White, $rect, $sf)

    $g.Dispose()
    $hIcon = $bmp.GetHicon()
    return [System.Drawing.Icon]::FromHandle($hIcon)
}

# --- Kiem tra shortcut Startup da ton tai chua ---
function Test-AutoStart {
    return (Test-Path $startupLink)
}

# --- Tao / Xoa launcher Startup ---
function Set-AutoStart {
    param([bool]$Enable)
    # Clean up old formats
    $oldVbs = [System.IO.Path]::Combine($env:APPDATA, 'Microsoft\Windows\Start Menu\Programs\Startup\WMS Server.vbs')
    $oldLnk = [System.IO.Path]::Combine($env:APPDATA, 'Microsoft\Windows\Start Menu\Programs\Startup\WMS Server.lnk')
    if (Test-Path $oldLnk) { Remove-Item $oldLnk -Force }
    if ($Enable) {
        # Create .vbs file with UTF-16LE BOM (VBScript reads this encoding natively, preserving Unicode paths)
        $DQ = '"'
        $content = "' WMS Server - Auto start with Windows`r`n"
        $content += "Dim objShell`r`n"
        $content += "Set objShell = CreateObject(${DQ}WScript.Shell${DQ})`r`n"
        $content += "objShell.CurrentDirectory = ${DQ}$scriptDir${DQ}`r`n"
        $content += "objShell.Run ${DQ}powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ${DQ}${DQ}$trayScript${DQ}${DQ}${DQ}, 0, False`r`n"
        $content += "Set objShell = Nothing`r`n"
        $bytes = [System.Text.Encoding]::Unicode.GetPreamble() + [System.Text.Encoding]::Unicode.GetBytes($content)
        [System.IO.File]::WriteAllBytes($oldVbs, $bytes)
    } else {
        if (Test-Path $oldVbs) {
            Remove-Item $oldVbs -Force
        }
    }
}

# --- Tim lenh Python (py hoac python) ---
$script:pythonCmd = "py"
try {
    $null = & py --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "py not found" }
} catch {
    try {
        $null = & python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $script:pythonCmd = "python"
        } else {
            # Thu tim trong cac duong dan pho bien
            $commonPaths = @(
                "$env:LOCALAPPDATA\Programs\Python\Python*\python.exe",
                "C:\Python*\python.exe",
                "C:\Program Files\Python*\python.exe"
            )
            $found = $false
            foreach ($pattern in $commonPaths) {
                $matches = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($matches) {
                    $script:pythonCmd = $matches.FullName
                    $found = $true
                    break
                }
            }
            if (-not $found) {
                Out-File -FilePath (Join-Path $scriptDir "tray_error.log") -InputObject "FATAL: Khong tim thay Python (py/python) tren he thong!" -Append
                [System.Windows.Forms.MessageBox]::Show("Khong tim thay Python tren he thong!`nVui long cai dat Python 3.10+ va chon 'Add to PATH'.", "WMS Server - Loi", "OK", "Error")
                exit 1
            }
        }
    } catch {
        Out-File -FilePath (Join-Path $scriptDir "tray_error.log") -InputObject "FATAL: Khong tim thay Python - $($_.Exception.Message)" -Append
        [System.Windows.Forms.MessageBox]::Show("Khong tim thay Python tren he thong!`nVui long cai dat Python 3.10+ va chon 'Add to PATH'.", "WMS Server - Loi", "OK", "Error")
        exit 1
    }
}
$pythonCmd = $script:pythonCmd
Out-File -FilePath (Join-Path $scriptDir "tray_error.log") -InputObject "Python command: $pythonCmd" -Append

# --- Cai dat thu vien (lan dau) ---
if (Test-Path $reqFile) {
    Start-Process -FilePath $pythonCmd -ArgumentList "-m pip install -q -r `"$reqFile`"" -WindowStyle Hidden -Wait
}

# --- Seed DB neu lan dau ---
if (-not (Test-Path $dbFile)) {
    Start-Process -FilePath $pythonCmd -ArgumentList "-m pip install -q pandas openpyxl" -WindowStyle Hidden -Wait
    Start-Process -FilePath $pythonCmd -ArgumentList "seed_data.py" -WorkingDirectory $scriptDir -WindowStyle Hidden -Wait
}

# --- Giai phong port 8888 truoc khi chay (de phong mo nhieu lan) ---
$connections = netstat -aon 2>$null | Select-String ":8888.*LISTENING"
foreach ($c in $connections) {
    $pid_num = ($c -split '\s+')[-1]
    if ($pid_num -match '^\d+$') { Stop-Process -Id $pid_num -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1

# --- Chay server lan dau
$script:serverProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c cd /d `"$($script:backendDir)`" && `"$($script:pythonCmd)`" -m uvicorn app.main:app --host 0.0.0.0 --port 8888 > `"$($script:logFile)`" 2>&1" `
    -WindowStyle Hidden -PassThru

# --- System Tray Icon ---
$script:onlineIcon = New-TrayIcon
$script:offlineIcon = New-OfflineIcon

$script:notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$script:notifyIcon.Icon = $script:onlineIcon
$script:notifyIcon.Text = "WMS Server - Dang chay`nhttp://localhost:8888"
$script:notifyIcon.Visible = $true

# --- Context Menu ---
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip
$contextMenu.RenderMode = [System.Windows.Forms.ToolStripRenderMode]::System

# Trang thai
$menuStatus = New-Object System.Windows.Forms.ToolStripMenuItem
$menuStatus.Text = "WMS Server dang chay"
$menuStatus.Image = $null
$menuStatus.Enabled = $false
$menuStatus.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
[void]$contextMenu.Items.Add($menuStatus)

[void]$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

# Mo trinh duyet
$menuBrowser = New-Object System.Windows.Forms.ToolStripMenuItem
$menuBrowser.Text = "Mo trinh duyet  (localhost:8888)"
$menuBrowser.Add_Click({ Start-Process "http://localhost:8888" })
[void]$contextMenu.Items.Add($menuBrowser)

# Xem log
$menuLog = New-Object System.Windows.Forms.ToolStripMenuItem
$menuLog.Text = "Xem Server Log"
$menuLog.Add_Click({
    if (Test-Path $script:logFile) {
        Start-Process "notepad.exe" -ArgumentList $script:logFile
    } else {
        [System.Windows.Forms.MessageBox]::Show("Chua co file log.", "WMS Server", "OK", "Information")
    }
})
[void]$contextMenu.Items.Add($menuLog)

# Mo thu muc du an
$menuFolder = New-Object System.Windows.Forms.ToolStripMenuItem
$menuFolder.Text = "Mo thu muc du an"
$menuFolder.Add_Click({ Start-Process "explorer.exe" -ArgumentList $script:scriptDir })
[void]$contextMenu.Items.Add($menuFolder)

[void]$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

# --- Khoi dong cung Windows (toggle) ---
$menuAutoStart = New-Object System.Windows.Forms.ToolStripMenuItem
$menuAutoStart.Text = "Khoi dong cung Windows"
$menuAutoStart.CheckOnClick = $true
$menuAutoStart.Checked = (Test-AutoStart)
$menuAutoStart.Add_CheckedChanged({
    $isChecked = $menuAutoStart.Checked
    Set-AutoStart -Enable $isChecked
    if ($isChecked) {
        $script:notifyIcon.ShowBalloonTip(2000, "WMS Server", "Da bat khoi dong cung Windows", [System.Windows.Forms.ToolTipIcon]::Info)
    } else {
        $script:notifyIcon.ShowBalloonTip(2000, "WMS Server", "Da tat khoi dong cung Windows", [System.Windows.Forms.ToolTipIcon]::Info)
    }
})
[void]$contextMenu.Items.Add($menuAutoStart)

[void]$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

# Khoi dong lai server
$menuRestart = New-Object System.Windows.Forms.ToolStripMenuItem
$menuRestart.Text = "Khoi dong lai server"
$menuRestart.Add_Click({
    try {
        # Tat process cu
        if ($script:serverProcess -and -not $script:serverProcess.HasExited) {
            Stop-Process -Id $script:serverProcess.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
        # Kill port 8888
        $connections = netstat -aon 2>$null | Select-String ":8888.*LISTENING"
        foreach ($c in $connections) {
            $pid_num = ($c -split '\s+')[-1]
            if ($pid_num -match '^\d+$') { Stop-Process -Id $pid_num -Force -ErrorAction SilentlyContinue }
        }
        Start-Sleep -Seconds 1
        # Khoi dong lai
        $script:serverProcess = Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c cd /d `"$($script:backendDir)`" && `"$($script:pythonCmd)`" -m uvicorn app.main:app --host 0.0.0.0 --port 8888 > `"$($script:logFile)`" 2>&1" `
            -WindowStyle Hidden -PassThru
        $script:notifyIcon.Icon = $script:onlineIcon
        $script:menuStatus.Text = "WMS Server dang chay"
        $script:notifyIcon.Text = "WMS Server - Dang chay`nhttp://localhost:8888"
        $script:notifyIcon.ShowBalloonTip(2000, "WMS Server", "Server da khoi dong lai thanh cong!", [System.Windows.Forms.ToolTipIcon]::Info)
    } catch {
        Out-File -FilePath (Join-Path $script:scriptDir "tray_error.log") -InputObject "Restart Error: $($_.Exception.Message)" -Append
    }
})
[void]$contextMenu.Items.Add($menuRestart)

# Dung server va thoat
$menuExit = New-Object System.Windows.Forms.ToolStripMenuItem
$menuExit.Text = "Dung server va thoat"
$menuExit.Add_Click({
    try {
        # Tat server
        if ($script:serverProcess -and -not $script:serverProcess.HasExited) {
            Stop-Process -Id $script:serverProcess.Id -Force -ErrorAction SilentlyContinue
        }
        # Kill port 8888
        $connections = netstat -aon 2>$null | Select-String ":8888.*LISTENING"
        foreach ($c in $connections) {
            $pid_num = ($c -split '\s+')[-1]
            if ($pid_num -match '^\d+$') { Stop-Process -Id $pid_num -Force -ErrorAction SilentlyContinue }
        }
        $script:notifyIcon.Visible = $false
        $script:notifyIcon.Dispose()
        [System.Windows.Forms.Application]::Exit()
    } catch {
        Out-File -FilePath (Join-Path $script:scriptDir "tray_error.log") -InputObject "Exit Error: $($_.Exception.Message)" -Append
        [System.Windows.Forms.Application]::Exit()
    }
})
[void]$contextMenu.Items.Add($menuExit)

$script:notifyIcon.ContextMenuStrip = $contextMenu

# --- Double-click mo trinh duyet ---
$script:notifyIcon.Add_DoubleClick({ Start-Process "http://localhost:8888" })

# --- Timer kiem tra server con song ---
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 5000  # 5 giay
$timer.Add_Tick({
    try {
        if ($script:serverProcess -and $script:serverProcess.HasExited) {
            $script:notifyIcon.Icon = $script:offlineIcon
            $script:menuStatus.Text = "Server da dung"
            $script:notifyIcon.Text = "WMS Server - Da dung"
        } else {
            $script:notifyIcon.Icon = $script:onlineIcon
            $script:menuStatus.Text = "WMS Server dang chay"
            $script:notifyIcon.Text = "WMS Server - Dang chay`nhttp://localhost:8888"
        }
    } catch {
        Out-File -FilePath (Join-Path $script:scriptDir "tray_error.log") -InputObject "Timer Error: $($_.Exception.Message)" -Append
    }
})
$timer.Start()

# --- Thong bao khoi dong ---
$script:notifyIcon.ShowBalloonTip(3000, "WMS Server", "Server dang chay tai http://localhost:8888`nDouble-click de mo trinh duyet", [System.Windows.Forms.ToolTipIcon]::Info)

# --- Chay message loop ---
[System.Windows.Forms.Application]::Run()
