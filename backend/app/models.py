"""
SQLAlchemy models for the WMS database.
Mirrors the structure of the Excel template QUáº¢N LÃ KHOv3.xlsm.
"""
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, Enum as SAEnum, Boolean
)
from sqlalchemy.orm import relationship
from .database import Base
import enum


class TransactionType(str, enum.Enum):
    IMPORT = "NHAP"
    EXPORT = "XUAT"


class Warehouse(Base):
    """Danh mục Kho"""
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ma_kho = Column(String(50), unique=True, index=True, nullable=False)
    ten_kho = Column(String(200), nullable=False)
    dia_chi = Column(String(500), default="")
    mo_ta = Column(String(500), default="")
    
    # Email settings for this warehouse
    email_enabled = Column(Boolean, default=False)
    email_schedule_time = Column(String(5), default="08:00")
    email_recipients = Column(Text, default="")
    email_last_sent_date = Column(String(10), default="")
    
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    items = relationship("Item", back_populates="warehouse")
    receipts = relationship("Receipt", back_populates="warehouse")
    issues = relationship("Issue", back_populates="warehouse")
    transactions = relationship("Transaction", back_populates="warehouse")
    transfers_from = relationship("Transfer", foreign_keys="[Transfer.tu_kho_id]", back_populates="tu_kho")
    transfers_to = relationship("Transfer", foreign_keys="[Transfer.den_kho_id]", back_populates="den_kho")


class Item(Base):
    """Tá»“n kho - corresponds to TON_KHO sheet."""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ma_quan_ly = Column(String(100), default="", index=True)          # MÃ£ quáº£n lÃ½ (BE, TA, GR...)
    ten_hang = Column(String(500), nullable=False, index=True)       # TÃªn hÃ ng (song ngá»¯)
    ma_so = Column(String(200), nullable=False, index=True)          # MÃ£ sá»‘ / Part number
    nha_cung_cap = Column(String(200), default="")                   # NCC
    don_gia = Column(Float, default=0)                               # Ä Æ¡n giÃ¡ (VND)
    vi_tri = Column(String(200), default="")                         # Vá»‹ trÃ­ lÆ°u kho
    don_vi_tinh = Column(String(50), default="PCS")                  # Ä VT
    ton_dau = Column(Integer, default=0)                             # Tá»“n Ä‘áº§u
    tong_nhap = Column(Integer, default=0)                           # Tá»•ng nháº­p
    tong_xuat = Column(Integer, default=0)                           # Tá»•ng xuáº¥t
    ton_cuoi = Column(Integer, default=0)                            # Tá»“n cuá»‘i = tá»“n Ä‘áº§u + nháº­p - xuáº¥t
    dinh_muc = Column(Integer, default=0)                            # Ä á»‹nh má»©c tá»‘i thiá»ƒu
    trang_thai = Column(String(50), default="CÃ³ kiá»ƒm kÃª")           # Tráº¡ng thÃ¡i
    cong_doan = Column(String(500), default="")                      # CÃ´ng Ä‘oáº¡n sá»­ dá»¥ng
    ghi_chu = Column(Text, default="")                               # Ghi chÃº
    hinh_anh = Column(String(500), default="")                       # Ä Æ°á» ng dáº«n áº£nh
    thong_so_ky_thuat = Column(Text, default="")                     # ThÃ´ng sá»‘ ká»¹ thuáº­t chi tiáº¿t
    loai_vat_tu = Column(String(100), default="Vật tư tiêu hao")    # Loại vật tư
    kho_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, default=1, index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationship
    warehouse = relationship("Warehouse", back_populates="items")
    transactions = relationship("Transaction", back_populates="item")

class Receipt(Base):
    """Phiáº¿u nháº­p kho"""
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ma_phieu = Column(String(50), unique=True, index=True, nullable=False)
    ngay_nhap = Column(Date, nullable=False, default=date.today, index=True)
    nguoi_nhap = Column(String(100), default="")
    ghi_chu = Column(Text, default="")
    kho_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, default=1, index=True)
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    warehouse = relationship("Warehouse", back_populates="receipts")
    transactions = relationship("Transaction", back_populates="receipt", cascade="all, delete-orphan")


class Issue(Base):
    """Phiáº¿u xuáº¥t kho"""
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ma_phieu = Column(String(50), unique=True, index=True, nullable=False)
    ngay_xuat = Column(Date, nullable=False, default=date.today, index=True)
    nguoi_yeu_cau = Column(String(100), default="")
    nguoi_xuat = Column(String(100), default="")
    loai_xuat = Column(String(50), default="Cấp mới")
    ghi_chu = Column(Text, default="")
    kho_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, default=1, index=True)
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    warehouse = relationship("Warehouse", back_populates="issues")
    transactions = relationship("Transaction", back_populates="issue", cascade="all, delete-orphan")


