"""
Pydantic schemas for API request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# ========== Warehouse Schemas (Kho) ==========

class WarehouseBase(BaseModel):
    ma_kho: str
    ten_kho: str
    dia_chi: str = ""
    mo_ta: str = ""
    email_enabled: bool = False
    email_schedule_time: str = "08:00"
    email_recipients: str = ""
    email_last_sent_date: str = ""


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    ma_kho: Optional[str] = None
    ten_kho: Optional[str] = None
    dia_chi: Optional[str] = None
    mo_ta: Optional[str] = None
    email_enabled: Optional[bool] = None
    email_schedule_time: Optional[str] = None
    email_recipients: Optional[str] = None
    email_last_sent_date: Optional[str] = None


class WarehouseResponse(WarehouseBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== Item Schemas (Tá»“n kho) ==========

class ItemBase(BaseModel):
    ma_quan_ly: str = ""
    ten_hang: str
    ma_so: str
    nha_cung_cap: str = ""
    don_gia: float = 0
    vi_tri: str = ""
    don_vi_tinh: str = "PCS"
    ton_dau: int = 0
    dinh_muc: int = 0
    trang_thai: str = "CÃ³ kiá»ƒm kÃª"
    cong_doan: str = ""
    ghi_chu: str = ""
    hinh_anh: str = ""
    thong_so_ky_thuat: str = ""
    loai_vat_tu: str = "Vật tư tiêu hao"
    kho_id: int = 1
class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    ma_quan_ly: Optional[str] = None
    ten_hang: Optional[str] = None
    ma_so: Optional[str] = None
    nha_cung_cap: Optional[str] = None
    don_gia: Optional[float] = None
    vi_tri: Optional[str] = None
    don_vi_tinh: Optional[str] = None
    dinh_muc: Optional[int] = None
    trang_thai: Optional[str] = None
    cong_doan: Optional[str] = None
    ghi_chu: Optional[str] = None
    hinh_anh: Optional[str] = None
    thong_so_ky_thuat: Optional[str] = None
    loai_vat_tu: Optional[str] = None
    kho_id: Optional[int] = None


class ItemResponse(ItemBase):
    id: int
    tong_nhap: int = 0
    tong_xuat: int = 0
    ton_cuoi: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ItemListResponse(BaseModel):
    items: List[ItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ========== Transaction Schemas (Nháº­p/Xuáº¥t kho) ==========

class TransactionBase(BaseModel):
    item_id: int
    ngay: date
    so_luong: int = Field(gt=0, description="Sá»‘ lÆ°á»£ng pháº£i lá»›n hÆ¡n 0")
    cong_doan: str = ""
    trang_thai: str = "CÃ³ kiá»ƒm kÃª"
    ghi_chu: str = ""
    kho_id: int = 1


class ImportCreate(TransactionBase):
    """Táº¡o phiáº¿u nháº­p kho."""
    nguoi_nhap: str = ""


class ExportCreate(TransactionBase):
    """Táº¡o phiáº¿u xuáº¥t kho."""
    nguoi_yeu_cau: str = ""
    nguoi_nhan: str = ""
    nguoi_xuat: str = ""


class TransactionResponse(BaseModel):
    id: int
    loai: str
    item_id: int
    ngay: date
    ma_quan_ly: str = ""
    ten_hang: str = ""
    ma_so: str = ""
    so_luong: int
    don_vi_tinh: str = ""
    cong_doan: str = ""
    nguoi_nhap: str = ""
    nguoi_yeu_cau: str = ""
    nguoi_nhan: str = ""
    nguoi_xuat: str = ""
    trang_thai: str = ""
    loai_xuat: str = ""
    ghi_chu: str = ""
    kho_id: int = 1
    transfer_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ========== Category Schemas (Danh má»¥c) ==========

class CategoryBase(BaseModel):
    loai: str
    ma: str = ""
    gia_tri: str
    mo_ta: str = ""
    thu_tu: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# ========== Transfer Schemas (Phiếu chuyển kho) ==========

class TransferBase(BaseModel):
    ma_phieu: str = ""
    ngay_chuyen: date
    tu_kho_id: int
    den_kho_id: int
    nguoi_chuyen: str = ""
    ghi_chu: str = ""


class TransferItemCreate(BaseModel):
    item_id: int
    so_luong: int


class TransferCreate(TransferBase):
    items: List[TransferItemCreate]


class TransferResponse(TransferBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== Dashboard / Report Schemas ==========

class DashboardStats(BaseModel):
    total_items: int = 0
    total_imports_today: int = 0
    total_exports_today: int = 0
    low_stock_count: int = 0
    out_of_stock_count: int = 0
    total_value: float = 0


class RecentTransaction(BaseModel):
    id: int
    loai: str
    ten_hang: str
    ma_so: str
    so_luong: int
    ngay: date
    nguoi: str = ""


class MonthlyTrend(BaseModel):
    month: str
    nhap: int = 0
    xuat: int = 0


class TopItem(BaseModel):
    ten_hang: str
    ma_so: str
    so_luong: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_transactions: List[RecentTransaction] = []
    monthly_trends: List[MonthlyTrend] = []
    top_exports: List[TopItem] = []
    low_stock_items: List[ItemResponse] = []


# ========== Receipt Schemas (Phi?u Nh?p) ==========

class ReceiptBase(BaseModel):
    ngay_nhap: date
    nguoi_nhap: str = ""
    ghi_chu: str = ""
    kho_id: int = 1

class ReceiptItemCreate(BaseModel):
    item_id: int
    so_luong: int
    ghi_chu: str = ""

class ReceiptCreate(ReceiptBase):
    items: List[ReceiptItemCreate]

class ReceiptResponse(ReceiptBase):
    id: int
    ma_phieu: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReceiptListResponse(BaseModel):
    receipts: List[ReceiptResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# ========== Issue Schemas (Phi?u Xu?t) ==========

class IssueBase(BaseModel):
    ngay_xuat: date
    nguoi_yeu_cau: str = ""
    nguoi_xuat: str = ""
    loai_xuat: str = "Cấp mới"
    ghi_chu: str = ""
    kho_id: int = 1

class IssueItemCreate(BaseModel):
    item_id: int
    so_luong: int
    cong_doan: str = ""
    nguoi_nhan: str = ""
    ghi_chu: str = ""
    loai_xuat: str = "Cấp mới"

class IssueCreate(IssueBase):
    items: List[IssueItemCreate]

class IssueResponse(IssueBase):
    id: int
    ma_phieu: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class IssueListResponse(BaseModel):
    issues: List[IssueResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# ========== User Schemas (Ng??i d?ng) ==========

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "Nhân viên"
    perm_view: bool = True
    perm_add: bool = False
    perm_edit: bool = False
    perm_delete: bool = False
    perm_approve: bool = False
    perm_print: bool = False
    perm_excel: bool = False
    is_admin: bool = False
    is_active: bool = True
    allowed_kho_ids: str = "*"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    perm_view: Optional[bool] = None
    perm_add: Optional[bool] = None
    perm_edit: Optional[bool] = None
    perm_delete: Optional[bool] = None
    perm_approve: Optional[bool] = None
    perm_print: Optional[bool] = None
    perm_excel: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    allowed_kho_ids: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[UserResponse]

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class SettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None

class SettingUpdate(BaseModel):
    value: Optional[str] = None

class SettingResponse(SettingBase):
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TokenData(BaseModel):
    username: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    username: str

class ResetPasswordRequest(BaseModel):
    username: str
    otp: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
