/**
 * Trang Nhập Kho (Import Stock)
 */
const ImportPage = {
    table: null,
    params: { page: 1, page_size: 50, loai: 'NHAP' },
    autocompleteItems: [],

    async render(container) {
        const html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative;">
                <h2 style="text-align: center; width: 100%; font-size: 1.8rem; font-weight: bold; margin: 0; color: var(--text-heading);">LỊCH SỬ NHẬP KHO</h2>
                <button class="btn btn-success" id="btnToggleForm" style="position: absolute; right: 0;">
                    <i class="fas fa-plus"></i> Tạo phiếu nhập
                </button>
            </div>

            <div class="card mb-4" id="importFormCard" style="display: none;">
                <div class="card-header" style="border-bottom: 1px solid var(--border-color); margin-bottom: 15px; padding-bottom: 10px;">
                    <h3 class="card-title text-success"><i class="fas fa-arrow-down"></i> Tạo Phiếu Nhập Mới</h3>
                    <button class="btn btn-ghost btn-icon" id="btnCloseForm"><i class="fas fa-times"></i></button>
                </div>
                <form id="importForm">
                    <div class="form-grid mb-2">
                        <div class="form-group">
                            <label>Ngày nhập</label>
                            <input type="date" class="form-control" id="ngay" required value="${utils.getTodayYYYYMMDD()}">
                        </div>
                        <div class="form-group">
                            <label>Người nhập</label>
                            <input type="text" class="form-control" id="nguoi_nhap" required>
                        </div>
                    </div>
                    
                    <div class="form-group mb-2 autocomplete-wrapper" style="position: relative;">
                        <label>Tên hàng hóa (Gõ để tìm kiếm)</label>
                        <input type="text" class="form-control" id="ten_hang_search" placeholder="Nhập tên hoặc mã số..." autocomplete="off" required style="padding-right: 30px;">
                        <i class="fas fa-times clear-search-auto" id="clearSearchAuto"></i>
                        <input type="hidden" id="item_id" required>
                        <div class="autocomplete-dropdown" id="itemDropdown"></div>
                    </div>
                    
                    <div class="form-grid mb-2">
                        <div class="form-group">
                            <label>Mã số</label>
                            <input type="text" class="form-control" id="ma_so" readonly tabindex="-1">
                        </div>
                        <div class="form-group">
                            <label>Tồn hiện tại</label>
                            <input type="text" class="form-control" id="ton_hien_tai" readonly tabindex="-1">
                        </div>
                    </div>

                    <div class="form-grid mb-2">
                        <div class="form-group">
                            <label>Số lượng nhập</label>
                            <input type="number" class="form-control" id="so_luong" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>ĐVT</label>
                            <input type="text" class="form-control" id="don_vi_tinh" readonly tabindex="-1">
                        </div>
                    </div>

                    <div class="form-group mb-2">
                        <label>Ghi chú</label>
                        <textarea class="form-control" id="ghi_chu" rows="2"></textarea>
                    </div>

                    <div class="mt-2" style="text-align: right;">
                        <button type="button" class="btn btn-ghost mr-2" id="btnResetForm" style="margin-right: 10px;">Làm mới</button>
                        <button type="submit" class="btn btn-success"><i class="fas fa-check"></i> Xác nhận nhập kho</button>
                    </div>
                </form>
            </div>

            <div class="card">
                <div class="toolbar" style="display: flex; flex-wrap: wrap; align-items: center; gap: 15px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
                    <div class="search-box" style="max-width: 300px; min-width: 225px; flex-grow: 1;">
                        <i class="fas fa-search"></i>
                        <input type="text" class="form-control" id="searchHistory" placeholder="Tìm kiếm tên, mã hàng...">
                        <i class="fas fa-times clear-search" id="clearSearchHistory"></i>
                    </div>
                    <div class="filter-group" style="display: flex; align-items: center; gap: 10px;">
                        <label style="font-weight: bold; margin: 0; color: var(--text-primary); white-space: nowrap;">Từ Ngày</label>
                        <input type="date" class="form-control" id="fromDate" style="width: 140px;">
                    </div>
                    <div class="filter-group" style="display: flex; align-items: center; gap: 10px;">
                        <label style="font-weight: bold; margin: 0; color: var(--text-primary); white-space: nowrap;">Đến ngày</label>
                        <input type="date" class="form-control" id="toDate" style="width: 140px;">
                    </div>
                    <button class="btn btn-ghost" id="btnFilterHistory" title="Lọc dữ liệu"><i class="fas fa-search"></i></button>
                    
                    <button class="btn btn-ghost" id="btnExportExcel" style="margin-left: auto;">
                        <i class="fas fa-file-excel text-success"></i> Xuất Excel
                    </button>
                </div>
                
                <div id="importHistoryTable"></div>
            </div>
        `;
        
        container.innerHTML = html;
        this.initTable();
        this.attachEvents();
        this.loadHistory();
    },

    initTable() {
        this.table = new DataTable(document.querySelector('#page-import #importHistoryTable'), {
            pageSize: 50,
            onPageChange: (page) => {
                this.params.page = page;
                this.loadHistory();
            },
            columns: [
                { title: 'STT', key: 'id', width: '50px', align: 'center', render: (val, row, idx) => idx + 1 + (ImportPage.params.page - 1) * ImportPage.params.page_size },
                { title: 'NGÀY NHẬP', key: 'ngay', render: utils.formatDate },
                { title: 'TÊN HÀNG', key: 'ten_hang' },
                { title: 'Mã SỐ', key: 'ma_so' },
                { title: 'SỐ LƯỢNG', key: 'so_luong', align: 'right', render: (val) => `<b class="text-success">${utils.formatNumber(val)}</b>` },
                { title: 'ĐVT', key: 'don_vi_tinh', align: 'center' },
                { title: 'CÔNG ĐOẠN', key: 'cong_doan' },
                { title: 'NGƯỜI NHẬP', key: 'nguoi_nhap' },
                { title: 'TRẠNG THÁI', key: 'trang_thai', render: (val) => val === 'Có kiếm kê' ? '<span class="text-success"><i class="fas fa-check-circle"></i> Có</span>' : '<span class="text-muted">Không</span>' },
                { title: 'GHI CHÚ', key: 'ghi_chu' },
                { title: '', key: 'id', align: 'center', width: '40px', render: (id) => `
                    <button class="btn btn-ghost btn-icon text-danger" onclick="ImportPage.deleteTransaction(${id})" title="Xoá & Hoàn tồn kho"><i class="fas fa-trash"></i></button>
                `}
            ]
        });
    },

    attachEvents() {
        // Toggle Form (Redirect to Receipts page)
        document.querySelector('#page-import #btnToggleForm').addEventListener('click', () => {
            sessionStorage.setItem('openReceiptForm', 'true');
            window.location.hash = '#receipts';
        });

        // Search history
        const searchHistory = document.querySelector('#page-import #searchHistory');
        const clearSearchHistory = document.querySelector('#page-import #clearSearchHistory');
        
        searchHistory.addEventListener('input', utils.debounce((e) => {
            this.params.search = e.target.value;
            this.params.page = 1;
            clearSearchHistory.style.display = e.target.value ? 'block' : 'none';
            this.loadHistory();
        }, 500));

        clearSearchHistory.addEventListener('click', () => {
            searchHistory.value = '';
            this.params.search = '';
            this.params.page = 1;
            clearSearchHistory.style.display = 'none';
            this.loadHistory();
        });

        // Filter
        document.querySelector('#page-import #btnFilterHistory').addEventListener('click', () => {
            const fromDate = document.querySelector('#page-import #fromDate').value;
            const toDate = document.querySelector('#page-import #toDate').value;
            if (fromDate) this.params.from_date = fromDate;
            else delete this.params.from_date;
            
            if (toDate) this.params.to_date = toDate;
            else delete this.params.to_date;
            
            this.params.page = 1;
            this.loadHistory();
        });

        // Export Excel
        document.querySelector('#page-import #btnExportExcel').addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin text-success"></i> Đang xuất...';
            btn.disabled = true;
            try {
                const response = await fetch(api.transactions.getExcelUrl(this.params), {
                    headers: { 'Authorization': 'Bearer ' + window.Auth.token }
                });
                if (!response.ok) throw new Error("Lỗi khi xuất file Excel");
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lich_su_nhap.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                window.toast.error(error.message);
            } finally {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        });

        // Autocomplete
        const searchInput = document.querySelector('#page-import #ten_hang_search');
        const dropdown = document.querySelector('#page-import #itemDropdown');
        const clearSearchAuto = document.querySelector('#page-import #clearSearchAuto');

        let currentFocus = -1;

        searchInput.addEventListener('input', utils.debounce(async (e) => {
            const query = e.target.value.trim();
            clearSearchAuto.style.display = query ? 'block' : 'none';
            currentFocus = -1;
            if (query.length < 2) {
                dropdown.classList.remove('show');
                return;
            }
            try {
                this.autocompleteItems = await api.inventory.getAll(query);
                this.renderDropdown(this.autocompleteItems);
            } catch (error) {
                console.error('Lỗi tìm kiếm:', error);
            }
        }, 300));
        
        clearSearchAuto.addEventListener('click', () => {
            searchInput.value = '';
            document.querySelector('#page-import #item_id').value = '';
            clearSearchAuto.style.display = 'none';
            dropdown.classList.remove('show');
            currentFocus = -1;
            searchInput.focus();
        });

        searchInput.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            if (!items || items.length === 0) return;

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
                if (currentFocus > -1) {
                    items[currentFocus].click();
                }
            }
        });

        const setActive = (items) => {
            items.forEach(item => item.classList.remove('active'));
            if (currentFocus > -1 && items[currentFocus]) {
                items[currentFocus].classList.add('active');
                items[currentFocus].scrollIntoView({ block: 'nearest' });
            }
        };

        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (e.target !== searchInput && e.target !== dropdown) {
                dropdown.classList.remove('show');
            }
        });

        // Submit form
        document.querySelector('#page-import #importForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const itemId = document.querySelector('#page-import #item_id').value;
            if (!itemId) {
                window.toast.warning('Vui lòng chọn một mặt hàng từ danh sách tìm kiếm');
                return;
            }

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

            try {
                const data = {
                    item_id: parseInt(itemId),
                    ngay: document.querySelector('#page-import #ngay').value,
                    so_luong: parseInt(document.querySelector('#page-import #so_luong').value),
                    nguoi_nhap: document.querySelector('#page-import #nguoi_nhap').value,
                    ghi_chu: document.querySelector('#page-import #ghi_chu').value,
                    trang_thai: "Có kiếm kê"
                };

                await api.transactions.import(data);
                window.toast.success('Đã lưu phiếu nhập kho thành công!');
                
                // Reset form (giữ lại ngày và người nhập)
                document.querySelector('#page-import #item_id').value = '';
                document.querySelector('#page-import #ten_hang_search').value = '';
                document.querySelector('#page-import #ma_so').value = '';
                document.querySelector('#page-import #ton_hien_tai').value = '';
                document.querySelector('#page-import #so_luong').value = '';
                document.querySelector('#page-import #don_vi_tinh').value = '';
                document.querySelector('#page-import #ghi_chu').value = '';
                
                // Cập nhật bảng lịch sử
                this.params.page = 1;
                this.loadHistory();
                
                // Ẩn form sau khi tạo thành công (tuỳ chọn)
                formCard.style.display = 'none';
            } catch (error) {
                utils.handleApiError(error);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Xác nhận nhập kho';
            }
        });

        document.querySelector('#page-import #btnResetForm').addEventListener('click', () => {
            document.querySelector('#page-import #importForm').reset();
            document.querySelector('#page-import #item_id').value = '';
        });
    },

    renderDropdown(items) {
        const dropdown = document.querySelector('#page-import #itemDropdown');
        if (items.length === 0) {
            dropdown.innerHTML = '<div class="p-2 text-muted text-center">Không tìm thấy mặt hàng</div>';
        } else {
            dropdown.innerHTML = items.map(item => `
                <div class="autocomplete-item" onclick="ImportPage.selectItem(${item.id})">
                    <div class="item-name">${item.ten_hang}</div>
                    <div class="item-code">${item.ma_so} | Tồn: ${item.ton_cuoi} ${item.don_vi_tinh}</div>
                </div>
            `).join('');
        }
        dropdown.classList.add('show');
    },

    selectItem(id) {
        const item = this.autocompleteItems.find(i => i.id === id);
        if (item) {
            document.querySelector('#page-import #item_id').value = item.id;
            document.querySelector('#page-import #ten_hang_search').value = item.ten_hang;
            document.querySelector('#page-import #ma_so').value = item.ma_so;
            document.querySelector('#page-import #ton_hien_tai').value = utils.formatNumber(item.ton_cuoi);
            document.querySelector('#page-import #don_vi_tinh').value = item.don_vi_tinh;
            document.querySelector('#page-import #itemDropdown').classList.remove('show');
            document.querySelector('#page-import #so_luong').focus();
        }
    },

    async loadHistory() {
        try {
            const data = await api.transactions.list(this.params);
            this.table.updateData(data.transactions, data.total);
            this.table.options.currentPage = data.page;
            this.table.render();
        } catch (error) {
            utils.handleApiError(error);
        }
    },

    deleteTransaction(id) {
        window.modal.confirmDelete(
            'Xoá phiếu nhập', 
            'Bạn có chắc chắn muốn xoá phiếu nhập này? Tồn kho sẽ bị trừ đi số lượng tương ứng.',
            async () => {
                try {
                    await api.transactions.delete(id);
                    window.toast.success('Đã xoá phiếu nhập và cập nhật tồn kho');
                    this.loadHistory();
                } catch (error) {
                    utils.handleApiError(error);
                }
            }
        );
    },

    destroy() {}
};
