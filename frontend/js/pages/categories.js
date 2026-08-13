/**
 * Trang Danh Mục (Categories)
 * Do template không cung cấp logic quản lý danh mục phức tạp, ta chỉ làm trang tĩnh đơn giản
 * hoặc để sau. For this demo, let's keep it simple.
 */
const CategoriesPage = {
    async render(container) {
        container.innerHTML = `
            <div class="card" style="height: calc(100vh - 130px); display: flex; flex-direction: column;">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3 class="card-title"><i class="fas fa-tags text-primary me-2"></i> Quản lý Danh mục</h3>
                </div>
                <div class="card-body" style="flex: 1; overflow: hidden; padding: 20px; display: flex; flex-direction: column;">
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; flex: 1; min-height: 0;">
                        ${this.buildColumnHtml('CÔNG ĐOẠN', 'cong_doan')}
                        ${this.buildColumnHtml('NHÂN VIÊN', 'nhan_vien')}
                        ${this.buildColumnHtml('ĐƠN VỊ TÍNH', 'dvt')}
                        ${this.buildColumnHtml('VỊ TRÍ', 'vi_tri')}
                        ${this.buildColumnHtml('MÃ QUẢN LÝ', 'ma_quan_ly')}
                    </div>
                </div>
            </div>
        `;
        
        await this.loadData();
    },
    
    buildColumnHtml(title, type) {
        return `
            <div class="category-column" style="display: flex; flex-direction: column; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; height: 100%;">
                <div style="background: var(--bg-input); padding: 10px 12px; font-weight: bold; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <span style="flex: 1; text-align: center; margin-left: 28px;">${title}</span>
                    <button class="btn btn-sm btn-primary" style="padding: 2px 8px; border-radius: 4px;" onclick="CategoriesPage.showAddModal('${type}', '${title}')" title="Thêm mới">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div style="padding: 8px 10px; border-bottom: 1px solid var(--border-color); background: var(--bg-card);">
                    <div style="position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.85rem;"></i>
                        <input type="text" id="search-input-${type}" class="form-control form-control-sm" placeholder="Tìm kiếm..." oninput="CategoriesPage.filterCategory('${type}', this.value)" style="padding-left: 30px; padding-right: 30px; font-size: 0.85rem; width: 100%; border-radius: 4px;">
                        <i class="fas fa-times clear-search-${type}" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; display: none; color: var(--text-muted); font-size: 0.85rem;" onclick="CategoriesPage.clearSearch('${type}')" title="Xóa"></i>
                    </div>
                </div>
                <div id="cat-list-${type}" style="flex: 1; overflow-y: auto; padding: 10px;">
                    <div class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>
                </div>
            </div>
        `;
    },
    
    async loadData() {
        try {
            const categories = await api.categories.list();
            
            // Group by type
            const grouped = {
                cong_doan: [], nhan_vien: [], dvt: [], vi_tri: [], ma_quan_ly: []
            };
            
            categories.forEach(c => {
                if (grouped[c.loai]) {
                    grouped[c.loai].push(c);
                }
            });
            
            // Render each list
            for (const type in grouped) {
                const listEl = document.getElementById(`cat-list-${type}`);
                if (listEl) {
                    if (grouped[type].length === 0) {
                        listEl.innerHTML = `<div class="text-center text-muted text-sm mt-3">Chưa có dữ liệu</div>`;
                    } else {
                        listEl.innerHTML = grouped[type].map(c => `
                            <div class="category-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;">
                                <div class="item-text" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 10px;" title="${c.gia_tri}">${c.gia_tri}</div>
                                <div style="display: flex; gap: 5px; flex-shrink: 0;">
                                    <button class="btn btn-ghost btn-sm text-warning p-1" onclick="CategoriesPage.showEditModal(${c.id}, '${c.loai}', '${c.gia_tri.replace(/'/g, "\\'")}')" title="Sửa"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-ghost btn-sm text-danger p-1" onclick="CategoriesPage.deleteCategory(${c.id})" title="Xóa"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        `).join('');
                    }
                }
            }
        } catch (e) {
            if (window.toast) window.toast.error('Lỗi tải danh mục: ' + e.message);
        }
    },
    
    showAddModal(type, title) {
        const content = `
            <div class="form-group mb-3">
                <label class="form-label" style="display: block; margin-bottom: 5px; font-weight: 500;">Tên ${title.toLowerCase()}</label>
                <input type="text" id="newCatValue" class="form-control" placeholder="Nhập giá trị...">
            </div>
        `;
        window.modal.show({
            title: `Thêm ${title}`,
            content: content,
            width: '400px',
            buttons: [
                { text: 'Hủy', class: 'btn-ghost', close: true },
                {
                    text: '<i class="fas fa-save"></i> Thêm', class: 'btn-primary',
                    onClick: async () => {
                        const val = document.getElementById('newCatValue').value.trim();
                        if (!val) { if (window.toast) window.toast.error('Vui lòng nhập giá trị'); return; }
                        try {
                            await api.categories.create({ loai: type, gia_tri: val, ma: '', mo_ta: '', thu_tu: 0 });
                            if (window.toast) window.toast.success('Thêm thành công');
                            window.modal.hide();
                            this.loadData();
                        } catch (e) { if (window.toast) window.toast.error(e.message); }
                    }
                }
            ]
        });
    },
    
    showEditModal(id, type, currentValue) {
        const content = `
            <div class="form-group mb-3">
                <label class="form-label" style="display: block; margin-bottom: 5px; font-weight: 500;">Giá trị mới</label>
                <input type="text" id="editCatValue" class="form-control" value="${currentValue}">
            </div>
        `;
        window.modal.show({
            title: 'Sửa danh mục',
            content: content,
            width: '400px',
            buttons: [
                { text: 'Hủy', class: 'btn-ghost', close: true },
                {
                    text: '<i class="fas fa-save"></i> Lưu', class: 'btn-primary',
                    onClick: async () => {
                        const val = document.getElementById('editCatValue').value.trim();
                        if (!val) { if (window.toast) window.toast.error('Vui lòng nhập giá trị'); return; }
                        try {
                            await api.categories.update(id, { loai: type, gia_tri: val, ma: '', mo_ta: '', thu_tu: 0 });
                            if (window.toast) window.toast.success('Cập nhật thành công');
                            window.modal.hide();
                            this.loadData();
                        } catch (e) { if (window.toast) window.toast.error(e.message); }
                    }
                }
            ]
        });
    },
    
    async deleteCategory(id) {
        window.modal.confirmDelete('Xóa danh mục', 'Bạn có chắc muốn xóa mục này?', async () => {
            try {
                await api.categories.delete(id);
                if (window.toast) window.toast.success('Đã xóa');
                this.loadData();
            } catch (e) { if (window.toast) window.toast.error(e.message); }
        });
    },

    filterCategory(type, keyword) {
        const listEl = document.getElementById(`cat-list-${type}`);
        const clearBtn = document.querySelector(`.clear-search-${type}`);
        if (clearBtn) {
            clearBtn.style.display = keyword ? 'block' : 'none';
        }
        
        if (!listEl) return;
        const items = listEl.querySelectorAll('.category-item');
        const lowerKeyword = keyword.toLowerCase();
        
        items.forEach(item => {
            const text = item.querySelector('.item-text').innerText.toLowerCase();
            if (text.includes(lowerKeyword)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    clearSearch(type) {
        const input = document.getElementById(`search-input-${type}`);
        if (input) {
            input.value = '';
            this.filterCategory(type, '');
        }
    },

    destroy() {}
};

/**
 * Trang Báo Cáo (Reports)
 */
const ReportsPage = {
    async _downloadExcel(btn, url, defaultFilename) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Đang xuất...';
        btn.disabled = true;
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + (window.Auth ? window.Auth.token : '') }
            });
            
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || "Lỗi khi xuất file Excel");
            }
            
            // Use the filename provided by the caller directly
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = defaultFilename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
            
            if (window.toast) window.toast.success("Xuất báo cáo thành công");
        } catch (e) {
            if (window.toast) window.toast.error(e.message);
            else alert(e.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },
    
    async exportExcel(btn) {
        const loaiVatTu = document.getElementById('reportLoaiVatTu')?.value;
        const params = { kho_id: api.getKhoId() };
        if (loaiVatTu) params.loai_vat_tu = loaiVatTu;
        const url = api.reports.getExcelUrl(params);
        
        const dateStr = new Date().toISOString().split('T')[0];
        let filename = `BaoCaoTonKho`;
        if (loaiVatTu) {
            const safeLoai = loaiVatTu.replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            filename += `_${safeLoai}`;
        }
        filename += `_${dateStr}.xlsx`;
        
        await this._downloadExcel(btn, url, filename);
    },

    async exportHistoryExcel(btn) {
        const fromDate = document.getElementById('reportFromDate')?.value;
        const toDate = document.getElementById('reportToDate')?.value;
        const loaiGiaoDich = document.getElementById('reportLoaiGiaoDich')?.value;
        
        if (!fromDate || !toDate) {
            if (window.toast) window.toast.error("Vui lòng chọn đầy đủ 'Từ ngày' và 'Đến ngày'");
            else alert("Vui lòng chọn đầy đủ 'Từ ngày' và 'Đến ngày'");
            return;
        }
        
        if (fromDate > toDate) {
            if (window.toast) window.toast.error("'Từ ngày' không thể lớn hơn 'Đến ngày'");
            else alert("'Từ ngày' không thể lớn hơn 'Đến ngày'");
            return;
        }
        
        const params = { kho_id: api.getKhoId() };
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        if (loaiGiaoDich) params.loai = loaiGiaoDich;
        
        const query = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/transactions/export-excel${query ? '?' + query : ''}`;
        
        const dateStr = new Date().toISOString().split('T')[0];
        let filename = `LichSuGiaoDich`;
        if (loaiGiaoDich === 'Nhập') filename = `LichSuNhap`;
        else if (loaiGiaoDich === 'Xuất') filename = `LichSuXuat`;
        filename += `_${dateStr}.xlsx`;
        
        await this._downloadExcel(btn, url, filename);
    },
    
    async exportLowStockExcel(btn) {
        const params = { kho_id: api.getKhoId(), low_stock: true };
        const url = api.reports.getExcelUrl(params);
        
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `HangDuoiDinhMuc_${dateStr}.xlsx`;
        
        await this._downloadExcel(btn, url, filename);
    },
    
    render(container) {
        container.innerHTML = `
            <div class="reports-container" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
                    <div>
                        <h2 style="font-weight: 700; color: var(--text-main); margin: 0 0 8px 0; font-size: 1.75rem;">Trung tâm Báo cáo</h2>
                        <p class="text-muted" style="margin: 0; font-size: 0.95rem;">Truy xuất, phân tích và tải xuống dữ liệu hệ thống</p>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
                    <!-- Card 1: Báo cáo Tồn kho (Active) -->
                    <div class="report-card" style="background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden; transition: all 0.3s ease; position: relative; cursor: pointer;">
                        <div style="height: 4px; background: linear-gradient(90deg, #3b82f6, #8b5cf6);"></div>
                        <div style="padding: 24px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 1.5rem;">
                                    <i class="fas fa-boxes-stacked"></i>
                                </div>
                                <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                                    <i class="fas fa-check-circle"></i> Sẵn sàng
                                </span>
                            </div>
                            <h4 style="margin: 0 0 10px 0; color: var(--text-main); font-weight: 600; font-size: 1.15rem;">Báo cáo Tồn kho</h4>
                            <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 15px; line-height: 1.6; min-height: 45px;">Tải xuống file Excel chứa toàn bộ dữ liệu vật tư, linh kiện và số lượng tồn kho hiện tại.</p>
                            
                            <div class="form-group mb-3">
                                <select id="reportLoaiVatTu" class="form-control" style="background-color: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-main);">
                                    <option value="" style="background: var(--bg-card); color: var(--text-main);">-- Tất cả loại hàng --</option>
                                    <option value="Vật tư tiêu hao" style="background: var(--bg-card); color: var(--text-main);">Vật tư tiêu hao</option>
                                    <option value="Linh kiện dự phòng" style="background: var(--bg-card); color: var(--text-main);">Linh kiện dự phòng</option>
                                    <option value="Công cụ dụng cụ" style="background: var(--bg-card); color: var(--text-main);">Công cụ dụng cụ</option>
                                    <option value="Tài sản cố định" style="background: var(--bg-card); color: var(--text-main);">Tài sản cố định</option>
                                </select>
                            </div>
                            
                            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 10px; border-radius: 8px; font-weight: 500; letter-spacing: 0.3px; transition: all 0.2s;" onclick="ReportsPage.exportExcel(this)">
                                <i class="fas fa-file-excel" style="margin-right: 8px;"></i> Xuất Excel Tồn Kho
                            </button>
                        </div>
                    </div>

                    <!-- Card 2: Báo cáo Nhập xuất -->
                    <div class="report-card" style="background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden; position: relative; transition: all 0.3s ease; cursor: pointer;">
                        <div style="height: 4px; background: linear-gradient(90deg, #10b981, #059669);"></div>
                        <div style="padding: 24px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 1.5rem;">
                                    <i class="fas fa-exchange-alt"></i>
                                </div>
                                <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                                    <i class="fas fa-check-circle"></i> Sẵn sàng
                                </span>
                            </div>
                            <h4 style="margin: 0 0 10px 0; color: var(--text-main); font-weight: 600; font-size: 1.15rem;">Lịch sử Nhập / Xuất</h4>
                            <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 15px; line-height: 1.6; min-height: 45px;">Báo cáo chi tiết các giao dịch nhập xuất kho trong một khoảng thời gian cụ thể.</p>
                            
                            <div class="form-group mb-3" style="display: flex; gap: 10px;">
                                <div style="flex: 1;">
                                    <label class="form-label text-muted" style="font-size: 0.85rem; margin-bottom: 4px;">Từ ngày:</label>
                                    <input type="date" id="reportFromDate" class="form-control" style="background-color: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.85rem; padding: 6px;">
                                </div>
                                <div style="flex: 1;">
                                    <label class="form-label text-muted" style="font-size: 0.85rem; margin-bottom: 4px;">Đến ngày:</label>
                                    <input type="date" id="reportToDate" class="form-control" style="background-color: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.85rem; padding: 6px;">
                                </div>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label class="form-label text-muted" style="font-size: 0.85rem; margin-bottom: 4px;">Loại giao dịch:</label>
                                <select id="reportLoaiGiaoDich" class="form-control" style="background-color: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-main);">
                                    <option value="" style="background: var(--bg-card); color: var(--text-main);">Nhập - Xuất (Tất cả)</option>
                                    <option value="Nhập" style="background: var(--bg-card); color: var(--text-main);">Chỉ Nhập kho</option>
                                    <option value="Xuất" style="background: var(--bg-card); color: var(--text-main);">Chỉ Xuất kho</option>
                                </select>
                            </div>
                            
                            <button class="btn btn-success" style="width: 100%; justify-content: center; padding: 10px; border-radius: 8px; font-weight: 500; letter-spacing: 0.3px; transition: all 0.2s; background: #10b981; border: none; color: white;" onclick="ReportsPage.exportHistoryExcel(this)">
                                <i class="fas fa-file-excel" style="margin-right: 8px;"></i> Xuất Lịch sử
                            </button>
                        </div>
                    </div>
                    
                    <!-- Card 3: Phân tích cảnh báo -->
                    <div class="report-card" style="background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden; position: relative; transition: all 0.3s ease; cursor: pointer;">
                        <div style="height: 4px; background: linear-gradient(90deg, #f59e0b, #d97706);"></div>
                        <div style="padding: 24px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(245, 158, 11, 0.1); display: flex; align-items: center; justify-content: center; color: #f59e0b; font-size: 1.5rem;">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                                    <i class="fas fa-check-circle"></i> Sẵn sàng
                                </span>
                            </div>
                            <h4 style="margin: 0 0 10px 0; color: var(--text-main); font-weight: 600; font-size: 1.15rem;">Hàng dưới Định Mức</h4>
                            <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6; min-height: 104px;">Tổng hợp danh sách các mặt hàng đang có số lượng tồn kho thấp hơn định mức an toàn. Rất hữu ích để lên kế hoạch nhập hàng.</p>
                            
                            <button class="btn btn-warning" style="width: 100%; justify-content: center; padding: 10px; border-radius: 8px; font-weight: 500; letter-spacing: 0.3px; transition: all 0.2s; background: #f59e0b; border: none; color: white;" onclick="ReportsPage.exportLowStockExcel(this)">
                                <i class="fas fa-file-excel" style="margin-right: 8px;"></i> Xuất Cảnh báo
                            </button>
                        </div>
                    </div>
                </div>
                
                <style>
                    .report-card:hover {
                        transform: translateY(-6px);
                        box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.3), 0 8px 12px -8px rgba(0, 0, 0, 0.1);
                        border-color: rgba(59, 130, 246, 0.4) !important;
                        opacity: 1 !important;
                    }
                    html[data-theme="light"] .report-card:hover {
                        box-shadow: 0 12px 28px -6px rgba(59, 130, 246, 0.15), 0 8px 12px -8px rgba(59, 130, 246, 0.1);
                        border-color: rgba(59, 130, 246, 0.3) !important;
                    }
                    .report-card .btn-primary:hover {
                        transform: scale(1.02);
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                    }
                </style>
            </div>
        `;
    },
    destroy() {}
};
