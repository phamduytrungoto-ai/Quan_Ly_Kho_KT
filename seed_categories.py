import os
import sys

# Ensure we can import the backend package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.database import SessionLocal, engine, Base
from app.models import Category

# Initial data
data = {
    "cong_doan": [
        "CUTTING", "RỬA", "CELL", "POL", "AC", "COG", "FOG", "RISIN", "FOB",
        "E/D CHECK", "B.LIGHT", "FLW", "AGING", "CG-UV", "MONITOR", "REWORK",
        "V/A", "NQ", "KHO", "PROCESS", "IT", "OQC"
    ],
    "nhan_vien": [
        "NGÔ THỜI ĐẠT - GKM0001802", "LÊ VĂN DU - GKM0001298", "LÊ NHẬT MINH - GKM0001045",
        "TRẦN DUY NAM - GKM0000419", "NGUYỄN VĂN VƯƠNG - GKM0001594", "THÁI DƯƠNG ANH - GKM0001593",
        "NGUYỄN VĂN ĐOÀN - GKM0002413", "NGUYỄN NGỌC EM - GKM0002136", "LÊ THANH PHONG - GKM0001433",
        "NGUYỄN HỮU CHUNG - GKM0002710", "PHẠM HOÀNG KHA - GKM0001382", "NGUYỄN LÂM DUY - GKM0003267",
        "DANH TOÀN NGÂN - GKM0003310", "NGUYỄN HẢI VINH - GKM0003434", "LÊ VĂN SƠN - GKM0000233",
        "NGÔ VĂN VŨ - GKM0001439", "NGUYỄN LÂM TRƯỜNG - GKM0001440", "NGUYỄN XUÂN SỰ - GKM0001402",
        "HUỲNH PHÚ YÊN - GKM0002075", "NÔNG ANH TÚ - GKM0002414", "VÕ NGUYỄN HỮU NGHIỆP - GKM0001410",
        "NGUYỄN CHÍ CƯỜNG - GKM0001395", "ĐỒNG HUỲNH ĐỨC - GKM0002729", "TRẦN HÙNG CƯỜNG - GKM0002731",
        "NGUYỄN THÀNH TRUNG - GKM0002942", "HÀ MINH THÀNH - GKM0003224", "VÕ TRIỆU QUI - GKM0003269",
        "NGÔ VĂN TÀU - GKM0003309", "PHAN KHẮC HÙNG - GKM0001156", "NGUYỄN THANH TUẤN - GKM0000618",
        "TRƯƠNG THÀNH TOÀN - GKM0001393", "LÊ XUÂN QUANG - GKM0001434", "CAO HOÀNG MINH - GKM0002396",
        "BÙI TUẤN KIỆT - GKM0002309", "HUỲNH TRỌNG NGHĨA - GKM0002481", "TRẦN MINH TÀI - GKM0002716",
        "ĐỖ VĂN VÀNG - GKM0002711", "LÊ PHẠM TRUNG HIẾU - GKM0003008", "KIM VĨNH THÁI - GKM0003076",
        "HOÀNG THANH QUÝ - GKM0003313", "TRẦN VĂN MẾN - GKM0003351"
    ],
    "dvt": [
        "Pcs", "Roll", "Set", "Bag", "Box", "M"
    ],
    "vi_tri": [
        "Kệ 1-A-1"
    ],
    "ma_quan_ly": [
        "Vật tư tiêu hao", "Linh kiện dự phòng"
    ]
}

def seed():
    db = SessionLocal()
    try:
        count = 0
        for loai, items in data.items():
            # Check existing to avoid duplicates
            existing_items = [c.gia_tri for c in db.query(Category).filter(Category.loai == loai).all()]
            for i, val in enumerate(items):
                if val not in existing_items:
                    cat = Category(
                        loai=loai,
                        gia_tri=val,
                        thu_tu=i + 1
                    )
                    db.add(cat)
                    count += 1
        
        db.commit()
        print(f"Successfully seeded {count} new categories.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
