/**
 * Trang Lịch sử nhập xuất kho (History)
 */
const HistoryPage = {
    table: null,
    params: { page: 1, page_size: 50 }, // default no filter => all
    currentTab: 'ALL', // 'ALL', 'NHAP', 'XUAT'
    autocompleteItems: [],

    async render(container) {
        const html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative;">
                <h2 style="text-align: center; width: 100%; font-size: 1.8rem; font-weight: bold; margin: 0; color: var(--text-heading);">LỊCH SỬ NHẬP XUẤT KHO</h2>
                <div style="position: absolute; right: 0; display: flex; gap: 10px;">
                    <button class="btn btn-success" id="btnGoToImport">
                        <i class="fas fa-plus"></i> Tạo phiếu nhập
                    </button>
                    <button class="btn btn-warning" id="btnGoToExport">
                        <i class="fas fa-minus"></i> Tạo phiếu xuất
                    </button>
                </div>
            </div>

            <div class="tabs-container mb-4" style="border-bottom: 1px solid var(--border-color); display: flex; gap: 20px;">
                <div class="tab-item active" data-tab="ALL" style="padding: 10px 20px; cursor: pointer; border-bottom: 3px solid var(--primary); font-weight: bold; color: var(--primary);">Tất cả</div>
                <div class="tab-item" data-tab="NHAP" style="padding: 10px 20px; cursor: pointer; border-bottom: 3px solid transparent; font-weight: 500; color: var(--text-muted);">Lịch sử nhập</div>
                <div class="tab-item" data-tab="XUAT" style="padding: 10px 20px; cursor: pointer; border-bottom: 3px solid transparent; font-weight: 500; color: var(--text-muted);">Lịch sử xuất</div>
            </div>

            <div class="card">
                <div class="toolbar" style="display: flex; flex-wrap: wrap; align-items: center; gap: 15px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
                    <div class="search-box autocomplete-wrapper" style="max-width: 300px; min-width: 225px; flex-grow: 1; position: relative;">
                        <i class="fas fa-search"></i>
                        <input type="text" class="form-control" id="searchHistory" placeholder="Tìm kiếm tên, mã hàng..." autocomplete="off">
                        <i class="fas fa-times clear-search" id="clearSearchHistory"></i>
                        <div class="autocomplete-dropdown" id="searchHistoryDropdown" style="width: 100%; top: 100%; left: 0;"></div>
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
                
                <div id="historyTable"></div>
            </div>
        `;
        
        container.innerHTML = html;
        this.initTable();
        this.attachEvents();
        this.loadData();
    },

    initTable() {
        this.table = new DataTable(document.querySelector('#page-history #historyTable'), {
            pageSize: 50,
            onPageChange: (page) => {
                this.params.page = page;
                this.loadData();
            },
            columns: [
                { title: 'STT', key: 'id', width: '50px', align: 'center', render: (val, row, idx) => idx + 1 + (HistoryPage.params.page - 1) * HistoryPage.params.page_size },
                { title: 'LOẠI', key: 'loai', width: '80px', align: 'center', render: (val) => val === 'NHAP' ? '<span class="badge success">NHẬP</span>' : '<span class="badge warning">XUẤT</span>' },
                { title: 'NGÀY', key: 'ngay', render: utils.formatDate },
                { title: 'TÊN HÀNG', key: 'ten_hang' },
                { title: 'Mã SỐ', key: 'ma_so' },
                { title: 'SỐ LƯỢNG', key: 'so_luong', align: 'right', render: (val, row) => row.loai === 'NHAP' ? `<b class="text-success">+${utils.formatNumber(val)}</b>` : `<b class="text-warning">-${utils.formatNumber(val)}</b>` },
                { title: 'ĐVT', key: 'don_vi_tinh', align: 'center' },
                { title: 'CÔNG ĐOẠN', key: 'cong_doan', render: (val) => val || '-' },
                { title: 'NGƯỜI THỰC HIỆN', key: 'id', render: (val, row) => row.loai === 'NHAP' ? (row.nguoi_nhap || '-') : (row.nguoi_xuat || '-') },
                { title: 'NGƯỜI YÊU CẦU/NHẬN', key: 'id', render: (val, row) => row.loai === 'XUAT' ? (row.nguoi_yeu_cau + ' / ' + row.nguoi_nhan) : '-' },
                { title: 'TRẠNG THÁI', key: 'trang_thai', render: (val) => val === 'Có kiếm kê' ? '<span class="text-success"><i class="fas fa-check-circle"></i> Có</span>' : '<span class="text-muted">Không</span>' },
                { title: 'GHI CHÚ', key: 'ghi_chu' },
                { title: '', key: 'id', align: 'center', width: '40px', render: (id) => `
                    <button class="btn btn-ghost btn-icon text-danger" onclick="HistoryPage.deleteTransaction(${id})" title="Xoá & Hoàn tồn kho"><i class="fas fa-trash"></i></button>
                `}
            ]
        });
    },

    attachEvents() {
        // Tab switching
        const tabs = document.querySelectorAll('#page-history .tab-item');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.borderBottomColor = 'transparent';
                    t.style.color = 'var(--text-muted)';
                    t.style.fontWeight = '500';
                });
                const target = e.target;
                target.classList.add('active');
                target.style.borderBottomColor = 'var(--primary)';
                target.style.color = 'var(--primary)';
                target.style.fontWeight = 'bold';
                
                this.currentTab = target.dataset.tab;
                if (this.currentTab === 'ALL') {
                    delete this.params.loai;
                } else {
                    this.params.loai = this.currentTab;
                }
                this.params.page = 1;
                this.loadData();
            });
        });

        // Toggle Form Redirects
        const btnGoToImport = document.querySelector('#page-history #btnGoToImport');
        if (btnGoToImport) {
            btnGoToImport.addEventListener('click', () => {
                sessionStorage.setItem('openReceiptForm', 'true');
                window.location.hash = '#receipts';
            });
        }

        const btnGoToExport = document.querySelector('#page-history #btnGoToExport');
        if (btnGoToExport) {
            btnGoToExport.addEventListener('click', () => {
                sessionStorage.setItem('openIssueForm', 'true');
                window.location.hash = '#issues';
            });
        }

        // Search history & Autocomplete
        const searchHistory = document.querySelector('#page-history #searchHistory');
        const clearSearchHistory = document.querySelector('#page-history #clearSearchHistory');
        const dropdown = document.querySelector('#page-history #searchHistoryDropdown');
        let currentFocus = -1;
        
        if (searchHistory) {
            searchHistory.addEventListener('input', utils.debounce(async (e) => {
                const query = e.target.value.trim();
                
                // Filter table dynamically
                this.params.search = query;
                this.params.page = 1;
                clearSearchHistory.style.display = query ? 'block' : 'none';
                this.loadData();

                // Autocomplete Logic
                currentFocus = -1;
                if (query.length < 2) {
                    dropdown.classList.remove('show');
                    return;
                }
                
                try {
                    this.autocompleteItems = await api.inventory.getAll(query);
                    this.renderDropdown(this.autocompleteItems);
                } catch (error) {
                    console.error('Lỗi tìm kiếm gợi ý:', error);
                }
            }, 500));
            
            searchHistory.addEventListener('keydown', (e) => {
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
        }

        if (clearSearchHistory) {
            clearSearchHistory.addEventListener('click', () => {
                searchHistory.value = '';
                this.params.search = '';
                this.params.page = 1;
                clearSearchHistory.style.display = 'none';
                dropdown.classList.remove('show');
                currentFocus = -1;
                this.loadData();
                searchHistory.focus();
            });
        }

        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (e.target !== searchHistory && dropdown && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        // Filter
        const btnFilterHistory = document.querySelector('#page-history #btnFilterHistory');
        if (btnFilterHistory) {
            btnFilterHistory.addEventListener('click', () => {
                const fromDate = document.querySelector('#page-history #fromDate').value;
                const toDate = document.querySelector('#page-history #toDate').value;
                if (fromDate) this.params.from_date = fromDate;
                else delete this.params.from_date;
                
                if (toDate) this.params.to_date = toDate;
                else delete this.params.to_date;
                
                this.params.page = 1;
                this.loadData();
            });
        }

        // Export Excel
        const btnExportExcel = document.querySelector('#page-history #btnExportExcel');
        if (btnExportExcel) {
            btnExportExcel.addEventListener('click', async (e) => {
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
                    const tabName = this.currentTab === 'ALL' ? 'nhap_xuat' : this.currentTab.toLowerCase();
                    a.download = `lich_su_${tabName}.xlsx`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    window.toast.error(error.message);
                } finally {
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                }
            });
        }
    },

    renderDropdown(items) {
        const dropdown = document.querySelector('#page-history #searchHistoryDropdown');
        if (!dropdown) return;
        
        if (items.length === 0) {
            dropdown.innerHTML = '<div class="p-2 text-muted text-center">Không tìm thấy mặt hàng</div>';
        } else {
            dropdown.innerHTML = items.map(item => `
                <div class="autocomplete-item" onclick="HistoryPage.selectItem(${item.id})" style="padding: 10px; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                    <div class="item-name" style="font-weight: 500;">${item.ten_hang}</div>
                    <div class="item-code" style="font-size: 0.85em; color: var(--text-muted);">${item.ma_so} | Tồn: ${item.ton_cuoi} ${item.don_vi_tinh}</div>
                </div>
            `).join('');
        }
        dropdown.classList.add('show');
    },
    
    selectItem(id) {
        const item = this.autocompleteItems.find(i => i.id === id);
        if (item) {
            const searchHistory = document.querySelector('#page-history #searchHistory');
            searchHistory.value = item.ten_hang;
            this.params.search = item.ten_hang;
            this.params.page = 1;
            
            document.querySelector('#page-history #searchHistoryDropdown').classList.remove('show');
            document.querySelector('#page-history #clearSearchHistory').style.display = 'block';
            
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

    async loadData() {
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
            'Xoá phiếu', 
            'Bạn có chắc chắn muốn xoá phiếu này? Tồn kho sẽ được cập nhật lại tương ứng.',
            async () => {
                try {
                    await api.transactions.delete(id);
                    window.toast.success('Đã xoá phiếu và cập nhật tồn kho');
                    this.loadData();
                } catch (error) {
                    utils.handleApiError(error);
                }
            }
        );
    },

    destroy() {}
};
