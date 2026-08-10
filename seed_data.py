import os
import sqlite3
import pandas as pd
from datetime import datetime
import sys

# Add backend directory to path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
import app.models  # Required to register tables with Base metadata
from app.database import init_db

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'data', 'wms.db')
EXCEL_FILES = [
    os.path.join(os.path.dirname(__file__), 'QUẢN LÝ KHO-Linh kiện dự phòng.xlsm'),
    os.path.join(os.path.dirname(__file__), 'QUẢN LÝ KHOv2 - VẬT TƯ TIÊU HAO.xlsm')
]

def convert_excel_date(date_val):
    if pd.isna(date_val):
        return datetime.now().date().isoformat()
    try:
        if isinstance(date_val, (int, float)):
            return (pd.to_datetime('1899-12-30').date() + pd.Timedelta(days=date_val)).isoformat()
        return pd.to_datetime(date_val).date().isoformat()
    except:
        return datetime.now().date().isoformat()

def safe_float(val):
    if pd.isna(val): return 0.0
    if isinstance(val, (int, float)): return float(val)
    s = str(val).replace(',', '').replace(';', '').replace(' ', '')
    try:
        return float(s)
    except:
        return 0.0

def safe_int(val):
    if pd.isna(val): return 0
    if isinstance(val, (int, float)): return int(val)
    s = str(val).replace(',', '').replace(';', '').replace(' ', '').replace('.', '')
    try:
        return int(s)
    except:
        return 0

def safe_iloc(row, idx, default=""):
    try:
        if idx < len(row):
            val = row.iloc[idx]
            return val if not pd.isna(val) else default
    except:
        pass
    return default

def safe_get(row, key, default=""):
    try:
        if key in row:
            val = row[key]
            return val if not pd.isna(val) else default
    except:
        pass
    return default

