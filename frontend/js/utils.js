/**
 * Tiện ích chung (Utilities)
 */
const utils = {
    // Format tiền tệ VND
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    },

    // Format số lượng (thêm dấu phẩy)
    formatNumber: (number) => {
        return new Intl.NumberFormat('vi-VN').format(number || 0);
    },

    // Format ngày hiển thị (DD/MM/YYYY)
    formatDate: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    },

    // Format ngày giờ hiển thị (DD/MM/YYYY HH:mm)
    formatDateTime: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    },

    // Lấy ngày hiện tại format YYYY-MM-DD (cho input type="date")
    getTodayYYYYMMDD: () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Debounce function (tránh gọi hàm liên tục khi gõ phím)
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Hiển thị loading spinner trong một container
    showLoading: (containerId) => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading-screen">
                    <div class="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            `;
        }
    },

    // Xử lý lỗi API và hiển thị thông báo
    handleApiError: (error, defaultMessage = "Có lỗi xảy ra") => {
        console.error(error);
        const message = error.message || defaultMessage;
        window.toast.error(message);
    },

    // Nút loading
    setLoading: (button, isLoading, originalText = null) => {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.innerHTML;
            }
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            } else if (originalText) {
                button.innerHTML = originalText;
            }
        }
    },

    // Escape HTML để chống XSS
    escapeHtml: (unsafe) => {
        if (unsafe === null || unsafe === undefined) return '';
        return unsafe
             .toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    },

    // Tạo template in theo chuẩn form ISO Sharp
    generatePrintTemplate: (type, data) => {
        let title1 = '';
        let title2 = '';
        let maKho = data.ma_kho || 'DP-EE';
        
        if (type === 'issue') {
            title1 = `PHIẾU YÊU CẦU XUẤT KHO (${maKho})`;
            title2 = `倉庫出荷依頼書 (${maKho})`;
        } else if (type === 'receipt') {
            title1 = `PHIẾU NHẬP KHO (${maKho})`;
            title2 = `倉庫入庫依頼書 (${maKho})`;
        } else {
            title1 = `PHIẾU CHUYỂN KHO (${maKho})`;
            title2 = `倉庫移動依頼書 (${maKho})`;
        }

        const dateStr = utils.formatDate(data.ngay_xuat || data.ngay_nhap || data.ngay_chuyen);
        
        let nguoiThucHienStr = 'Người yêu cầu / 要求者名前';
        let nguoiThucHien = data.nguoi_yeu_cau || data.nguoi_nhap || data.nguoi_chuyen || '';
        let msnv = '';
        
        if (nguoiThucHien.includes('-')) {
            let parts = nguoiThucHien.split('-');
            msnv = parts.pop().trim();
            nguoiThucHien = parts.join('-').trim();
        }
        
        // Loại xuất sẽ được đọc từ từng transaction (hỗ trợ chế độ "Theo chi tiết")
        
        let headerCapMoi = 'Cấp mới<br>新規提供';
        let headerThayThe = 'Thay thế<br>交換';
        if (type === 'transfer') {
            headerCapMoi = 'Vị trí (Từ)<br>移動元';
            headerThayThe = 'Vị trí (Đến)<br>移動先';
        }

        
        let dataCount = data.transactions ? data.transactions.length : 0;
        let rowCount = Math.max(5, dataCount);
        let trs = '';
        for (let i = 0; i < rowCount; i++) {
            if (i < dataCount) {
                const tx = data.transactions[i] || {};
                const sl = tx.so_luong !== undefined ? utils.formatNumber(tx.so_luong) : '';
                const tonCuoi = tx.ton_cuoi !== undefined ? utils.formatNumber(tx.ton_cuoi) : '';
                
                // Xác định loại xuất cho từng dòng: ưu tiên loai_xuat của transaction, fallback về issue
                const txLoaiXuat = tx.loai_xuat || data.loai_xuat || '';
                const txIsCapMoi = txLoaiXuat === 'Cấp mới' || txLoaiXuat === 'Cấp Mới';
                const txIsThayThe = txLoaiXuat === 'Thay thế' || txLoaiXuat === 'Thay Thế';
                
                let valCapMoi = txIsCapMoi ? '✓' : '';
                let valThayThe = txIsThayThe ? '✓' : '';
                let fontCapMoi = 'font-weight: bold;';
                let fontThayThe = 'font-weight: bold;';
                
                if (type === 'transfer') {
                    valCapMoi = utils.escapeHtml(tx.vi_tri_cu || '');
                    valThayThe = utils.escapeHtml(tx.vi_tri_moi || '');
                    fontCapMoi = '';
                    fontThayThe = '';
                }
                
                trs += `
                    <tr>
                        <td style="text-align: center;">${i + 1}</td>
                        <td>${tx.ten_hang || ''}</td>
                        <td>${tx.ma_so || ''}</td>
                        <td style="text-align: center;">${sl}</td>
                        <td style="text-align: center;">${tx.don_vi_tinh || ''}</td>
                        <td style="text-align: center;">${tx.cong_doan || ''}</td>
                        <td style="text-align: center;">${sl}</td>
                        <td style="text-align: center;">${tonCuoi}</td>
                        <td style="text-align: center; ${fontCapMoi}">${valCapMoi}</td>
                        <td style="text-align: center; ${fontThayThe}">${valThayThe}</td>
                        <td>${tx.ghi_chu || ''}</td>
                    </tr>
                `;
            } else {
                trs += `
                    <tr>
                        <td style="text-align: center;">&nbsp;</td>
                        <td></td>
                        <td></td>
                        <td style="text-align: center;"></td>
                        <td style="text-align: center;"></td>
                        <td style="text-align: center;"></td>
                        <td style="text-align: center;"></td>
                        <td style="text-align: center;"></td>
                        <td style="text-align: center;"></td>
                        <td style="text-align: center;"></td>
                        <td></td>
                    </tr>
                `;
            }
        }

        return `
            <div class="print-template" style="display: none;">
                <style>
                    @page { size: A5 landscape; margin: 8mm; }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .sharp-form { padding: 0; font-size: 11px; }
                        .sharp-form .title-vn { font-size: 16px; }
                        .sharp-form .title-jp { font-size: 13px; }
                        .sharp-form .items-table th { font-size: 10px; }
                        .sharp-form .items-table td { font-size: 10px; padding: 2px 4px; }
                        .sharp-form .sign-table .sign-box { height: 90px; }
                        .sharp-form .footer-text { font-size: 11px; margin-top: 2px; }
                    }
                    .sharp-form { font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; font-size: 12px; background: #fff; }
                    .sharp-form table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
                    .sharp-form th, .sharp-form td { border: 1px solid #000; padding: 3px 6px; vertical-align: middle; }
                    .sharp-form .header-table { border: 2px solid #000; }
                    .sharp-form .header-table td { border: 1px solid #000; }
                    .sharp-form .title-cell { text-align: center; vertical-align: middle; padding: 6px; }
                    .sharp-form .title-vn { font-size: 18px; font-weight: bold; margin-bottom: 3px; }
                    .sharp-form .title-jp { font-size: 14px; font-style: italic; font-weight: bold; }
                    .sharp-form .logo-text { color: red; font-weight: bold; font-size: 16px; padding-left: 8px; }
                    .sharp-form .form-no { text-align: right; padding-right: 8px; font-size: 10px; }
                    .sharp-form .info-table { border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; }
                    .sharp-form .items-table { border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; }
                    .sharp-form .items-table th { text-align: center; background-color: #f5f5f5; font-size: 11px; line-height: 1.2; }
                    .sharp-form .items-table td { font-size: 11px; }
                    .sharp-form .sign-table { border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; text-align: center; }
                    .sharp-form .sign-table td { width: 33.33%; }
                    .sharp-form .sign-table .sign-title { height: 40px; border-bottom: 1px solid #000; vertical-align: middle; padding: 6px; }
                    .sharp-form .sign-table .sign-box { height: 130px; }
                    .sharp-form .footer-text { text-align: center; font-weight: bold; margin-top: 4px; font-size: 12px; }
                    .sharp-form .text-muted-sm { font-size: 9px; text-align: right; margin-top: 2px; }
                </style>
                <div class="sharp-form">
                    <table class="header-table">
                        <tr>
                            <td style="width: 15%; border-right: none;" class="logo-text">SHARP</td>
                            <td style="border-left: none; border-right: none;"></td>
                            <td style="width: 50%; border-left: none;" class="form-no">Form No: Q-FOBV-KPE-060 Revision: 000 Issue date: 13/11/2023</td>
                        </tr>
                        <tr>
                            <td colspan="3" class="title-cell">
                                <div class="title-vn">${title1}</div>
                                <div class="title-jp">${title2}</div>
                            </td>
                        </tr>
                    </table>
                    
                    <table class="info-table">
                        <tr>
                            <td style="width: 50%;">Ngày / 日付 : <b>${dateStr}</b></td>
                            <td style="width: 50%;">${nguoiThucHienStr} : <b>${nguoiThucHien}</b></td>
                        </tr>
                        <tr>
                            <td>Bộ phận / 部門 : <b>${maKho}</b></td>
                            <td>MSNV / ID : <b>${msnv}</b></td>
                        </tr>
                    </table>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width: 4%;">STT<br>No.</th>
                                <th style="width: 25%;">Tên linh kiện<br>部品名</th>
                                <th style="width: 15%;">Mã linh kiện<br>部品番号</th>
                                <th style="width: 7%;">SL yêu cầu<br>依頼数量</th>
                                <th style="width: 6%;">Đơn vị<br>単位</th>
                                <th style="width: 8%;">Công đoạn sử dụng<br>使用工程</th>
                                <th style="width: 7%;">SL xuất kho<br>倉庫出荷数量</th>
                                <th style="width: 7%;">SL còn lại<br>残り数量</th>
                                <th style="width: 6%;">${headerCapMoi}</th>
                                <th style="width: 6%;">${headerThayThe}</th>
                                <th style="width: 9%;">Ghi chú<br>備考</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trs}
                        </tbody>
                    </table>
                    
                    <table class="sign-table">
                        <tr>
                            <td class="sign-title">Nhân viên kho (ký tên)<br>倉庫者 (サイン)</td>
                            <td class="sign-title">Quản lý kho (ký tên)<br>倉庫管理者 (サイン)</td>
                            <td class="sign-title">Người yêu cầu (ký tên)<br>要求者 (サイン)</td>
                        </tr>
                        <tr>
                            <td class="sign-box"></td>
                            <td class="sign-box"></td>
                            <td class="sign-box"></td>
                        </tr>
                    </table>
                    <div class="footer-text">Sharp manufacturing Vietnam</div>
                </div>
            </div>
        `;
    }
};