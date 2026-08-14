/**
 * Trang Tồn Kho (Inventory)
 */
const InventoryPage = {
    table: null,
    params: {
        page: 1,
        page_size: 50,
        search: '',
        sort_by: 'id',
        sort_dir: 'asc'
    },

    async render(container) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách Tồn Kho</h3>
                    <div class="action-btns">
                        <button class="btn btn-primary" id="btnExportExcel"><i class="fas fa-file-excel"></i> Xuất Excel</button>
                    </div>
                </div>
                
                <div class="toolbar" style="gap: 10px; display: flex; flex-wrap: wrap;">
                    <div class="search-box autocomplete-wrapper" style="max-width: 300px; min-width: 225px; flex-grow: 1; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); z-index: 1;"></i>
                        <input type="text" class="form-control" id="inventorySearchInput" placeholder="Tìm kiếm..." autocomplete="off" style="padding-left: 35px; padding-right: 30px;">
                        <i class="fas fa-times clear-search" id="clearInventorySearch" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; display: none; z-index: 1;"></i>
                        <div class="autocomplete-dropdown" id="inventorySearchDropdown" style="width: 100%; top: 100%; left: 0;"></div>
                    </div>
                    <div class="filter-group" style="gap: 10px; flex-wrap: wrap; display: flex; align-items: center;">
                        <label style="margin: 0; font-size: 0.9em; color: var(--text-muted); white-space: nowrap;">Từ:</label>
                        <input type="date" class="form-control" id="filterFromDate" style="width: 130px; padding: 0.4rem;">
                        
                        <label style="margin: 0; font-size: 0.9em; color: var(--text-muted); white-space: nowrap;">Đến:</label>
                        <input type="date" class="form-control" id="filterToDate" style="width: 130px; padding: 0.4rem;">

                        <select class="form-control" id="filterLowStock" style="max-width: 150px;">
                            <option value="">Tất cả TT tồn</option>
                            <option value="1">Dưới định mức</option>
                        </select>
                        <select class="form-control" id="filterLoaiVatTu" style="max-width: 150px;">
                            <option value="">Tất cả loại VT</option>
                            <option value="Vật tư tiêu hao">Tiêu hao</option>
                            <option value="Vật tư dự phòng">Dự phòng</option>
                            <option value="Công cụ dụng cụ">Công cụ dụng cụ</option>
                        </select>
                        <select class="form-control" id="filterStatus" style="max-width: 120px;">
                            <option value="">Tất cả kiểm kê</option>
                            <option value="Có kiểm kê">Có</option>
                            <option value="Không kiểm kê">Không</option>
                        </select>
                        <button class="btn btn-ghost btn-icon" id="btnRefresh" title="Làm mới"><i class="fas fa-sync-alt"></i></button>
                    </div>
                </div>

                <div id="inventoryTable"></div>
            </div>
        `;

        container.innerHTML = html;
        this.initTable();
        this.attachEvents();
        this.loadData();
    },

    initTable() {
        this.table = new DataTable(document.getElementById('inventoryTable'), {
            pageSize: this.params.page_size,
            onPageChange: (page) => {
                this.params.page = page;
                this.loadData();
            },
            onSort: (key, dir) => {
                this.params.sort_by = key;
                this.params.sort_dir = dir;
                this.params.page = 1;
                this.loadData();
            },
            rowClass: (row) => (row.ton_cuoi <= row.dinh_muc && row.dinh_muc > 0) || row.ton_cuoi === 0 ? 'low-stock' : '',
            onRowClick: (row) => this.showItemDetails(row),
            columns: [
                { title: 'STT', key: 'id', width: '50px', align: 'center', render: (val, row, idx) => idx + 1 + (InventoryPage.params.page - 1) * InventoryPage.params.page_size },
                {
                    title: 'HÌNH ẢNH', key: 'hinh_anh', width: '80px', align: 'center', render: (val, row) => {
                        let imgHtml = '<div class="text-muted" style="width: 45px; height: 45px; background: var(--bg-input); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin: 0 auto;"><i class="fas fa-image"></i></div>';
                        if (val) {
                            try {
                                let images = JSON.parse(val);
                                if (!Array.isArray(images)) images = [val];
                                if (images.length > 0) {
                                    imgHtml = `<img src="${images[0]}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color); background: white;" onerror="this.onerror=null; this.outerHTML='<div class=\\'text-muted\\' style=\\'width: 45px; height: 45px; background: var(--bg-input); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin: 0 auto;\\'><i class=\\'fas fa-image\\'></i></div>'">`;
                                }
                            } catch (e) {
                                imgHtml = `<img src="${val}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color); background: white;" onerror="this.onerror=null; this.outerHTML='<div class=\\'text-muted\\' style=\\'width: 45px; height: 45px; background: var(--bg-input); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin: 0 auto;\\'><i class=\\'fas fa-image\\'></i></div>'">`;
                            }
                        }
                        return imgHtml;
                    }
                },
                { title: 'TÊN HÀNG', key: 'ten_hang' },
                { title: 'MÃ SỐ', key: 'ma_so', width: '10px' },
                {
                    title: 'LOẠI VẬT TƯ', key: 'loai_vat_tu', align: 'center', render: (val) => {
                        if (val === 'Vật tư tiêu hao') return '<span class="badge" style="background: var(--info);">Tiêu hao</span>';
                        if (val === 'Vật tư dự phòng') return '<span class="badge" style="background: var(--warning);">Dự phòng</span>';
                        if (val === 'Công cụ dụng cụ') return '<span class="badge" style="background: var(--primary);">Công cụ</span>';
                        return val || '---';
                    }
                },
                { title: 'VỊ TRÍ', key: 'vi_tri' },
                { title: 'ĐVT', key: 'don_vi_tinh', align: 'center' },
                { title: 'TỒN ĐẦU', key: 'ton_dau', align: 'right', render: (val) => utils.formatNumber(val) },
                { title: 'NHẬP', key: 'tong_nhap', align: 'right', render: (val) => utils.formatNumber(val) },
                { title: 'XUẤT', key: 'tong_xuat', align: 'right', render: (val) => utils.formatNumber(val) },
                {
                    title: 'TỒN CUỐI', key: 'ton_cuoi', align: 'right', render: (val, row) => {
                        const isLow = (val <= row.dinh_muc && row.dinh_muc > 0) || val === 0;
                        return `<b class="${isLow ? 'text-danger' : ''}">${utils.formatNumber(val)}</b>`;
                    }
                },
                { title: 'ĐỊNH MỨC', key: 'dinh_muc', align: 'right', render: (val) => utils.formatNumber(val) },
                { title: 'TRẠNG THÁI', key: 'trang_thai', render: (val) => val === 'Có kiểm kê' ? '<span class="text-success"><i class="fas fa-check-circle"></i> Có</span>' : '<span class="text-muted">Không</span>' },
                { title: 'CÔNG ĐOẠN', key: 'cong_doan' },
                { title: 'GHI CHÚ', key: 'ghi_chu' }
            ]
        });
    },

    attachEvents() {
        // Search debounce & Autocomplete
        const searchInput = document.getElementById('inventorySearchInput');
        const clearSearch = document.getElementById('clearInventorySearch');
        const dropdown = document.getElementById('inventorySearchDropdown');
        let currentFocus = -1;

        const debouncedSearch = utils.debounce(async (value) => {
            this.params.search = value;
            this.params.page = 1;
            this.loadData();

            // Autocomplete logic
            currentFocus = -1;
            if (value.length < 2) {
                if (dropdown) dropdown.classList.remove('show');
                return;
            }

            try {
                if (!this.autocompleteItems) this.autocompleteItems = [];
                this.autocompleteItems = await api.inventory.getAll(value);
                this.renderDropdown(this.autocompleteItems);
            } catch (error) {
                console.error('Lỗi tìm kiếm gợi ý:', error);
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            clearSearch.style.display = e.target.value ? 'block' : 'none';
            debouncedSearch(e.target.value.trim());
        });

        searchInput.addEventListener('keydown', (e) => {
            if (!dropdown) return;
            const items = dropdown.querySelectorAll('.autocomplete-item');
            if (!items || items.length === 0 || !dropdown.classList.contains('show')) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus++;
                if (currentFocus >= items.length) currentFocus = 0;
                this.setActiveAutocomplete(items, currentFocus);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                if (currentFocus < 0) currentFocus = items.length - 1;
                this.setActiveAutocomplete(items, currentFocus);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1) {
                    items[currentFocus].click();
                }
            }
        });

        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            this.params.search = '';
            this.params.page = 1;
            clearSearch.style.display = 'none';
            if (dropdown) dropdown.classList.remove('show');
            currentFocus = -1;
            this.loadData();
        });

        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (dropdown && e.target !== searchInput && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        // Filters
        const dateChangeHandler = () => {
            const from = document.getElementById('filterFromDate').value;
            const to = document.getElementById('filterToDate').value;
            if (from) this.params.from_date = from; else delete this.params.from_date;
            if (to) this.params.to_date = to; else delete this.params.to_date;
            this.params.page = 1;
            this.loadData();
        };

        document.getElementById('filterFromDate').addEventListener('change', dateChangeHandler);
        document.getElementById('filterToDate').addEventListener('change', dateChangeHandler);

        document.getElementById('filterLowStock').addEventListener('change', (e) => {
            if (e.target.value) this.params.low_stock = true;
            else delete this.params.low_stock;
            this.params.page = 1;
            this.loadData();
        });

        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.params.trang_thai = e.target.value;
            this.params.page = 1;
            this.loadData();
        });

        document.getElementById('filterLoaiVatTu').addEventListener('change', (e) => {
            this.params.loai_vat_tu = e.target.value;
            this.params.page = 1;
            this.loadData();
        });

        // Refresh
        document.getElementById('btnRefresh').addEventListener('click', () => {
            // Reset UI
            searchInput.value = '';
            clearSearch.style.display = 'none';
            document.getElementById('filterFromDate').value = '';
            document.getElementById('filterToDate').value = '';
            document.getElementById('filterLowStock').value = '';
            document.getElementById('filterStatus').value = '';
            document.getElementById('filterLoaiVatTu').value = '';

            // Reset params
            this.params = {
                page: 1,
                page_size: this.params.page_size,
                search: '',
                sort_by: this.params.sort_by,
                sort_dir: this.params.sort_dir
            };

            this.loadData();
            if (window.toast) window.toast.success('Đã làm mới dữ liệu');
        });

        // Export
        document.getElementById('btnExportExcel').addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xuất...';
            btn.disabled = true;
            try {
                // Pass current params to get Excel URL with same filters
                const response = await fetch(api.reports.getExcelUrl(this.params), {
                    headers: { 'Authorization': 'Bearer ' + window.Auth.token }
                });
                if (!response.ok) throw new Error("Lỗi khi xuất file Excel");

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                a.download = `TonKho_${dateStr}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                if (window.toast) {
                    window.toast.error(error.message);
                } else {
                    alert(error.message);
                }
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    },

    async loadData() {
        try {
            const data = await api.inventory.list(this.params);
            this.table.updateData(data.items, data.total);
            this.table.options.currentPage = data.page;
            this.table.render(); // Re-render to update pagination UI
        } catch (error) {
            utils.handleApiError(error);
        }
    },

    renderDropdown(items) {
        const dropdown = document.getElementById('inventorySearchDropdown');
        if (!dropdown) return;

        if (items.length === 0) {
            dropdown.innerHTML = '<div class="p-2 text-muted text-center">Không tìm thấy mặt hàng</div>';
        } else {
            dropdown.innerHTML = items.map(item => `
                <div class="autocomplete-item" onclick="InventoryPage.selectItem(${item.id})" style="padding: 10px; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                    <div class="item-name" style="font-weight: 500;">${item.ten_hang}</div>
                    <div class="item-code" style="font-size: 0.85em; color: var(--text-muted);">${item.ma_so} | Tồn: ${item.ton_cuoi} ${item.don_vi_tinh}</div>
                </div>
            `).join('');
        }
        dropdown.classList.add('show');
    },

    selectItem(id) {
        if (!this.autocompleteItems) return;
        const item = this.autocompleteItems.find(i => i.id === id);
        if (item) {
            const searchInput = document.getElementById('inventorySearchInput');
            searchInput.value = item.ten_hang;
            this.params.search = item.ten_hang;
            this.params.page = 1;

            document.getElementById('inventorySearchDropdown').classList.remove('show');
            document.getElementById('clearInventorySearch').style.display = 'block';

            this.loadData();
        }
    },

    setActiveAutocomplete(items, currentFocus) {
        items.forEach(item => item.style.backgroundColor = '');
        if (currentFocus > -1 && items[currentFocus]) {
            items[currentFocus].style.backgroundColor = 'var(--bg-hover)';
            items[currentFocus].scrollIntoView({ block: 'nearest' });
        }
    },

    showItemDetails(item) {
        this.currentItem = item;
        let images = [];
        if (item.hinh_anh) {
            try {
                images = JSON.parse(item.hinh_anh);
                if (!Array.isArray(images)) images = [item.hinh_anh];
            } catch (e) {
                images = [item.hinh_anh];
            }
        }

        let imagesHtml = '';
        if (images.length > 0) {
            let gridStyles = '';
            if (images.length === 1) {
                gridStyles = 'grid-template-columns: 1fr; grid-template-rows: 1fr;';
            } else if (images.length === 2) {
                gridStyles = 'grid-template-columns: 1fr 1fr; grid-template-rows: 1fr;';
            } else if (images.length <= 4) {
                gridStyles = 'grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;';
            } else {
                gridStyles = 'grid-template-columns: repeat(3, 1fr); grid-auto-rows: 70px; align-content: start;';
            }

            imagesHtml = `<div style="display: grid; ${gridStyles} gap: 8px; width: 100%; height: 100%; overflow-y: auto;">`;
            images.forEach(img => {
                imagesHtml += InventoryPage.generateThumbnailHtml(img);
            });
            imagesHtml += `</div>`;
        } else {
            imagesHtml = `<div class="text-muted" style="height: 100%; display: flex; flex-direction: column; justify-content: center;"><i class="fas fa-image fa-3x mb-2"></i><br>Chưa có hình ảnh</div>`;
        }

        const content = `
            <div class="item-details-container" style="display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start;">
                <!-- Cột trái: Hình ảnh -->
                <div class="item-image-section" style="text-align: center; border: 1px solid var(--border-color); padding: 10px; border-radius: var(--border-radius-sm);">
                    <div id="imageGalleryContainer" style="width: 100%; height: 250px; background: var(--bg-input); border-radius: 8px; margin-bottom: 15px; overflow: hidden; padding: 10px;">
                        ${imagesHtml}
                    </div>
                    
                    <input type="file" id="itemImageInput" accept="image/*" style="display: none;">
                    <button class="btn btn-outline-primary btn-sm w-100" onclick="document.getElementById('itemImageInput').click()">
                        <i class="fas fa-upload"></i> Tải ảnh lên
                    </button>
                    <div id="uploadProgress" class="text-sm text-muted mt-2" style="display:none;">Đang tải lên...</div>
                </div>

                <!-- Cột phải: Thông tin & Thông số KT -->
                <div class="item-info-section" style="display: flex; flex-direction: column; height: 100%;">
                    <h3 style="margin-top: 0; color: var(--text-heading); font-size: 1.2rem;">${item.ten_hang}</h3>
                    <div class="text-muted mb-3">Mã số: <b>${item.ma_so}</b> | Mã QL: <b>${item.ma_quan_ly || '---'}</b></div>
                    
                    <div style="background: var(--bg-input); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-building" style="width:16px; text-align:center; margin-right:5px;"></i>Nhà cung cấp</span>
                                <b style="font-size: 1.05rem; color: var(--text-primary);">${item.nha_cung_cap || '---'}</b>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-map-marker-alt" style="width:16px; text-align:center; margin-right:5px;"></i>Vị trí</span>
                                <b style="font-size: 1.05rem; color: var(--text-primary);">${item.vi_tri || '---'}</b>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-boxes" style="width:16px; text-align:center; margin-right:5px;"></i>Loại vật tư</span>
                                <b style="font-size: 1.05rem; color: var(--text-primary);">${item.loai_vat_tu || '---'}</b>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-cubes" style="width:16px; text-align:center; margin-right:5px;"></i>Tồn kho hiện tại</span>
                                <b style="font-size: 1.05rem;" class="${(item.ton_cuoi <= item.dinh_muc && item.dinh_muc > 0) || item.ton_cuoi === 0 ? 'text-danger' : 'text-success'}">${utils.formatNumber(item.ton_cuoi)} ${item.don_vi_tinh}</b>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-cogs" style="width:16px; text-align:center; margin-right:5px;"></i>Công đoạn</span>
                                <b style="font-size: 1.05rem; color: var(--text-primary);">${item.cong_doan || '---'}</b>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px; grid-column: span 2;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-tag" style="width:16px; text-align:center; margin-right:5px;"></i>Đơn giá</span>
                                <b style="font-size: 1.05rem;" class="text-primary">${utils.formatCurrency(item.don_gia || 0)}</b>
                            </div>
                        </div>
                    </div>

                    <hr style="border-color: var(--border-color); margin: 15px 0;">
                    
                    <div class="form-group mb-0" style="flex: 1; display: flex; flex-direction: column;">
                        <label class="d-flex justify-content-between align-items-center mb-2">
                            <span>Thông số kỹ thuật & Chi tiết</span>
                        </label>
                        <textarea class="form-control" id="itemSpecs" style="flex: 1; min-height: 150px; resize: none;" placeholder="Nhập thông số kỹ thuật chi tiết...">${item.thong_so_ky_thuat || ''}</textarea>
                    </div>
                </div>
            </div>
        `;

        window.modal.show({
            title: 'Chi Tiết Sản Phẩm',
            content: content,
            width: '900px',
            buttons: [
                {
                    text: '<i class="fas fa-trash"></i> Xóa',
                    class: 'btn-ghost me-auto',
                    onClick: (modal) => {
                        window.modal.hide();
                        window.modal.confirmDelete('Xác nhận xóa', `Bạn có chắc muốn xóa sản phẩm <b>${item.ten_hang}</b> không?`, async () => {
                            try {
                                await api.inventory.delete(item.id);
                                window.toast.success('Đã xóa sản phẩm');
                                this.loadData();
                            } catch (e) {
                                window.toast.error(e.message || 'Lỗi khi xóa');
                            }
                        });
                    }
                },
                {
                    text: '<i class="fas fa-edit"></i> Sửa',
                    class: 'btn-ghost',
                    onClick: (modal) => {
                        window.modal.hide();
                        this.showEditItemForm(item);
                    }
                },
                { text: 'Đóng', class: 'btn-ghost text-muted', close: true },
                {
                    text: '<i class="fas fa-save"></i> Lưu Thông Số',
                    class: 'btn-ghost',
                    onClick: async (modal) => {
                        try {
                            const newSpecs = document.getElementById('itemSpecs').value.trim();
                            // Update the item via API
                            await api.inventory.update(item.id, {
                                ...item,
                                thong_so_ky_thuat: newSpecs
                            });

                            window.toast.success('Đã lưu thông số kỹ thuật');
                            this.loadData(); // Refresh table
                            window.modal.hide();
                        } catch (error) {
                            window.toast.error('Lỗi khi lưu thông số');
                        }
                    }
                }
            ]
        });

        // Attach event listener for image upload
        setTimeout(() => {
            const fileInput = document.getElementById('itemImageInput');
            if (fileInput) {
                fileInput.addEventListener('change', async (e) => {
                    if (!e.target.files || e.target.files.length === 0) return;
                    const file = e.target.files[0];

                    const progress = document.getElementById('uploadProgress');
                    progress.style.display = 'block';

                    try {
                        const res = await api.inventory.uploadImage(item.id, file);
                        window.toast.success('Tải ảnh lên thành công');

                        // Cập nhật lại UI ngay lập tức
                        if (res.images && res.images.length > 0) {
                            item.hinh_anh = JSON.stringify(res.images);
                            const imgContainer = document.getElementById('imageGalleryContainer');

                            let imagesHtml = '';
                            if (res.images.length > 0) {
                                let gridStyles = '';
                                if (res.images.length === 1) {
                                    gridStyles = 'grid-template-columns: 1fr; grid-template-rows: 1fr;';
                                } else if (res.images.length === 2) {
                                    gridStyles = 'grid-template-columns: 1fr 1fr; grid-template-rows: 1fr;';
                                } else if (res.images.length <= 4) {
                                    gridStyles = 'grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;';
                                } else {
                                    gridStyles = 'grid-template-columns: repeat(3, 1fr); grid-auto-rows: 70px; align-content: start;';
                                }

                                imagesHtml = `<div style="display: grid; ${gridStyles} gap: 8px; width: 100%; height: 100%; overflow-y: auto;">`;
                                res.images.forEach(img => {
                                    imagesHtml += InventoryPage.generateThumbnailHtml(img);
                                });
                                imagesHtml += `</div>`;

                                imgContainer.innerHTML = imagesHtml;
                            }
                        }

                        // Refresh data in background
                        this.loadData();
                    } catch (error) {
                        window.toast.error(error.message || 'Lỗi tải ảnh');
                    } finally {
                        progress.style.display = 'none';
                        fileInput.value = ''; // reset
                    }
                });
            }
        }, 100);
    },

    showEditItemForm(item) {
        const content = `
            <form id="editItemForm">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-weight: 500; color: var(--text-primary);">Tên hàng <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" name="ten_hang" value="${item.ten_hang || ''}" required>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-weight: 500; color: var(--text-primary);">Mã số <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" name="ma_so" value="${item.ma_so || ''}" required>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-weight: 500; color: var(--text-primary);">Mã quản lý</label>
                        <input type="text" class="form-control" name="ma_quan_ly" value="${item.ma_quan_ly || ''}">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-weight: 500; color: var(--text-primary);">Loại vật tư</label>
                        <select class="form-select form-control" name="loai_vat_tu">
                            <option value="Vật tư tiêu hao" ${item.loai_vat_tu === 'Vật tư tiêu hao' ? 'selected' : ''}>Vật tư tiêu hao</option>
                            <option value="Vật tư dự phòng" ${item.loai_vat_tu === 'Vật tư dự phòng' ? 'selected' : ''}>Vật tư dự phòng</option>
                            <option value="Công cụ dụng cụ" ${item.loai_vat_tu === 'Công cụ dụng cụ' ? 'selected' : ''}>Công cụ dụng cụ</option>
                        </select>
                    </div>
                    <div class="autocomplete-wrapper" style="display: flex; flex-direction: column; gap: 5px; position: relative;">
                        <label style="font-weight: 500; color: var(--text-primary);">Nhà cung cấp</label>
                        <input type="text" class="form-control" id="edit_nha_cung_cap" name="nha_cung_cap" value="${item.nha_cung_cap || ''}" autocomplete="off">
                        <i class="fas fa-times btn-clear" style="position: absolute; right: 10px; bottom: 8px; cursor: pointer; color: var(--text-muted); display: none; padding: 2px;"></i>
                        <ul class="autocomplete-dropdown" id="dropdown_edit_nha_cung_cap" style="display: none; max-height: 150px; overflow-y: auto;"></ul>
                    </div>
                    <div class="autocomplete-wrapper" style="display: flex; flex-direction: column; gap: 5px; position: relative;">
                        <label style="font-weight: 500; color: var(--text-primary);">Vị trí</label>
                        <input type="text" class="form-control" id="edit_vi_tri" name="vi_tri" value="${item.vi_tri || ''}" autocomplete="off">
                        <i class="fas fa-times btn-clear" style="position: absolute; right: 10px; bottom: 8px; cursor: pointer; color: var(--text-muted); display: none; padding: 2px;"></i>
                        <ul class="autocomplete-dropdown" id="dropdown_edit_vi_tri" style="display: none; max-height: 150px; overflow-y: auto;"></ul>
                    </div>
                    <div class="autocomplete-wrapper" style="display: flex; flex-direction: column; gap: 5px; position: relative;">
                        <label style="font-weight: 500; color: var(--text-primary);">Đơn vị tính</label>
                        <input type="text" class="form-control" id="edit_don_vi_tinh" name="don_vi_tinh" value="${item.don_vi_tinh || ''}" autocomplete="off">
                        <i class="fas fa-times btn-clear" style="position: absolute; right: 10px; bottom: 8px; cursor: pointer; color: var(--text-muted); display: none; padding: 2px;"></i>
                        <ul class="autocomplete-dropdown" id="dropdown_edit_don_vi_tinh" style="display: none; max-height: 150px; overflow-y: auto;"></ul>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-weight: 500; color: var(--text-primary);">Đơn giá</label>
                        <input type="number" class="form-control" name="don_gia" value="${item.don_gia || 0}">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-weight: 500; color: var(--text-primary);">Định mức</label>
                        <input type="number" class="form-control" name="dinh_muc" value="${item.dinh_muc || 0}">
                    </div>
                    <div class="autocomplete-wrapper" style="display: flex; flex-direction: column; gap: 5px; position: relative;">
                        <label style="font-weight: 500; color: var(--text-primary);">Công đoạn</label>
                        <input type="text" class="form-control" id="edit_cong_doan" name="cong_doan" value="${item.cong_doan || ''}" autocomplete="off">
                        <i class="fas fa-times btn-clear" style="position: absolute; right: 10px; bottom: 8px; cursor: pointer; color: var(--text-muted); display: none; padding: 2px;"></i>
                        <ul class="autocomplete-dropdown" id="dropdown_edit_cong_doan" style="display: none; max-height: 150px; overflow-y: auto;"></ul>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-weight: 500; color: var(--text-primary);">Trạng thái</label>
                        <select class="form-select form-control" name="trang_thai">
                            <option value="Có kiểm kê" ${item.trang_thai === 'Có kiểm kê' ? 'selected' : ''}>Có kiểm kê</option>
                            <option value="Không" ${item.trang_thai !== 'Có kiểm kê' ? 'selected' : ''}>Không</option>
                        </select>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px; grid-column: span 2;">
                        <label style="font-weight: 500; color: var(--text-primary);">Ghi chú</label>
                        <input type="text" class="form-control" name="ghi_chu" value="${item.ghi_chu || ''}">
                    </div>
                </div>
            </form>
        `;

        window.modal.show({
            title: 'Sửa Thông Tin Sản Phẩm',
            content: content,
            width: '800px',
            buttons: [
                { text: 'Hủy', class: 'btn-ghost text-muted', close: true },
                {
                    text: '<i class="fas fa-save"></i> Cập Nhật',
                    class: 'btn-primary',
                    onClick: async (modal) => {
                        const form = document.getElementById('editItemForm');
                        if (!form.reportValidity()) return;

                        const formData = new FormData(form);
                        const updateData = Object.fromEntries(formData.entries());
                        updateData.dinh_muc = parseInt(updateData.dinh_muc) || 0;
                        updateData.don_gia = parseFloat(updateData.don_gia) || 0;

                        try {
                            await api.inventory.update(item.id, {
                                ...item,
                                ...updateData
                            });

                            window.toast.success('Đã cập nhật sản phẩm');
                            this.loadData();
                            window.modal.hide();

                            // Re-open item details
                            setTimeout(() => {
                                api.inventory.get(item.id).then(updatedItem => {
                                    this.showItemDetails(updatedItem);
                                });
                            }, 300);
                        } catch (error) {
                            window.toast.error(error.message || 'Lỗi khi cập nhật');
                        }
                    }
                }
            ]
        });

        setTimeout(() => {
            // nha_cung_cap is not a standard category yet, but we'll try to fetch it if it exists.
            this.setupModalAutocomplete('edit_nha_cung_cap', 'dropdown_edit_nha_cung_cap', 'nha_cung_cap');
            this.setupModalAutocomplete('edit_vi_tri', 'dropdown_edit_vi_tri', 'vi_tri');
            this.setupModalAutocomplete('edit_don_vi_tinh', 'dropdown_edit_don_vi_tinh', 'dvt');
            this.setupModalAutocomplete('edit_cong_doan', 'dropdown_edit_cong_doan', 'cong_doan');
        }, 100);
    },

    setupModalAutocomplete(inputId, dropdownId, categoryCode) {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(dropdownId);
        if (!input || !dropdown) return;

        let currentFocus = -1;
        if (!this.categoryCache) this.categoryCache = {};

        const clearBtn = input.parentElement.querySelector('.btn-clear');
        if (clearBtn) {
            clearBtn.style.display = input.value ? 'block' : 'none';
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                input.value = '';
                clearBtn.style.display = 'none';
                dropdown.style.display = 'none';
                input.focus();
            });
        }

        input.addEventListener('input', async (e) => {
            const val = e.target.value;
            if (clearBtn) {
                clearBtn.style.display = val ? 'block' : 'none';
            }

            const lowerVal = val.toLowerCase();
            currentFocus = -1;
            if (!lowerVal) {
                dropdown.style.display = 'none';
                return;
            }

            if (!this.categoryCache[categoryCode]) {
                try {
                    this.categoryCache[categoryCode] = await api.categories.list(categoryCode);
                } catch (err) {
                    this.categoryCache[categoryCode] = [];
                }
            }

            const items = this.categoryCache[categoryCode] || [];
            const matches = items.filter(i => i.gia_tri.toLowerCase().includes(lowerVal));

            if (matches.length > 0) {
                dropdown.innerHTML = matches.map(i => `<li data-name="${i.gia_tri.replace(/"/g, '&quot;')}">${i.gia_tri}</li>`).join('');
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        });

        dropdown.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) {
                input.value = li.dataset.name;
                dropdown.style.display = 'none';
                input.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target !== input && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        input.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('li');
            if (!items || items.length === 0 || dropdown.style.display === 'none') return;

            const setActive = (items) => {
                items.forEach(item => {
                    item.classList.remove('active');
                });
                if (currentFocus > -1 && items[currentFocus]) {
                    items[currentFocus].classList.add('active');
                    items[currentFocus].scrollIntoView({ block: 'nearest' });
                }
            };

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus++;
                if (currentFocus >= items.length) currentFocus = 0;
                setActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                if (currentFocus < 0) currentFocus = items.length - 1;
                setActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1 && items[currentFocus]) {
                    items[currentFocus].click();
                } else if (items.length > 0) {
                    items[0].click();
                }
            }
        });
    },

    openLightbox(imgSrc) {
        // Find all images in the gallery to enable navigation
        const galleryImgs = document.querySelectorAll('#imageGalleryContainer img');
        this.lightboxImages = Array.from(galleryImgs).map(img => img.src);
        this.currentLightboxIndex = this.lightboxImages.findIndex(src => src.includes(imgSrc));
        if (this.currentLightboxIndex === -1) this.currentLightboxIndex = 0;

        let lightbox = document.getElementById('inventoryLightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'inventoryLightbox';
            lightbox.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 9999999;';

            const img = document.createElement('img');
            img.id = 'inventoryLightboxImg';
            img.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); user-select: none;';

            // Add navigation buttons
            const prevBtn = document.createElement('div');
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.style.cssText = 'position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: white; font-size: 3rem; cursor: pointer; padding: 20px; z-index: 10000000; opacity: 0.7;';
            prevBtn.onclick = (e) => { e.stopPropagation(); InventoryPage.navigateLightbox(-1); };
            prevBtn.onmouseover = () => prevBtn.style.opacity = '1';
            prevBtn.onmouseout = () => prevBtn.style.opacity = '0.7';

            const nextBtn = document.createElement('div');
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.style.cssText = 'position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: white; font-size: 3rem; cursor: pointer; padding: 20px; z-index: 10000000; opacity: 0.7;';
            nextBtn.onclick = (e) => { e.stopPropagation(); InventoryPage.navigateLightbox(1); };
            nextBtn.onmouseover = () => nextBtn.style.opacity = '1';
            nextBtn.onmouseout = () => nextBtn.style.opacity = '0.7';

            // Close button
            const closeBtn = document.createElement('div');
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.style.cssText = 'position: absolute; top: 20px; right: 30px; color: white; font-size: 2rem; cursor: pointer; z-index: 10000000; opacity: 0.7;';
            closeBtn.onclick = (e) => { e.stopPropagation(); InventoryPage.closeLightbox(); };
            closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
            closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';

            // Delete button
            const deleteBtn = document.createElement('div');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.style.cssText = 'position: absolute; top: 20px; right: 80px; color: #dc3545; font-size: 2rem; cursor: pointer; z-index: 10000000; opacity: 0.7;';
            deleteBtn.title = 'Xóa ảnh này';
            deleteBtn.onclick = (e) => { e.stopPropagation(); InventoryPage.deleteLightboxImage(); };
            deleteBtn.onmouseover = () => deleteBtn.style.opacity = '1';
            deleteBtn.onmouseout = () => deleteBtn.style.opacity = '0.7';

            lightbox.appendChild(prevBtn);
            lightbox.appendChild(img);
            lightbox.appendChild(nextBtn);
            lightbox.appendChild(deleteBtn);
            lightbox.appendChild(closeBtn);

            // Close on background click
            lightbox.onclick = function (e) {
                if (e.target === lightbox) InventoryPage.closeLightbox();
            };

            document.body.appendChild(lightbox);

            // Handle keyboard navigation globally
            document.addEventListener('keydown', (e) => {
                const lb = document.getElementById('inventoryLightbox');
                if (lb && lb.style.display !== 'none') {
                    if (e.key === 'ArrowLeft') InventoryPage.navigateLightbox(-1);
                    else if (e.key === 'ArrowRight') InventoryPage.navigateLightbox(1);
                    else if (e.key === 'Escape') InventoryPage.closeLightbox();
                }
            });
        }

        this.updateLightboxImage();
        lightbox.style.display = 'flex';
    },

    updateLightboxImage() {
        const img = document.getElementById('inventoryLightboxImg');
        if (img && this.lightboxImages && this.lightboxImages.length > 0) {
            img.src = this.lightboxImages[this.currentLightboxIndex];
        }
    },

    navigateLightbox(direction) {
        if (!this.lightboxImages || this.lightboxImages.length === 0) return;
        this.currentLightboxIndex += direction;
        if (this.currentLightboxIndex < 0) this.currentLightboxIndex = this.lightboxImages.length - 1;
        if (this.currentLightboxIndex >= this.lightboxImages.length) this.currentLightboxIndex = 0;
        this.updateLightboxImage();
    },

    closeLightbox() {
        const lightbox = document.getElementById('inventoryLightbox');
        if (lightbox) lightbox.style.display = 'none';
    },

    deleteLightboxImage() {
        if (!this.lightboxImages || this.lightboxImages.length === 0) return;
        const currentImgSrc = this.lightboxImages[this.currentLightboxIndex];
        this.closeLightbox();
        this.deleteImage(currentImgSrc);
    },

    deleteImage(imgSrc) {
        if (!this.currentItem) return;

        window.modal.confirmDelete('Xác nhận xóa ảnh', 'Bạn có chắc muốn xóa ảnh này khỏi sản phẩm không?', async () => {
            try {
                let images = [];
                if (this.currentItem.hinh_anh) {
                    try {
                        images = JSON.parse(this.currentItem.hinh_anh);
                        if (!Array.isArray(images)) images = [this.currentItem.hinh_anh];
                    } catch (e) {
                        images = [this.currentItem.hinh_anh];
                    }
                }

                // Remove matching image (comparing ends to handle relative vs absolute URL mismatches)
                images = images.filter(img => !imgSrc.endsWith(img) && !img.endsWith(imgSrc));

                const newHinhAnhStr = images.length > 0 ? JSON.stringify(images) : '';

                await api.inventory.update(this.currentItem.id, {
                    ...this.currentItem,
                    hinh_anh: newHinhAnhStr
                });

                window.toast.success('Đã xóa ảnh thành công');

                this.loadData();
                setTimeout(() => {
                    api.inventory.get(this.currentItem.id).then(updatedItem => {
                        this.showItemDetails(updatedItem);
                    });
                }, 100);
            } catch (error) {
                window.toast.error(error.message || 'Lỗi khi xóa ảnh');
            }
        });
    },

    generateThumbnailHtml(img) {
        return `
            <div style="position: relative; width: 100%; height: 100%; min-height: 70px;">
                <img src="${img}" onclick="InventoryPage.openLightbox('${img}')" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); cursor: zoom-in;" title="Nhấn để xem ảnh lớn" alt="Hình ảnh sản phẩm">
                <div onclick="InventoryPage.deleteImage('${img}')" style="position: absolute; top: -8px; right: -8px; background: white; color: #dc3545; border-radius: 50%; width: 22px; height: 22px; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.5); font-size: 12px; z-index: 10;" title="Xóa ảnh này">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        `;
    },

    destroy() { }
};
