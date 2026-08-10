/**
 * Trang Xuất Kho (Export Stock)
 */
const ExportPage = {
    table: null,
    params: { page: 1, page_size: 50, loai: 'XUAT' },
    autocompleteItems: [],

    async render(container) {
        const html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative;">
                <h2 style="text-align: center; width: 100%; font-size: 1.8rem; font-weight: bold; margin: 0; color: var(--text-heading);">LỊCH SỬ XUẤT KHO</h2>
                <button class="btn btn-warning" id="btnToggleForm" style="position: absolute; right: 0;">
                    <i class="fas fa-plus"></i> Tạo phiếu xuất
                </button>
            </div>

            <div class="card mb-4" id="exportFormCard" style="display: none;">
                <div class="card-header" style="border-bottom: 1px solid var(--border-color); margin-bottom: 15px; padding-bottom: 10px;">
                    <h3 class="card-title text-warning"><i class="fas fa-arrow-up"></i> Tạo Phiếu Xuất Mới</h3>
                    <button class="btn btn-ghost btn-icon" id="btnCloseForm"><i class="fas fa-times"></i></button>
                </div>
                <form id="exportForm">
                    <div class="form-grid mb-2">
                        <div class="form-group">
                            <label>Ngày xuất</label>
                            <input type="date" class="form-control" id="ngay" required value="${utils.getTodayYYYYMMDD()}">
                        </div>
                        <div class="form-group">
                            <label>Người yêu cầu</label>
                            <input type="text" class="form-control" id="nguoi_yeu_cau" required>
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
                            <label>Số lượng xuất</label>
                            <input type="number" class="form-control" id="so_luong" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>ĐVT</label>
                            <input type="text" class="form-control" id="don_vi_tinh" readonly tabindex="-1">
                        </div>
                    </div>

                    <div class="form-grid mb-2">
                        <div class="form-group">
                            <label>Công đoạn</label>
                            <select class="form-control" id="cong_doan" required>
                                <option value="">Chọn công đoạn...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Người nhận</label>
                            <input type="text" class="form-control" id="nguoi_nhan" required>
                        </div>
                    </div>
                    
                    <div class="form-grid mb-2">
                        <div class="form-group">
                            <label>Người xuất (Thủ kho)</label>
                            <input type="text" class="form-control" id="nguoi_xuat" required>
                        </div>
                    </div>

                    <div class="form-group mb-2">
                        <label>Ghi chú</label>
                        <textarea class="form-control" id="ghi_chu" rows="2"></textarea>
                    </div>

                    <div class="mt-2" style="text-align: right;">
                        <button type="button" class="btn btn-ghost mr-2" id="btnResetForm" style="margin-right: 10px;">Làm mới</button>
                        <button type="submit" class="btn btn-warning"><i class="fas fa-check"></i> Xác nhận xuất kho</button>
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
                
                <div id="exportHistoryTable"></div>
            </div>
        `;
        
        container.innerHTML = html;
        this.initTable();
        this.attachEvents();
        this.loadCategories();
        this.loadHistory();
    },

    async loadCategories() {
        try {
            const congDoan = await api.categories.list('cong_doan');
            const select = document.querySelector('#page-export #cong_doan');
            congDoan.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.gia_tri;
                opt.textContent = c.gia_tri;
                select.appendChild(opt);
            });
        } catch (error) {
            console.error('Lỗi tải danh mục:', error);
        }
    },

    initTable() {
        this.table = new DataTable(document.querySelector('#page-export #exportHistoryTable'), {
            pageSize: 50,
            onPageChange: (page) => {
                this.params.page = page;
                this.loadHistory();
            },
            columns: [
                { title: 'STT', key: 'id', width: '50px', align: 'center', render: (val, row, idx) => idx + 1 + (ExportPage.params.page - 1) * ExportPage.params.page_size },
                { title: 'NGÀY XUẤT', key: 'ngay', render: utils.formatDate },
                { title: 'TÊN HÀNG', key: 'ten_hang' },
                { title: 'Mã SỐ', key: 'ma_so' },
                { title: 'SỐ LƯỢNG', key: 'so_luong', align: 'right', render: (val) => `<b class="text-warning">-${utils.formatNumber(val)}</b>` },
                { title: 'ĐVT', key: 'don_vi_tinh', align: 'center' },
                { title: 'CÔNG ĐOẠN', key: 'cong_doan' },
                { title: 'NGƯỜI YÊU CẦU', key: 'nguoi_yeu_cau' },
                { title: 'NGƯỜI NHẬN', key: 'nguoi_nhan' },
                { title: 'NGƯỜI XUẤT', key: 'nguoi_xuat' },
                { title: 'TRẠNG THÁI', key: 'trang_thai', render: (val) => val === 'Có kiếm kê' ? '<span class="text-success"><i class="fas fa-check-circle"></i> Có</span>' : '<span class="text-muted">Không</span>' },
                { title: 'GHI CHÚ', key: 'ghi_chu' },
                { title: '', key: 'id', align: 'center', width: '40px', render: (id) => `
                    <button class="btn btn-ghost btn-icon text-danger" onclick="ExportPage.deleteTransaction(${id})" title="Xoá & Hoàn tồn kho"><i class="fas fa-trash"></i></button>
                `}
            ]
        });
    },

    attachEvents() {
        // Toggle Form (Redirect to Issues page)
        document.querySelector('#page-export #btnToggleForm').addEventListener('click', () => {
            sessionStorage.setItem('openIssueForm', 'true');
            window.location.hash = '#issues';
        });

        // Search history
        const searchHistory = document.querySelector('#page-export #searchHistory');
        const clearSearchHistory = document.querySelector('#page-export #clearSearchHistory');
        
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
        document.querySelector('#page-export #btnFilterHistory').addEventListener('click', () => {
            const fromDate = document.querySelector('#page-export #fromDate').value;
            const toDate = document.querySelector('#page-export #toDate').value;
            if (fromDate) this.params.from_date = fromDate;
            else delete this.params.from_date;
            
            if (toDate) this.params.to_date = toDate;
            else delete this.params.to_date;
            
            this.params.page = 1;
            this.loadHistory();
        });

        // Export Excel
        document.querySelector('#page-export #btnExportExcel').addEventListener('click', async (e) => {
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
                a.download = `lich_su_xuat.xlsx`;
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
        const searchInput = document.querySelector('#page-export #ten_hang_search');
        const dropdown = document.querySelector('#page-export #itemDropdown');
        const clearSearchAuto = document.querySelector('#page-export #clearSearchAuto');

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
            document.querySelector('#page-export #item_id').value = '';
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
        document.querySelector('#page-export #exportForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const itemId = document.querySelector('#page-export #item_id').value;
            const tonHienTai = parseInt(document.querySelector('#page-export #ton_hien_tai').value.replace(/\D/g,''));
            const soLuong = parseInt(document.querySelector('#page-export #so_luong').value);
            
            if (!itemId) {
                window.toast.warning('Vui lòng chọn một mặt hàng từ danh sách tìm kiếm');
                return;
            }
            if (soLuong > tonHienTai) {
                window.toast.error(`Không đủ tồn kho! Tồn hiện tại chỉ còn ${tonHienTai}`);
                return;
            }

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

            try {
                const data = {
                    item_id: parseInt(itemId),
                    ngay: document.querySelector('#page-export #ngay').value,
                    so_luong: soLuong,
                    cong_doan: document.querySelector('#page-export #cong_doan').value,
                    nguoi_yeu_cau: document.querySelector('#page-export #nguoi_yeu_cau').value,
                    nguoi_nhan: document.querySelector('#page-export #nguoi_nhan').value,
                    nguoi_xuat: document.querySelector('#page-export #nguoi_xuat').value,
                    ghi_chu: document.querySelector('#page-export #ghi_chu').value,
                    trang_thai: "Có kiếm kê"
                };

                await api.transactions.export(data);
                window.toast.success('Đã lưu phiếu xuất kho thành công!');
                
                // Reset form
                document.querySelector('#page-export #item_id').value = '';
                document.querySelector('#page-export #ten_hang_search').value = '';
                document.querySelector('#page-export #ma_so').value = '';
                document.querySelector('#page-export #ton_hien_tai').value = '';
                document.querySelector('#page-export #so_luong').value = '';
                document.querySelector('#page-export #don_vi_tinh').value = '';
                document.querySelector('#page-export #ghi_chu').value = '';
                
                // Cập nhật bảng lịch sử
                this.params.page = 1;
                this.loadHistory();
                
                formCard.style.display = 'none';
            } catch (error) {
                utils.handleApiError(error);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Xác nhận xuất kho';
            }
        });

        document.querySelector('#page-export #btnResetForm').addEventListener('click', () => {
            document.querySelector('#page-export #exportForm').reset();
            document.querySelector('#page-export #item_id').value = '';
        });
    },

    renderDropdown(items) {
        const dropdown = document.querySelector('#page-export #itemDropdown');
        if (items.length === 0) {
            dropdown.innerHTML = '<div class="p-2 text-muted text-center">Không tìm thấy mặt hàng</div>';
        } else {
            dropdown.innerHTML = items.map(item => {
                const isOutOfStock = item.ton_cuoi <= 0;
                return `
                <div class="autocomplete-item ${isOutOfStock ? 'opacity-50' : ''}" onclick="${isOutOfStock ? '' : `ExportPage.selectItem(${item.id})`}">
                    <div class="item-name">${item.ten_hang}</div>
                    <div class="item-code">
                        ${item.ma_so} | Tồn: <span class="${isOutOfStock ? 'text-danger font-bold' : 'text-success font-bold'}">${item.ton_cuoi} ${item.don_vi_tinh}</span>
                        ${isOutOfStock ? ' <span class="badge warning ml-2">HẾT HÀNG</span>' : ''}
                    </div>
                </div>
            `}).join('');
        }
        dropdown.classList.add('show');
    },

    selectItem(id) {
        const item = this.autocompleteItems.find(i => i.id === id);
        if (item) {
            document.querySelector('#page-export #item_id').value = item.id;
            document.querySelector('#page-export #ten_hang_search').value = item.ten_hang;
            document.querySelector('#page-export #ma_so').value = item.ma_so;
            document.querySelector('#page-export #ton_hien_tai').value = utils.formatNumber(item.ton_cuoi);
            document.querySelector('#page-export #don_vi_tinh').value = item.don_vi_tinh;
            document.querySelector('#page-export #itemDropdown').classList.remove('show');
            document.querySelector('#page-export #so_luong').focus();
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
            'Xoá phiếu xuất', 
            'Bạn có chắc chắn muốn xoá phiếu xuất này? Tồn kho sẽ được hoàn lại số lượng tương ứng.',
            async () => {
                try {
                    await api.transactions.delete(id);
                    window.toast.success('Đã xoá phiếu xuất và hoàn lại tồn kho');
                    this.loadHistory();
                } catch (error) {
                    utils.handleApiError(error);
                }
            }
        );
    },

    destroy() {}
};
