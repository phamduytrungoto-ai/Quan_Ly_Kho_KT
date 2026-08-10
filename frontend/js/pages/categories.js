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
    render(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Báo cáo & Xuất Dữ liệu</h3>
                </div>
                <div class="p-4">
                    <p class="mb-4">Bạn có thể tải xuống dữ liệu tồn kho hiện tại dưới dạng file Excel.</p>
                    <button class="btn btn-primary" onclick="window.location.href = api.reports.getExcelUrl()">
                        <i class="fas fa-file-excel"></i> Xuất Báo cáo Tồn Kho
                    </button>
                </div>
            </div>
        `;
    },
    destroy() {}
};
