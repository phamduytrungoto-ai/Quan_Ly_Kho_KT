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
import json

GITHUB_REPO = "phamduytrungoto-ai/Quan_Ly_Kho_KT"

def _github_headers():
    """Tạo headers cho GitHub API, kèm token nếu có."""
    token = os.getenv("GITHUB_TOKEN", "").strip()
    headers = {'User-Agent': 'WMS-Updater', 'Accept': 'application/vnd.github+json'}
    if token:
        headers['Authorization'] = f'token {token}'
    return headers, bool(token)

def fetch_url(req, timeout=15):
    """Gửi request có hỗ trợ fallback proxy mạng công ty Sharp."""
    import urllib.request
    import ssl
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    # 1. Thử kết nối trực tiếp (dành cho mạng ở nhà/4G)
    try:
        opener_no_proxy = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPSHandler(context=ctx)
        )
        return opener_no_proxy.open(req, timeout=timeout)
    except Exception as e1:
        # 2. Thử kết nối qua Proxy (dành cho mạng công ty)
        try:
            proxy_url = os.getenv("PROXY_URL")
            if not proxy_url:
                proxy_url = "http://proxy-asia.global.sharp:3080"
            opener_proxy = urllib.request.build_opener(
                urllib.request.ProxyHandler({'http': proxy_url, 'https': proxy_url}),
                urllib.request.HTTPSHandler(context=ctx)
            )
            return opener_proxy.open(req, timeout=timeout)
        except Exception as e2:
            raise Exception(f"Direct: {repr(e1)} | Proxy: {repr(e2)}")

def find_git_executable():
    """Tìm git.exe trên máy, kể cả khi không nằm trong PATH."""
    try:
        result = subprocess.run(["git", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            return "git"
    except FileNotFoundError:
        pass
    
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
    
    for drive in ["C", "D", "E"]:
        for pattern in [f"{drive}:\\*\\Git\\cmd\\git.exe", f"{drive}:\\*\\PortableGit\\cmd\\git.exe", f"{drive}:\\*\\cmd\\git.exe"]:
            found = glob.glob(pattern)
            if found:
                return found[0]
    
    return None

@router.get("/releases")
def get_releases(_ = Depends(require_admin)):
    """Lấy danh sách phiên bản (releases + tags) từ GitHub."""
    headers, has_token = _github_headers()
    versions = []
    
    # Luôn thêm tùy chọn "Mới nhất (main)"
    versions.append({
        "tag": "main",
        "name": "🔄 Mới nhất (nhánh main)",
        "description": "Luôn cập nhật mã nguồn mới nhất từ nhánh chính",
        "date": "",
        "type": "branch"
    })
    
    try:
        # Lấy danh sách Releases
        api_url = f"https://api.github.com/repos/{GITHUB_REPO}/releases?per_page=20"
        req = urllib.request.Request(api_url, headers=headers)
        with fetch_url(req, timeout=15) as response:
            releases = json.loads(response.read().decode())
            for r in releases:
                versions.append({
                    "tag": r["tag_name"],
                    "name": r.get("name") or r["tag_name"],
                    "description": (r.get("body") or "")[:200],
                    "date": (r.get("published_at") or "")[:10],
                    "type": "release"
                })
    except Exception:
        pass
    
    if len(versions) <= 1:
        # Nếu không có release, thử lấy tags
        try:
            api_url = f"https://api.github.com/repos/{GITHUB_REPO}/tags?per_page=20"
            req = urllib.request.Request(api_url, headers=headers)
            with fetch_url(req, timeout=15) as response:
                tags = json.loads(response.read().decode())
                for t in tags:
                    versions.append({
                        "tag": t["name"],
                        "name": t["name"],
                        "description": "",
                        "date": "",
                        "type": "tag"
                    })
        except Exception:
            pass
    
    return {"versions": versions}

@router.post("/update_system")
def update_system(version: str = "main", _ = Depends(require_admin)):
    """Cập nhật hệ thống theo phiên bản được chọn."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    output = f"Phiên bản được chọn: {version}\n"
    
    # Nếu chọn main và có git → thử git pull
    if version == "main":
        git_exe = find_git_executable()
        if git_exe:
            try:
                result = subprocess.run([git_exe, "pull"], cwd=project_root, capture_output=True, text=True, timeout=60)
                if result.returncode == 0:
                    return {"message": "Cập nhật thành công bằng Git. Vui lòng khởi động lại server.", "output": result.stdout}
                else:
                    output += f"Git pull thất bại: {result.stderr}\nChuyển sang tải file zip...\n"
            except subprocess.TimeoutExpired:
                output += "Git pull quá thời gian chờ (60s). Chuyển sang tải file zip...\n"
            except Exception as e:
                output += f"Lỗi khi chạy git: {str(e)}\nChuyển sang tải file zip...\n"
        else:
            output += "Không tìm thấy Git trên máy. Chuyển sang tải mã nguồn trực tiếp (ZIP)...\n"

    # Tải ZIP từ GitHub theo phiên bản
    try:
        zip_content = None
        headers, has_token = _github_headers()
        
        # Xác định URL tải theo loại phiên bản
        if version == "main":
            refs_to_try = ["main", "master"]
        else:
            refs_to_try = [version]
        
        for ref in refs_to_try:
            try:
                if has_token:
                    api_url = f"https://api.github.com/repos/{GITHUB_REPO}/zipball/{ref}"
                else:
                    api_url = f"https://github.com/{GITHUB_REPO}/archive/refs/heads/{ref}.zip" if ref in ["main", "master"] else f"https://github.com/{GITHUB_REPO}/archive/refs/tags/{ref}.zip"
                
                req = urllib.request.Request(api_url, headers=headers)
                with fetch_url(req, timeout=120) as response:
                    zip_content = response.read()
                    output += f"Đã tải thành công phiên bản '{ref}' ({len(zip_content) // 1024} KB).\n"
                    break
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    continue
                elif e.code in (401, 403):
                    raise Exception(f"Token GitHub không hợp lệ hoặc hết hạn (HTTP {e.code}).")
                raise e
                
        if not zip_content:
            raise Exception(f"Không tìm thấy phiên bản '{version}' trên GitHub. Kiểm tra lại tên phiên bản hoặc quyền truy cập.")
            
        with zipfile.ZipFile(io.BytesIO(zip_content)) as zip_ref:
            extracted_folder = zip_ref.namelist()[0].split('/')[0]
            
            updated_count = 0
            skipped_count = 0
            for info in zip_ref.infolist():
                if info.is_dir():
                    continue
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
        return {"message": f"Cập nhật phiên bản '{version}' thành công. Vui lòng khởi động lại server.", "output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật: {str(e)}\n\nLog:\n{output}")
