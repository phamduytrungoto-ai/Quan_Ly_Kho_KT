from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Setting
from ..schemas import SettingResponse, SettingUpdate
from ..deps import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Cài đặt"])

def require_admin(current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Chỉ có Admin mới có quyền thực hiện.")
    return current_user

@router.get("", response_model=List[SettingResponse])
def get_all_settings(db: Session = Depends(get_db), _ = Depends(require_admin)):
    """Lấy danh sách tất cả các cài đặt."""
    return db.query(Setting).all()

@router.put("/{key}", response_model=SettingResponse)
def update_setting(key: str, data: SettingUpdate, db: Session = Depends(get_db), _ = Depends(require_admin)):
    """Cập nhật một cài đặt."""
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        # Nếu chưa có thì tạo mới (upsert behavior)
        setting = Setting(key=key, value=data.value)
        db.add(setting)
    else:
        setting.value = data.value
    
    db.commit()
    db.refresh(setting)
    return setting

import subprocess
import os
import urllib.request
import zipfile
import io
import shutil
import stat
import glob

def find_git_executable():
    """Tìm git.exe trên máy, kể cả khi không nằm trong PATH."""
    # Thử tìm trong PATH trước
    try:
        result = subprocess.run(["git", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            return "git"
    except FileNotFoundError:
        pass
    
    # Tìm trong các vị trí phổ biến trên Windows
    common_paths = [
        r"C:\Program Files\Git\cmd\git.exe",
        r"C:\Program Files (x86)\Git\cmd\git.exe",
        r"D:\GitHub\cmd\git.exe",
        r"D:\Git\cmd\git.exe",
        r"D:\TrungTa\PortableGit\cmd\git.exe",
        r"D:\TrungTa\PortableGit\bin\git.exe",
    ]
    
    for p in common_paths:
        if os.path.isfile(p):
            return p
    
    # Tìm rộng hơn bằng glob
    for drive in ["C", "D", "E"]:
        for pattern in [f"{drive}:\\*\\Git\\cmd\\git.exe", f"{drive}:\\*\\PortableGit\\cmd\\git.exe", f"{drive}:\\*\\cmd\\git.exe"]:
            found = glob.glob(pattern)
            if found:
                return found[0]
    
    return None

@router.post("/update_system")
def update_system(_ = Depends(require_admin)):
    """Cập nhật hệ thống: Ưu tiên git pull, nếu không có git thì tải zip từ Github."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    output = ""
    
    git_exe = find_git_executable()
    
    if git_exe:
        try:
            # Cách 1: Thử git pull
            result = subprocess.run([git_exe, "pull"], cwd=project_root, capture_output=True, text=True, timeout=60)
            if result.returncode == 0:
                return {"message": "Cập nhật thành công bằng Git. Vui lòng khởi động lại server.", "output": result.stdout}
            else:
                output = f"Git pull thất bại: {result.stderr}\nChuyển sang tải file zip...\n"
        except subprocess.TimeoutExpired:
            output = "Git pull quá thời gian chờ (60s). Chuyển sang tải file zip...\n"
        except Exception as e:
            output = f"Lỗi khi chạy git: {str(e)}\nChuyển sang tải file zip...\n"
    else:
        output = "Không tìm thấy Git trên máy. Chuyển sang tải mã nguồn trực tiếp (ZIP)...\n"

    # Cách 2: Tải zip từ GitHub (hỗ trợ cả private repo qua API)
    try:
        branches = ["main", "master"]
        zip_content = None
        last_err = None
        
        token = os.getenv("GITHUB_TOKEN", "").strip()
        repo = "phamduytrungoto-ai/Quan_Ly_Kho_KT"
        
        for branch in branches:
            try:
                if token:
                    # Dùng GitHub API cho private repo
                    api_url = f"https://api.github.com/repos/{repo}/zipball/{branch}"
                    req = urllib.request.Request(api_url, headers={
                        'User-Agent': 'WMS-Updater',
                        'Authorization': f'token {token}',
                        'Accept': 'application/vnd.github+json'
                    })
                else:
                    # URL trực tiếp cho public repo
                    api_url = f"https://github.com/{repo}/archive/refs/heads/{branch}.zip"
                    req = urllib.request.Request(api_url, headers={
                        'User-Agent': 'WMS-Updater'
                    })
                    
                with urllib.request.urlopen(req, timeout=120) as response:
                    zip_content = response.read()
                    output += f"Đã tải thành công từ nhánh '{branch}' ({len(zip_content) // 1024} KB).\n"
                    break
            except urllib.error.HTTPError as e:
                last_err = e
                if e.code == 404:
                    continue
                elif e.code == 401 or e.code == 403:
                    raise Exception(f"Token GitHub không hợp lệ hoặc hết hạn (HTTP {e.code}). Vui lòng kiểm tra GITHUB_TOKEN trong file .env.")
                raise e
                
        if not zip_content:
            if last_err and last_err.code == 404:
                raise Exception("Không tìm thấy mã nguồn (404). Nếu kho lưu trữ là Private, hãy cấu hình GITHUB_TOKEN trong file .env.")
            raise Exception(f"Không thể tải mã nguồn. Lỗi: HTTP {last_err.code if last_err else 'unknown'}")
            
        with zipfile.ZipFile(io.BytesIO(zip_content)) as zip_ref:
            # Thư mục gốc trong file zip (ví dụ: 'Quan_Ly_Kho_KT-main' hoặc 'phamduytrungoto-ai-Quan_Ly_Kho_KT-abc1234')
            extracted_folder = zip_ref.namelist()[0].split('/')[0]
            
            updated_count = 0
            skipped_count = 0
            for info in zip_ref.infolist():
                if info.is_dir():
                    continue
                # Bỏ qua thư mục data, uploads, log, file .env, wms.db để không ghi đè dữ liệu cục bộ
                skip_patterns = ["/backend/data/", "/uploads/", "server.log", ".env", "wms.db", "__pycache__"]
                if any(p in info.filename for p in skip_patterns):
                    skipped_count += 1
                    continue
                    
                rel_path = info.filename.replace(f"{extracted_folder}/", "", 1)
                if not rel_path:
                    continue
                    
                target_path = os.path.join(project_root, rel_path)
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                
                if os.path.exists(target_path):
                    os.chmod(target_path, stat.S_IWRITE)
                    
                with zip_ref.open(info.filename) as source, open(target_path, "wb") as target:
                    shutil.copyfileobj(source, target)
                updated_count += 1
                    
        output += f"\nĐã cập nhật {updated_count} file (bỏ qua {skipped_count} file dữ liệu)."
        return {"message": "Cập nhật mã nguồn thành công. Vui lòng khởi động lại server (Chuột phải icon WMS khay hệ thống > Khoi dong lai server).", "output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật: {str(e)}\n\nLog:\n{output}")


