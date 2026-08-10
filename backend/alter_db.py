import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'data', 'wms.db')
db = sqlite3.connect(db_path)
try:
    db.execute("ALTER TABLE transactions ADD COLUMN loai_xuat VARCHAR(50) DEFAULT 'Cấp mới'")
    db.commit()
    print("Added loai_xuat to transactions")
except sqlite3.OperationalError as e:
    print(f"OperationalError: {e}")
db.close()