class Transfer(Base):
    """Phiếu chuyển kho"""
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ma_phieu = Column(String(50), unique=True, index=True, nullable=False)
    ngay_chuyen = Column(Date, nullable=False, default=date.today, index=True)
    tu_kho_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    den_kho_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    nguoi_chuyen = Column(String(100), default="")
    ghi_chu = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    tu_kho = relationship("Warehouse", foreign_keys=[tu_kho_id], back_populates="transfers_from")
    den_kho = relationship("Warehouse", foreign_keys=[den_kho_id], back_populates="transfers_to")
    transactions = relationship("Transaction", back_populates="transfer", cascade="all, delete-orphan")


class Transaction(Base):
    """Lá»‹ch sá»­ nháº­p/xuáº¥t - corresponds to LICH_SU_NHAP & LICH_SU_XUAT sheets."""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    loai = Column(String(10), nullable=False, index=True)            # NHAP or XUAT
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    ngay = Column(Date, nullable=False, default=date.today, index=True)  # NgÃ y giao dá»‹ch
    ma_quan_ly = Column(String(100), default="")                      # MÃ£ quáº£n lÃ½
    ten_hang = Column(String(500), default="")                       # TÃªn hÃ ng (snapshot)
    ma_so = Column(String(200), default="")                          # MÃ£ sá»‘ (snapshot)
    so_luong = Column(Integer, nullable=False)                       # Số lượng
    don_vi_tinh = Column(String(50), default="PCS")                  # ĐVT
    cong_doan = Column(String(200), default="")                      # Công đoạn
    nguoi_nhap = Column(String(100), default="")                     # Người nhập (cho nhập kho)
    nguoi_yeu_cau = Column(String(100), default="")                  # Người yêu cầu (cho xuất kho)
    nguoi_nhan = Column(String(100), default="")                     # Người nhận (cho xuất kho)
    nguoi_xuat = Column(String(100), default="")                     # Người xuất (cho xuất kho)
    trang_thai = Column(String(50), default="Có kiểm kê")           # Trạng thái
    loai_xuat = Column(String(50), default="Cấp mới")                # Loại xuất (cho xuất kho)
    ghi_chu = Column(Text, default="")                               # Ghi chú
    kho_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, default=1, index=True)
    created_at = Column(DateTime, default=datetime.now)
    
    receipt_id = Column(Integer, ForeignKey("receipts.id", ondelete="CASCADE"), nullable=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=True)
    transfer_id = Column(Integer, ForeignKey("transfers.id", ondelete="CASCADE"), nullable=True)

    # Relationship
    item = relationship("Item", back_populates="transactions")
    warehouse = relationship("Warehouse", back_populates="transactions")
    receipt = relationship("Receipt", back_populates="transactions")
    issue = relationship("Issue", back_populates="transactions")
    transfer = relationship("Transfer", back_populates="transactions")


class Category(Base):
    """Danh má»¥c - corresponds to DATA & Sheet1 sheets."""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    loai = Column(String(50), nullable=False, index=True)  # Type: cong_doan, nhan_vien, dvt, trang_thai, ma_quan_ly, vi_tri
    ma = Column(String(20), default="")                    # Code (e.g., BE, TA)
    gia_tri = Column(String(500), nullable=False)          # Value
    mo_ta = Column(String(500), default="")                # Description
    thu_tu = Column(Integer, default=0)                    # Sort order

class UserWarehousePermission(Base):
    __tablename__ = 'user_warehouse_permissions'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    perm_view = Column(Boolean, default=True)
    perm_add = Column(Boolean, default=False)
    perm_edit = Column(Boolean, default=False)
    perm_delete = Column(Boolean, default=False)
    perm_approve = Column(Boolean, default=False)
    perm_print = Column(Boolean, default=False)
    perm_excel = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="permissions")
    warehouse = relationship("Warehouse")

class ActionLog(Base):
    """Bảng ghi nhận lịch sử thao tác của người dùng"""
    __tablename__ = 'action_logs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    username = Column(String(100), index=True)
    action = Column(String(200), nullable=False)
    details = Column(Text, default="")
    ip_address = Column(String(50), default="")
    created_at = Column(DateTime, default=datetime.now)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, nullable=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(String, default='Nhân viên')
    # Các trường perm_* cũ được giữ lại như quyền mặc định/legacy
    perm_view = Column(Boolean, default=True)
    perm_add = Column(Boolean, default=False)
    perm_edit = Column(Boolean, default=False)
    perm_delete = Column(Boolean, default=False)
    perm_approve = Column(Boolean, default=False)
    perm_print = Column(Boolean, default=False)
    perm_excel = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    allowed_kho_ids = Column(String, default="*")
    created_at = Column(DateTime, default=datetime.now)
    reset_otp = Column(String, nullable=True)
    reset_otp_expire = Column(DateTime, nullable=True)
    
    # Relationships
    permissions = relationship("UserWarehousePermission", back_populates="user", cascade="all, delete-orphan")

class Setting(Base):
    __tablename__ = 'settings'
    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=True)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
