/**
 * Trang Quản Lý Phiếu Nhập Kho
 */
const ReceiptsPage = {
    table: null,
    params: { page: 1, page_size: 50 },
    currentItems: [], // Danh sách các mặt hàng đang chọn trong phiếu
    autocompleteItems: [], // Danh sách gợi ý từ API

    async render(container) {
        const html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative;">
                <h2 style="text-align: center; width: 100%; font-size: 1.8rem; font-weight: bold; margin: 0; color: var(--text-heading);">QUẢN LÝ PHIẾU NHẬP KHO</h2>
                <button class="btn btn-success" id="btnToggleForm" style="position: absolute; right: 0;">
                    <i class="fas fa-plus"></i> Tạo phiếu nhập
                </button>
            </div>

            <!-- Form tạo phiếu mới -->
            <div class="card mb-4" id="receiptFormCard" style="display: none;">
                <div class="card-header" style="border-bottom: 1px solid var(--border-color); margin-bottom: 15px; padding-bottom: 10px;">
                    <h3 class="card-title text-success"><i class="fas fa-file-import"></i> Lập Phiếu Nhập Kho</h3>
                    <button class="btn btn-ghost btn-icon" id="btnCloseForm"><i class="fas fa-times"></i></button>
                </div>
                <form id="receiptForm">
                    <div class="form-grid mb-4">
                        <div class="form-group">
                            <label>Ngày nhập</label>
                            <input type="date" class="form-control" id="ngay_nhap" required value="${utils.getTodayYYYYMMDD()}">
                        </div>
                        <div class="form-group">
                            <label>Người giao / Người nhập</label>
                            <input type="text" class="form-control" id="nguoi_nhap" required placeholder="Tên người nhập" value="${window.Auth?.user?.full_name || window.Auth?.user?.username || ''}" readonly tabindex="-1" style="background-color: var(--bg-card); cursor: not-allowed;">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Ghi chú chung</label>
                            <input type="text" class="form-control" id="ghi_chu" placeholder="Nội dung, lý do nhập kho...">
                        </div>
                    </div>

                    <div style="border-top: 1px dashed var(--border-color); padding-top: 15px; margin-bottom: 15px;">
                        <h4 style="margin-bottom: 10px; font-size: 1.1rem;">Chi tiết mặt hàng</h4>
                        
                        <div class="form-group mb-2 autocomplete-wrapper" style="position: relative;">
                            <label>Tên hàng hóa (Gõ để tìm kiếm)</label>
                            <input type="text" class="form-control" id="search_item" placeholder="Gõ tên hoặc mã vật tư để tìm kiếm" autocomplete="off">
                            <i class="fas fa-times clear-search clear-search-auto" id="clearSearchItem" style="bottom: 10px; display: none;"></i>
                            <ul class="autocomplete-dropdown" id="itemDropdown" style="display: none; max-height: 200px; overflow-y: auto;"></ul>
                            <input type="hidden" id="selected_item_id">
                            <input type="hidden" id="selected_item_name">
                        </div>
                        
                        <div class="form-grid mb-2">
                            <div class="form-group">
                                <label>Mã số</label>
                                <input type="text" class="form-control" id="item_ma_so" readonly tabindex="-1">
                            </div>
                            <div class="form-group">
                                <label>Tồn hiện tại</label>
                                <input type="text" class="form-control" id="item_ton_hien_tai" readonly tabindex="-1">
                            </div>
                            <div class="form-group">
                                <label>Đơn vị tính</label>
                                <input type="text" class="form-control" id="item_dvt" readonly tabindex="-1">
                            </div>
                        </div>
                        
                        <div class="form-grid mb-2" style="grid-template-columns: 1fr 2fr auto;">
                            <div class="form-group">
                                <label>Số lượng nhập</label>
                                <input type="number" class="form-control" id="item_qty" placeholder="Số lượng" min="1">
                            </div>
                            <div class="form-group">
                                <label>Ghi chú mặt hàng</label>
                                <input type="text" class="form-control" id="item_note" placeholder="Ghi chú (nếu có)">
                            </div>
                            <div class="form-group" style="display: flex; align-items: flex-end;">
                                <button type="button" class="btn btn-primary" id="btnAddItem">
                                    <i class="fas fa-plus"></i> Thêm vào phiếu
                                </button>
                            </div>
                        </div>
                        
                        <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                            <table class="data-table" id="itemsTable">
                                <thead>
                                    <tr>
                                        <th class="text-center" style="width: 50px;">STT</th>
                                        <th style="width: 20%;">Mã vật tư</th>
                                        <th style="width: 30%;">Tên vật tư</th>
                                        <th class="text-right" style="width: 15%;">Số lượng</th>
                                        <th style="width: 10%;">ĐVT</th>
                                        <th style="width: 20%;">Ghi chú</th>
                                        <th class="text-center" style="width: 60px;">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td colspan="7" class="text-center text-muted">Chưa có mặt hàng nào được chọn</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="form-actions text-right" style="border-top: 1px solid var(--border-color); padding-top: 15px;">
                        <button type="submit" class="btn btn-success" id="btnSubmitReceipt" disabled>
                            <i class="fas fa-save"></i> Hoàn thành & Lưu phiếu
                        </button>
                    </div>
                </form>
            </div>

            <!-- Danh sách phiếu -->
            <div class="card">
                <div class="toolbar">
                    <div class="search-box autocomplete-wrapper" style="max-width: 300px; flex-grow: 1; position: relative; margin: 0;">
                        <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); z-index: 1;"></i>
                        <input type="text" id="searchInput" class="form-control" placeholder="Tìm theo mã phiếu, người nhập..." autocomplete="off" style="padding-left: 35px; padding-right: 30px;">
                        <i class="fas fa-times clear-search" id="clearSearchReceipt" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; display: none; z-index: 1;"></i>
                        <div class="autocomplete-dropdown" id="searchReceiptDropdown" style="width: 100%; top: 100%; left: 0;"></div>
                    </div>
                </div>
                <div id="tableContainer"></div>
                <div id="paginationContainer"></div>
            </div>
        `;
        container.innerHTML = html;
        this.currentItems = [];

        await this.initTable();
        this.attachEvents();
        this.loadAutocompleteData();

        // Check if coming from import_stock with intent to create
        if (sessionStorage.getItem('openReceiptForm') === 'true') {
            sessionStorage.removeItem('openReceiptForm');
            setTimeout(() => {
                const btn = document.querySelector('#page-receipts #btnToggleForm');
                if (btn) btn.click();
            }, 100);
        }
    },

    onActivate() {
        if (sessionStorage.getItem('openReceiptForm') === 'true') {
            sessionStorage.removeItem('openReceiptForm');
            setTimeout(() => {
                const btn = document.querySelector('#page-receipts #btnToggleForm');
                const formCard = document.getElementById('receiptFormCard');
                if (btn && formCard && formCard.style.display === 'none') btn.click();
            }, 100);
        }
        this.loadData();
    },

    async initTable() {
        this.table = new DataTable(document.querySelector('#page-receipts #tableContainer'), {
            columns: [
                { key: 'stt', label: 'STT', width: '60px', align: 'center', render: (_, __, index) => (ReceiptsPage.params.page - 1) * ReceiptsPage.params.page_size + index + 1 },
                { key: 'ma_phieu', label: 'Số Phiếu Nhập', width: '150px' },
                { key: 'ngay_nhap', label: 'Ngày Nhập', width: '120px', render: (val) => utils.formatDate(val) },
                { key: 'nguoi_nhap', label: 'Người Nhập' },
                { key: 'ghi_chu', label: 'Ghi Chú' },
                { 
                    key: 'created_at', 
                    label: 'Ngày Tạo', 
                    width: '150px',
                    render: (val) => val ? new Date(val).toLocaleString('vi-VN') : '' 
                },
                {
                    key: 'actions',
                    label: 'Thao tác',
                    width: '120px',
                    render: (_, row) => `
                        <div class="action-buttons">
                            <button class="btn btn-ghost btn-icon btn-delete" data-id="${row.id}" title="Xóa phiếu">
                                <i class="fas fa-trash text-danger"></i>
                            </button>
                        </div>
                    `
                }
            ],
            data: [],
            emptyText: 'Chưa có phiếu nhập nào.',
            onRowClick: (row, e) => {
                if (e.target.closest('.action-buttons')) return;
                this.viewReceiptDetails(row.id);
            }
        });

        await this.loadData();
    },

    async loadData() {
        try {
            const data = await api.receipts.list(this.params);
            this.table.updateData(data.receipts, data.total);
            this.table.options.currentPage = data.page;
            this.table.render();
            this.renderPagination(data);
        } catch (error) {
            window.toast.error('Không thể tải danh sách phiếu nhập');
        }
    },

    async loadAutocompleteData() {
        try {
            this.autocompleteItems = await api.inventory.getAll();
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu autocomplete:', error);
        }
    },

    renderPagination(data) {
        const container = document.querySelector('#page-receipts #paginationContainer');
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        let html = '';
        if (data.page > 1) {
            html += `<button class="btn btn-outline" data-page="${data.page - 1}"><i class="fas fa-chevron-left"></i> Trước</button>`;
        }
        
        html += `<span style="padding: 8px 12px;">Trang ${data.page} / ${data.total_pages || 1} (Tổng: ${data.total})</span>`;
        
        if (data.page < data.total_pages) {
            html += `<button class="btn btn-outline" data-page="${data.page + 1}">Sau <i class="fas fa-chevron-right"></i></button>`;
        }
        
        container.innerHTML = html;
        
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.params.page = parseInt(btn.dataset.page);
                this.loadData();
            });
        });
    },

    updateItemsTable() {
        const tbody = document.querySelector('#itemsTable tbody');
        const submitBtn = document.querySelector('#page-receipts #btnSubmitReceipt');
        
        if (this.currentItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Chưa có mặt hàng nào được chọn</td></tr>';
            submitBtn.disabled = true;
            return;
        }

        submitBtn.disabled = false;
        let html = '';
        this.currentItems.forEach((item, index) => {
            html += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.ma_so}</td>
                    <td>${item.ten_hang}</td>
                    <td class="text-right font-weight-bold">${utils.formatNumber(item.so_luong)}</td>
                    <td>${item.don_vi_tinh}</td>
                    <td>${item.ghi_chu || ''}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-ghost btn-icon text-danger" onclick="ReceiptsPage.removeItem(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },

    removeItem(index) {
        this.currentItems.splice(index, 1);
        this.updateItemsTable();
    },

    attachEvents() {
        const searchInput = document.querySelector('#page-receipts #searchInput');
        const clearSearchReceipt = document.querySelector('#page-receipts #clearSearchReceipt');
        const dropdown = document.querySelector('#page-receipts #searchReceiptDropdown');
        let currentFocusList = -1;
        
        // Search list
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            clearSearchReceipt.style.display = val ? 'block' : 'none';
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                this.params.search = val;
                this.params.page = 1;
                this.loadData();
                
                // Autocomplete Logic
                currentFocusList = -1;
                if (val.length < 2) {
                    if (dropdown) dropdown.classList.remove('show');
                    return;
                }
                
                try {
                    const data = await api.receipts.list({ search: val, page: 1, page_size: 10 });
                    this.renderReceiptDropdown(data.receipts);
                } catch (error) {
                    console.error('Lỗi tìm kiếm gợi ý phiếu:', error);
                }
            }, 500);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (!dropdown) return;
            const items = dropdown.querySelectorAll('.autocomplete-item');
            if (!items || items.length === 0 || !dropdown.classList.contains('show')) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocusList++;
                if (currentFocusList >= items.length) currentFocusList = 0;
                this.setActiveReceiptAutocomplete(items, currentFocusList);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocusList--;
                if (currentFocusList < 0) currentFocusList = items.length - 1;
                this.setActiveReceiptAutocomplete(items, currentFocusList);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocusList > -1) {
                    items[currentFocusList].click();
                }
            }
        });

        clearSearchReceipt.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchReceipt.style.display = 'none';
            if (dropdown) dropdown.classList.remove('show');
            currentFocusList = -1;
            this.params.search = '';
            this.params.page = 1;
            this.loadData();
        });
        
        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (dropdown && e.target !== searchInput && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        // Toggle form
        const btnToggleForm = document.querySelector('#page-receipts #btnToggleForm');
        const btnCloseForm = document.querySelector('#page-receipts #btnCloseForm');
        const formCard = document.querySelector('#page-receipts #receiptFormCard');

        btnToggleForm.addEventListener('click', () => {
            if (!window.Auth.hasPermission('perm_add')) {
                if (window.toast) window.toast.error("Bạn không có quyền thực hiện thao tác này.");
                else alert("Bạn không có quyền thực hiện thao tác này.");
                return;
            }
            formCard.style.display = 'block';
            btnToggleForm.style.display = 'none';
        });

        btnCloseForm.addEventListener('click', () => {
            formCard.style.display = 'none';
            btnToggleForm.style.display = 'inline-block';
        });

        // Autocomplete
        const searchItem = document.querySelector('#page-receipts #search_item');
        const clearSearchItem = document.querySelector('#page-receipts #clearSearchItem');
        const itemDropdown = document.querySelector('#page-receipts #itemDropdown');
        const selectedItemId = document.querySelector('#page-receipts #selected_item_id');
        const selectedItemName = document.querySelector('#page-receipts #selected_item_name');
        const itemQty = document.querySelector('#page-receipts #item_qty');

        let currentFocus = -1;

        searchItem.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            clearSearchItem.style.display = val ? 'block' : 'none';
            selectedItemId.value = ''; // Reset when typing
            currentFocus = -1;
            
            if (!val) {
                itemDropdown.style.display = 'none';
                return;
            }

            const matches = this.autocompleteItems.filter(item => 
                (item.ten_hang && item.ten_hang.toLowerCase().includes(val)) || 
                (item.ma_so && item.ma_so.toLowerCase().includes(val))
            ).slice(0, 50); // limit 50 results

            if (matches.length > 0) {
                itemDropdown.innerHTML = matches.map(item => `
                    <li data-id="${item.id}" data-name="${item.ten_hang}" data-code="${item.ma_so}" data-stock="${item.ton_cuoi}" data-dvt="${item.don_vi_tinh}">
                        <div class="font-weight-bold">${item.ten_hang}</div>
                        <div class="text-sm text-muted">Mã: ${item.ma_so} | Tồn kho: ${item.ton_cuoi} ${item.don_vi_tinh}</div>
                    </li>
                `).join('');
                itemDropdown.style.display = 'block';
            } else {
                itemDropdown.innerHTML = `
                    <li class="text-muted" style="pointer-events: none;">Không tìm thấy sản phẩm "${e.target.value}"</li>
                    <li class="autocomplete-add-new" id="btnAddNewProduct">
                        <i class="fas fa-plus-circle"></i> Thêm sản phẩm mới vào kho
                    </li>
                `;
                itemDropdown.style.display = 'block';
            }
        });

        clearSearchItem.addEventListener('click', () => {
            searchItem.value = '';
            document.querySelector('#page-receipts #item_ma_so').value = '';
            document.querySelector('#page-receipts #item_ton_hien_tai').value = '';
            document.querySelector('#page-receipts #item_dvt').value = '';
            clearSearchItem.style.display = 'none';
            itemDropdown.style.display = 'none';
            selectedItemId.value = '';
            currentFocus = -1;
            searchItem.focus();
        });

        searchItem.addEventListener('keydown', (e) => {
            const items = itemDropdown.querySelectorAll('li:not(.text-muted)');
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
                } else if (items.length > 0) {
                    items[0].click();
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

        itemDropdown.addEventListener('click', (e) => {
            // Handle "Add new product" button
            const addNewBtn = e.target.closest('#btnAddNewProduct');
            if (addNewBtn) {
                const prefillName = searchItem.value;
                itemDropdown.style.display = 'none';
                this.showNewProductModal(prefillName);
                return;
            }

            const li = e.target.closest('li');
            if (li && li.dataset.id) {
                selectedItemId.value = li.dataset.id;
                selectedItemName.value = li.dataset.name;
                searchItem.value = `${li.dataset.code} - ${li.dataset.name}`;
                document.querySelector('#page-receipts #item_ma_so').value = li.dataset.code;
                document.querySelector('#page-receipts #item_ton_hien_tai').value = utils.formatNumber(li.dataset.stock);
                document.querySelector('#page-receipts #item_dvt').value = li.dataset.dvt;
                
                itemDropdown.style.display = 'none';
                clearSearchItem.style.display = 'block';
                currentFocus = -1;
                itemQty.focus();
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchItem.contains(e.target) && !itemDropdown.contains(e.target)) {
                itemDropdown.style.display = 'none';
            }
        });

        // Add item to list
        document.querySelector('#page-receipts #btnAddItem').addEventListener('click', () => {
            const id = selectedItemId.value;
            const nameCode = searchItem.value;
            const qty = parseInt(document.querySelector('#page-receipts #item_qty').value);
            const note = document.querySelector('#page-receipts #item_note').value;

            if (!id) {
                window.toast.error('Vui lòng chọn một mặt hàng từ danh sách gợi ý');
                return;
            }
            if (!qty || qty <= 0) {
                window.toast.error('Số lượng phải lớn hơn 0');
                return;
            }

            // Check if item already exists
            const existingIndex = this.currentItems.findIndex(i => i.item_id == id);
            if (existingIndex >= 0) {
                this.currentItems[existingIndex].so_luong += qty;
                if (note) this.currentItems[existingIndex].ghi_chu = note;
            } else {
                const ma_so = document.querySelector('#page-receipts #item_ma_so').value;
                const ten_hang = selectedItemName.value;
                const dvt = document.querySelector('#page-receipts #item_dvt').value;
                
                this.currentItems.push({
                    item_id: parseInt(id),
                    ma_so: ma_so,
                    ten_hang: ten_hang,
                    don_vi_tinh: dvt,
                    so_luong: qty,
                    ghi_chu: note
                });
            }

            this.updateItemsTable();
            
            // Reset fields
            searchItem.value = '';
            selectedItemId.value = '';
            document.querySelector('#page-receipts #item_ma_so').value = '';
            document.querySelector('#page-receipts #item_ton_hien_tai').value = '';
            document.querySelector('#page-receipts #item_dvt').value = '';
            document.querySelector('#page-receipts #item_qty').value = '';
            document.querySelector('#page-receipts #item_note').value = '';
            clearSearchItem.style.display = 'none';
            searchItem.focus();
        });

        // Submit form
        document.querySelector('#page-receipts #receiptForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.currentItems.length === 0) {
                window.toast.error('Phiếu nhập phải có ít nhất 1 mặt hàng');
                return;
            }

            const data = {
                ngay_nhap: document.querySelector('#page-receipts #ngay_nhap').value,
                nguoi_nhap: document.querySelector('#page-receipts #nguoi_nhap').value,
                ghi_chu: document.querySelector('#page-receipts #ghi_chu').value,
                items: this.currentItems.map(i => ({
                    item_id: i.item_id,
                    so_luong: i.so_luong,
                    ghi_chu: i.ghi_chu
                }))
            };

            const submitBtn = document.querySelector('#page-receipts #btnSubmitReceipt');
            utils.setLoading(submitBtn, true);

            try {
                await api.receipts.create(data);
                window.toast.success('Đã lưu phiếu nhập kho thành công');
                
                // Reset form
                document.querySelector('#page-receipts #receiptForm').reset();
                document.querySelector('#page-receipts #ngay_nhap').value = utils.getTodayYYYYMMDD();
                this.currentItems = [];
                this.updateItemsTable();
                
                btnCloseForm.click();
                this.loadData();
                this.loadAutocompleteData(); // Refresh stock data
            } catch (error) {
                window.toast.error(error.message || 'Có lỗi xảy ra khi lưu phiếu');
            } finally {
                utils.setLoading(submitBtn, false);
            }
        });

        // Table actions (View / Delete)
        document.querySelector('#page-receipts #tableContainer').addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.btn-delete');

            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                const row = this.table.options.data.find(r => r.id == id) || { ma_phieu: id };
                window.modal.confirmDelete('Xác nhận xóa', `Bạn có chắc chắn muốn xóa phiếu nhập <b>${row.ma_phieu}</b>?<br><i>Lưu ý: Tồn kho của các vật tư trong phiếu sẽ bị trừ đi tương ứng.</i>`, async () => {
                    try {
                        await api.receipts.delete(id);
                        window.toast.success('Đã xóa phiếu nhập');
                        this.loadData();
                    } catch (error) {
                        window.toast.error(error.message || 'Lỗi khi xóa phiếu');
                    }
                });
            }
        });
    },

    async viewReceiptDetails(id) {
        try {
            const receipt = await api.receipts.get(id);
            
            let itemsHtml = receipt.transactions.map((t, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${t.ma_so}</td>
                    <td>${t.ten_hang}</td>
                    <td class="text-right">${utils.formatNumber(t.so_luong)}</td>
                    <td>${t.don_vi_tinh}</td>
                    <td>${t.ghi_chu}</td>
                </tr>
            `).join('');

            const content = `
                <div class="receipt-detail">
                    <div style="display: flex; gap: 20px; margin-bottom: 20px; background: var(--bg-card); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="flex: 1;">
                            <p style="margin: 0 0 8px 0;"><strong>Số Phiếu:</strong> ${receipt.ma_phieu}</p>
                            <p style="margin: 0;"><strong>Ngày Nhập:</strong> ${utils.formatDate(receipt.ngay_nhap)}</p>
                        </div>
                        <div style="flex: 1;">
                            <p style="margin: 0 0 8px 0;"><strong>Người Nhập:</strong> ${receipt.nguoi_nhap}</p>
                            <p style="margin: 0;"><strong>Ghi Chú:</strong> ${receipt.ghi_chu || ''}</p>
                        </div>
                    </div>
                    <h5 style="margin-bottom: 10px;">Chi tiết mặt hàng:</h5>
                    <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Mã Số</th>
                                    <th>Tên Hàng Hóa</th>
                                    <th class="text-right">Số Lượng</th>
                                    <th>ĐVT</th>
                                    <th>Ghi Chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
                ${utils.generatePrintTemplate('receipt', receipt)}
            `;
            
            window.floatingWindow.show({
                id: 'receipt-' + id,
                title: 'Chi Tiết Phiếu Nhập Kho - ' + receipt.ma_phieu,
                content: content,
                width: '1400px',
                height: '800px',
                print: true,
                exportExcelUrl: `${API_BASE_URL}/receipts/${id}/export-excel`
            });
        } catch (error) {
            window.toast.error('Không thể tải chi tiết phiếu nhập');
        }
    },
    
    renderReceiptDropdown(receipts) {
        const dropdown = document.querySelector('#page-receipts #searchReceiptDropdown');
        if (!dropdown) return;
        
        if (receipts.length === 0) {
            dropdown.innerHTML = '<div class="p-2 text-muted text-center">Không tìm thấy phiếu</div>';
        } else {
            dropdown.innerHTML = receipts.map(receipt => `
                <div class="autocomplete-item" onclick="ReceiptsPage.selectReceipt('${receipt.ma_phieu}')" style="padding: 10px; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                    <div class="item-name" style="font-weight: 500;">${receipt.ma_phieu}</div>
                    <div class="item-code" style="font-size: 0.85em; color: var(--text-muted);">${receipt.nguoi_nhap} | ${utils.formatDate(receipt.ngay_nhap)}</div>
                </div>
            `).join('');
        }
        dropdown.classList.add('show');
    },
    
    selectReceipt(ma_phieu) {
        const searchInput = document.querySelector('#page-receipts #searchInput');
        searchInput.value = ma_phieu;
        this.params.search = ma_phieu;
        this.params.page = 1;
        
        document.querySelector('#page-receipts #searchReceiptDropdown').classList.remove('show');
        document.querySelector('#page-receipts #clearSearchReceipt').style.display = 'block';
        
        this.loadData();
    },

    setActiveReceiptAutocomplete(items, currentFocus) {
        items.forEach(item => item.style.backgroundColor = '');
        if (currentFocus > -1 && items[currentFocus]) {
            items[currentFocus].style.backgroundColor = 'var(--bg-hover)';
            items[currentFocus].scrollIntoView({ block: 'nearest' });
        }
    },

    showNewProductModal(prefillName = '') {
        const content = `
            <form id="newProductForm">
                <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Tên hàng hóa <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="np_ten_hang" required value="${prefillName}" placeholder="Nhập tên hàng hóa">
                    </div>
                    <div class="form-group">
                        <label>Mã số / Part number <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="np_ma_so" required placeholder="VD: TS-280-10MM">
                    </div>
                    <div class="form-group">
                        <label>Nhà cung cấp</label>
                        <input type="text" class="form-control" id="np_nha_cung_cap" placeholder="Tên nhà cung cấp">
                    </div>
                    <div class="form-group">
                        <label>Đơn vị tính</label>
                        <select class="form-control" id="np_don_vi_tinh">
                            <option value="Pcs">Pcs (Cái)</option>
                            <option value="Roll">Roll (Cuộn)</option>
                            <option value="Bag">Bag (Túi)</option>
                            <option value="Box">Box (Hộp)</option>
                            <option value="Set">Set (Bộ)</option>
                            <option value="Kg">Kg</option>
                            <option value="M">M (Mét)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Vị trí lưu kho</label>
                        <input type="text" class="form-control" id="np_vi_tri" placeholder="VD: VỊ TRÍ" value="VỊ TRÍ">
                    </div>
                    <div class="form-group">
                        <label>Định mức tối thiểu</label>
                        <input type="number" class="form-control" id="np_dinh_muc" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <label>Công đoạn sử dụng</label>
                        <input type="text" class="form-control" id="np_cong_doan" placeholder="Công đoạn">
                    </div>
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Ghi chú</label>
                        <input type="text" class="form-control" id="np_ghi_chu" placeholder="Ghi chú thêm (nếu có)">
                    </div>
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Loại vật tư</label>
                        <select class="form-control" id="np_loai_vat_tu">
                            <option value="Vật tư tiêu hao">Vật tư tiêu hao</option>
                            <option value="Vật tư dự phòng">Vật tư dự phòng</option>
                            <option value="Công cụ dụng cụ">Công cụ dụng cụ</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        window.modal.show({
            title: '➕ Thêm Sản Phẩm Mới Vào Kho',
            content: content,
            width: '680px',
            buttons: [
                { text: 'Hủy', class: 'btn-ghost text-muted' },
                {
                    text: '<i class="fas fa-save"></i> Lưu sản phẩm',
                    class: 'btn-success',
                    onClick: async (modal) => {
                        const ten_hang = document.getElementById('np_ten_hang').value.trim();
                        const ma_so = document.getElementById('np_ma_so').value.trim();

                        if (!ten_hang) {
                            window.toast.error('Vui lòng nhập tên hàng hóa');
                            return;
                        }
                        if (!ma_so) {
                            window.toast.error('Vui lòng nhập mã số / part number');
                            return;
                        }

                        const productData = {
                            ten_hang,
                            ma_so,
                            nha_cung_cap: document.getElementById('np_nha_cung_cap').value.trim(),
                            don_vi_tinh: document.getElementById('np_don_vi_tinh').value,
                            vi_tri: document.getElementById('np_vi_tri').value.trim(),
                            dinh_muc: parseInt(document.getElementById('np_dinh_muc').value) || 0,
                            cong_doan: document.getElementById('np_cong_doan').value.trim(),
                            ghi_chu: document.getElementById('np_ghi_chu').value.trim(),
                            loai_vat_tu: document.getElementById('np_loai_vat_tu').value,
                            ton_dau: 0
                        };

                        try {
                            const newItem = await api.inventory.create(productData);
                            window.toast.success(`Đã thêm sản phẩm "${newItem.ten_hang}" vào kho`);
                            window.modal.hide();

                            // Refresh autocomplete data
                            await this.loadAutocompleteData();

                            // Auto-select the new item in the form
                            const searchItem = document.querySelector('#page-receipts #search_item');
                            const selectedItemId = document.querySelector('#page-receipts #selected_item_id');
                            const selectedItemName = document.querySelector('#page-receipts #selected_item_name');
                            const clearSearchItem = document.querySelector('#page-receipts #clearSearchItem');

                            selectedItemId.value = newItem.id;
                            selectedItemName.value = newItem.ten_hang;
                            searchItem.value = `${newItem.ma_so} - ${newItem.ten_hang}`;
                            document.querySelector('#page-receipts #item_ma_so').value = newItem.ma_so;
                            document.querySelector('#page-receipts #item_ton_hien_tai').value = utils.formatNumber(newItem.ton_cuoi);
                            document.querySelector('#page-receipts #item_dvt').value = newItem.don_vi_tinh;
                            clearSearchItem.style.display = 'block';

                            // Focus on quantity
                            document.querySelector('#page-receipts #item_qty').focus();
                        } catch (error) {
                            window.toast.error(error.message || 'Lỗi khi thêm sản phẩm mới');
                        }
                    }
                }
            ]
        });
    },

    setupCategoryAutocomplete(inputId, dropdownId, categoryCode) {
        const input = document.querySelector(`#page-receipts #${inputId}`);
        const dropdown = document.querySelector(`#page-receipts #${dropdownId}`);
        if (!input || !dropdown) return;

        let currentFocus = -1;
        if (!this.categoryCache) this.categoryCache = {};

        input.addEventListener('input', async (e) => {
            const val = e.target.value.toLowerCase();
            currentFocus = -1;
            if (!val) {
                dropdown.style.display = 'none';
                return;
            }

            // Lazy load if not loaded
            if (!this.categoryCache[categoryCode]) {
                try {
                    this.categoryCache[categoryCode] = await api.categories.list(categoryCode);
                } catch (e) {
                    this.categoryCache[categoryCode] = [];
                }
            }

            const matches = this.categoryCache[categoryCode].filter(item => 
                item.gia_tri.toLowerCase().includes(val)
            ).slice(0, 20);

            if (matches.length > 0) {
                dropdown.innerHTML = matches.map(emp => `
                    <li data-value="${emp.gia_tri.replace(/"/g, '&quot;')}">
                        <div class="font-weight-bold">${emp.gia_tri}</div>
                    </li>
                `).join('');
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        });

        input.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('li');
            if (!items || items.length === 0 || dropdown.style.display === 'none') return;

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

        const setActive = (items) => {
            items.forEach(item => item.classList.remove('active'));
            if (currentFocus > -1 && items[currentFocus]) {
                items[currentFocus].classList.add('active');
                items[currentFocus].scrollIntoView({ block: 'nearest' });
            }
        };

        dropdown.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li && li.dataset.value) {
                input.value = li.dataset.value;
                dropdown.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },

    destroy() {
        this.table = null;
        this.currentItems = [];
        this.categoryCache = null;
    }
};