def seed_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    print("Initializing database tables...")
    init_db()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        file_count = 1
        for excel_path in EXCEL_FILES:
            if not os.path.exists(excel_path):
                print(f"Warning: Could not find file {file_count}. Skipping.")
                file_count += 1
                continue
                
            print(f"\n--- Reading Excel file {file_count} ---")
            
            # ---- 1. Import TON_KHO ----
            print("Importing TON_KHO...")
            df_ton_kho = pd.read_excel(excel_path, sheet_name='TON_KHO', skiprows=5)
            df_ton_kho.columns = df_ton_kho.columns.str.strip()
            
            items_data = []
            for index, row in df_ton_kho.iterrows():
                if pd.isna(row.iloc[0]): 
                    break
                    
                try:
                    ten_hang = str(safe_get(row, 'TÊN HÀNG', ''))
                    ma_so = str(safe_get(row, 'MÃ SỐ', ''))
                    ncc = str(safe_get(row, 'NCC', ''))
                    don_gia = safe_float(safe_get(row, 'ĐƠN GIÁ', 0))
                    vi_tri = str(safe_get(row, 'VỊ TRÍ', ''))
                    dvt = str(safe_get(row, 'ĐVT', 'PCS'))
                    ton_dau = safe_int(safe_get(row, 'TỒN ĐẦU', 0))
                    tong_nhap = safe_int(safe_get(row, 'NHẬP', 0))
                    tong_xuat = safe_int(safe_get(row, 'XUẤT', 0))
                    ton_cuoi = safe_int(safe_get(row, 'TỒN CUỐI', 0))
                    dinh_muc = safe_int(safe_get(row, 'ĐỊNH MỨC', 0))
                    trang_thai = str(safe_get(row, 'TRẠNG THÁI', 'Có kiểm kê'))
                    cong_doan = str(safe_get(row, 'CÔNG ĐOẠN', ''))
                    ghi_chu = str(safe_get(row, 'GHI CHÚ', ''))
                    ma_quan_ly = str(safe_get(row, 'MÃ QUẢN LÝ', ''))
                    
                    items_data.append((
                        ma_quan_ly, ten_hang, ma_so, ncc, don_gia, vi_tri, dvt,
                        ton_dau, tong_nhap, tong_xuat, ton_cuoi, dinh_muc, trang_thai, cong_doan, ghi_chu,
                        datetime.now().isoformat(), datetime.now().isoformat()
                    ))
                except Exception as e:
                    print(f"Error parsing TON_KHO row {index+7}: {e}")
                    continue

            if items_data:
                cursor.executemany("""
                    INSERT INTO items (
                        ma_quan_ly, ten_hang, ma_so, nha_cung_cap, don_gia, vi_tri, don_vi_tinh,
                        ton_dau, tong_nhap, tong_xuat, ton_cuoi, dinh_muc, trang_thai, cong_doan, ghi_chu, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, items_data)
                print(f"Imported {len(items_data)} items from file {file_count}.")

            # Create mapping for this file
            cursor.execute("SELECT id, ten_hang, ma_so FROM items")
            item_map = {}
            for r in cursor.fetchall():
                key = f"{r[1]}_{r[2]}"
                item_map[key] = r[0]
                item_map[r[1]] = r[0] 

            # ---- 2. Import LICH_SU_NHAP ----
            print("Importing LICH_SU_NHAP...")
            df_nhap = pd.read_excel(excel_path, sheet_name='LICH_SU_NHAP', skiprows=5)
            df_nhap.columns = df_nhap.columns.str.strip()
            
            nhap_data = []
            for index, row in df_nhap.iterrows():
                if pd.isna(row.iloc[0]):
                    break
                try:
                    ngay = convert_excel_date(safe_get(row, 'NGÀY NHẬP', safe_iloc(row, 1)))
                    if not ngay: continue
                    ma_quan_ly = str(safe_get(row, 'MÃ QUẢN LÝ', ''))
                    ten_hang = str(safe_get(row, 'TÊN HÀNG', safe_iloc(row, 2)))
                    ma_so = str(safe_get(row, 'MÃ SỐ', safe_iloc(row, 3)))
                    so_luong = safe_int(safe_get(row, 'SỐ LƯỢNG', safe_iloc(row, 4)))
                    dvt = str(safe_get(row, 'ĐVT', 'PCS'))
                    cong_doan = str(safe_get(row, 'CÔNG ĐOẠN', ''))
                    nguoi_nhap = str(safe_get(row, 'NGƯỜI NHẬP', ''))
                    trang_thai = str(safe_get(row, 'TRẠNG THÁI', 'Có kiểm kê'))
                    ghi_chu = str(safe_get(row, 'GHI CHÚ', ''))
                    
                    key = f"{ten_hang}_{ma_so}"
                    item_id = item_map.get(key, item_map.get(ten_hang, 1)) 
                    
                    if so_luong > 0:
                        nhap_data.append((
                            "NHAP", item_id, ngay, ma_quan_ly, ten_hang, ma_so, so_luong, dvt, cong_doan,
                            nguoi_nhap, "", "", "", trang_thai, ghi_chu, datetime.now().isoformat()
                        ))
                except Exception as e:
                    print(f"Error parsing LICH_SU_NHAP row {index+7}: {e}")
                    
            if nhap_data:
                cursor.executemany("""
                    INSERT INTO transactions (
                        loai, item_id, ngay, ma_quan_ly, ten_hang, ma_so, so_luong, don_vi_tinh, cong_doan,
                        nguoi_nhap, nguoi_yeu_cau, nguoi_nhan, nguoi_xuat, trang_thai, ghi_chu, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, nhap_data)
                print(f"Imported {len(nhap_data)} import transactions from file {file_count}.")

            # ---- 3. Import LICH_SU_XUAT ----
            print("Importing LICH_SU_XUAT...")
            df_xuat = pd.read_excel(excel_path, sheet_name='LICH_SU_XUAT', skiprows=5)
            df_xuat.columns = df_xuat.columns.str.strip()
            
            xuat_data = []
            for index, row in df_xuat.iterrows():
                if pd.isna(row.iloc[0]):
                    break
                try:
                    ngay = convert_excel_date(safe_get(row, 'NGÀY XUẤT', safe_iloc(row, 1)))
                    if not ngay: continue
                    ma_quan_ly = str(safe_get(row, 'MÃ QUẢN LÝ', ''))
                    ten_hang = str(safe_get(row, 'TÊN HÀNG', safe_iloc(row, 2)))
                    ma_so = str(safe_get(row, 'MÃ SỐ', safe_iloc(row, 3)))
                    so_luong = safe_int(safe_get(row, 'SỐ LƯỢNG', safe_iloc(row, 4)))
                    dvt = str(safe_get(row, 'ĐVT', 'PCS'))
                    cong_doan = str(safe_get(row, 'CÔNG ĐOẠN', ''))
                    nguoi_yeu_cau = str(safe_get(row, 'NGƯỜI YÊU CẦU', ''))
                    nguoi_nhan = str(safe_get(row, 'NGƯỜI NHẬN', ''))
                    nguoi_xuat = str(safe_get(row, 'NGƯỜI XUẤT', ''))
                    trang_thai = str(safe_get(row, 'TRẠNG THÁI', 'Có kiểm kê'))
                    ghi_chu = str(safe_get(row, 'GHI CHÚ', ''))
                    
                    key = f"{ten_hang}_{ma_so}"
                    item_id = item_map.get(key, item_map.get(ten_hang, 1))
                    
                    if so_luong > 0:
                        xuat_data.append((
                            "XUAT", item_id, ngay, ma_quan_ly, ten_hang, ma_so, so_luong, dvt, cong_doan,
                            "", nguoi_yeu_cau, nguoi_nhan, nguoi_xuat, trang_thai, ghi_chu, datetime.now().isoformat()
                        ))
                except Exception as e:
                    print(f"Error parsing LICH_SU_XUAT row {index+7}: {e}")

            if xuat_data:
                cursor.executemany("""
                    INSERT INTO transactions (
                        loai, item_id, ngay, ma_quan_ly, ten_hang, ma_so, so_luong, don_vi_tinh, cong_doan,
                        nguoi_nhap, nguoi_yeu_cau, nguoi_nhan, nguoi_xuat, trang_thai, ghi_chu, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, xuat_data)
                print(f"Imported {len(xuat_data)} export transactions from file {file_count}.")
            
            file_count += 1

        # ---- 4. Categories ----
        print("\nImporting Categories...")
        categories = [
            ("cong_doan", "", "CUTTING", ""),
            ("cong_doan", "", "RỬA", ""),
            ("cong_doan", "", "CELL", ""),
            ("cong_doan", "", "POL", ""),
            ("cong_doan", "", "AC", ""),
            ("cong_doan", "", "COG", ""),
            ("cong_doan", "", "FOG", ""),
            ("cong_doan", "", "RISIN", ""),
            ("cong_doan", "", "FOB", ""),
            ("cong_doan", "", "E/D CHECK", ""),
            ("cong_doan", "", "B.LIGHT", ""),
            ("cong_doan", "", "FLW", ""),
            ("cong_doan", "", "AGING", ""),
            ("cong_doan", "", "CG-UV", ""),
            ("cong_doan", "", "MONITOR", ""),
            ("cong_doan", "", "REWORK", ""),
            ("cong_doan", "", "V/A", ""),
            ("cong_doan", "", "NQ", ""),
            ("cong_doan", "", "KHO", ""),
            ("cong_doan", "", "PROCESS", ""),
            ("cong_doan", "", "IT", ""),
            ("cong_doan", "", "OQC", ""),
            ("cong_doan", "", "HC", ""),
            ("ma_quan_ly", "BE", "Belt - Dây curoa", ""),
            ("ma_quan_ly", "TA", "Tape - Băng keo", ""),
            ("ma_quan_ly", "GR", "Grease - Mỡ bôi trơn", ""),
            ("ma_quan_ly", "VC", "Vaccum pad - Giác hút", ""),
            ("ma_quan_ly", "CA", "Cable - Dây cáp", ""),
            ("ma_quan_ly", "SS", "Sensor - Cảm biến", ""),
        ]
        
        cursor.executemany("INSERT INTO categories (loai, ma, gia_tri, mo_ta) VALUES (?, ?, ?, ?)", categories)

        conn.commit()
        print("Successfully seeded the database from all files!")

    except Exception as e:
        print(f"Fatal error during seeding: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    seed_database()
