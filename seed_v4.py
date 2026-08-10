import os
import sqlite3
import pandas as pd
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'data', 'wms.db')
EXCEL_FILE = os.path.join(os.path.dirname(__file__), 'QUẢN LÝ KHO V4.xlsm')

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

def safe_get(row, key, default=""):
    try:
        if key in row:
            val = row[key]
            return val if not pd.isna(val) else default
    except:
        pass
    return default

def main():
    print("Connecting to DB...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Use kho_id = 2 directly since we know it's KHO KỸ THUẬT THIẾT BỊ
    cursor.execute("SELECT id, ten_kho FROM warehouses WHERE id = 2")
    warehouses = cursor.fetchall()
    
    if not warehouses:
        print("Error: Cannot find warehouse with id 2")
        return
        
    kho_id, ten_kho = warehouses[0]
    print(f"Found warehouse: ID {kho_id}")
    
    print("Reading Excel file - Sheet: TON_KHO...")
    df_ton_kho = pd.read_excel(EXCEL_FILE, sheet_name='TON_KHO', skiprows=5)
    df_ton_kho.columns = df_ton_kho.columns.str.strip()
    
    items_data = []
    for index, row in df_ton_kho.iterrows():
        # Check if first column is NaN (end of data)
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
            
            # Skip if both ten_hang and ma_so are empty
            if not ten_hang and not ma_so:
                continue
                
            items_data.append((
                ma_quan_ly, ten_hang, ma_so, ncc, don_gia, vi_tri, dvt,
                ton_dau, tong_nhap, tong_xuat, ton_cuoi, dinh_muc, trang_thai, cong_doan, ghi_chu,
                kho_id, datetime.now().isoformat(), datetime.now().isoformat()
            ))
        except Exception as e:
            print(f"Error parsing TON_KHO row {index+6}: {e}")
            continue

    if items_data:
        try:
            cursor.executemany("""
                INSERT INTO items (
                    ma_quan_ly, ten_hang, ma_so, nha_cung_cap, don_gia, vi_tri, don_vi_tinh,
                    ton_dau, tong_nhap, tong_xuat, ton_cuoi, dinh_muc, trang_thai, cong_doan, ghi_chu, kho_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, items_data)
            conn.commit()
            print(f"Successfully imported {len(items_data)} items into {ten_kho!r} (ID: {kho_id}).")
        except Exception as e:
            print(f"Database error during insert: {repr(e)}")
            conn.rollback()
    else:
        print("No valid items found to import.")
        
    conn.close()

if __name__ == "__main__":
    main()
