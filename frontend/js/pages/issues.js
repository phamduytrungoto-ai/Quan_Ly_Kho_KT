/**
 * Trang Quản Lý Phiếu Xuất Kho
 */
const IssuesPage = {
    table: null,
    params: { page: 1, page_size: 50 },
    currentItems: [], // Danh sách các mặt hàng đang chọn trong phiếu
    autocompleteItems: [], // Danh sách gợi ý từ API

    async render(container) {
        const html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative;">
                <h2 style="text-align: center; width: 100%; font-size: 1.8rem; font-weight: bold; margin: 0; color: var(--text-heading);">QUẢN LÝ PHIẾU XUẤT KHO</h2>
                <button class="btn btn-primary" id="btnToggleForm" style="position: absolute; right: 0;">
                    <i class="fas fa-plus"></i> Tạo phiếu xuất
                </button>
            </div>

            <!-- Form tạo phiếu mới -->
            <div class="card mb-4" id="issueFormCard" style="display: none;">
                <div class="card-header" style="border-bottom: 1px solid var(--border-color); margin-bottom: 15px; padding-bottom: 10px;">
                    <h3 class="card-title text-primary"><i class="fas fa-file-export"></i> Lập Phiếu Xuất Kho</h3>
                    <button class="btn btn-ghost btn-icon" id="btnCloseForm"><i class="fas fa-times"></i></button>
                </div>
                <form id="issueForm">
                    <div class="form-grid mb-4">
                        <div class="form-group">
                            <label>Ngày xuất</label>
                            <input type="date" class="form-control" id="ngay_xuat" required value="${utils.getTodayYYYYMMDD()}">
                        </div>
                        <div class="form-group autocomplete-wrapper" style="position: relative;">
                            <label>Người yêu cầu</label>
                            <input type="text" class="form-control" id="nguoi_yeu_cau" required placeholder="Tên bộ phận / người yêu cầu" autocomplete="off">
                            <ul class="autocomplete-dropdown" id="nguoiYeuCauDropdown" style="display: none; max-height: 200px; overflow-y: auto;"></ul>
                        </div>
                        <div class="form-group">
                            <label>Người lập phiếu / Người xuất</label>
                            <input type="text" class="form-control" id="nguoi_xuat" required placeholder="Tên người xuất" value="${window.Auth?.user?.full_name || window.Auth?.user?.username || ''}" readonly tabindex="-1" style="background-color: var(--bg-card); cursor: not-allowed;">
                        </div>
                        <div class="form-group autocomplete-wrapper" style="position: relative;">
                            <label>Người nhận</label>
                            <input type="text" class="form-control" id="nguoi_nhan_phieu" required placeholder="Người nhận hàng" autocomplete="off">
                            <ul class="autocomplete-dropdown" id="nguoiNhanDropdown" style="display: none; max-height: 200px; overflow-y: auto;"></ul>
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Ghi chú chung</label>
                            <input type="text" class="form-control" id="ghi_chu" placeholder="Lý do xuất kho...">
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
                            <input type="hidden" id="selected_item_stock">
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
                        
                        <div class="form-grid mb-2" style="grid-template-columns: 1fr 1.5fr 1.5fr auto;">
                            <div class="form-group">
                                <label>Số lượng xuất</label>
                                <input type="number" class="form-control" id="item_qty" placeholder="Số lượng" min="1">
                            </div>
                            <div class="form-group autocomplete-wrapper" style="position: relative;">
                                <label>Công đoạn (nếu có)</label>
                                <input type="text" class="form-control" id="item_cong_doan" placeholder="Công đoạn" autocomplete="off">
                                <ul class="autocomplete-dropdown" id="itemCongDoanDropdown" style="display: none; max-height: 200px; overflow-y: auto;"></ul>
                            </div>
                            <div class="form-group">
                                <label>Loại xuất</label>
                                <select class="form-control" id="item_loai_xuat">
                                    <option value="Cấp mới">Cấp mới</option>
                                    <option value="Xuất thay thế">Xuất thay thế</option>
                                </select>
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
                                        <th style="width: 15%;">Công đoạn</th>
                                        <th style="width: 15%;">Loại xuất</th>
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
                        <button type="submit" class="btn btn-primary" id="btnSubmitIssue" disabled>
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
                        <input type="text" id="searchInput" class="form-control" placeholder="Tìm theo mã phiếu, người yêu cầu..." autocomplete="off" style="padding-left: 35px; padding-right: 30px;">
                        <i class="fas fa-times clear-search" id="clearSearchIssue" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; display: none; z-index: 1;"></i>
                        <div class="autocomplete-dropdown" id="searchIssueDropdown" style="width: 100%; top: 100%; left: 0;"></div>
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

        // Check if coming from export_stock with intent to create
        if (sessionStorage.getItem('openIssueForm') === 'true') {
            sessionStorage.removeItem('openIssueForm');
            setTimeout(() => {
                const btn = document.querySelector('#page-issues #btnToggleForm');
                if (btn) btn.click();
            }, 100);
        }
    },

    onActivate() {
        if (sessionStorage.getItem('openIssueForm') === 'true') {
            sessionStorage.removeItem('openIssueForm');
            setTimeout(() => {
                const btn = document.querySelector('#page-issues #btnToggleForm');
                const formCard = document.getElementById('issueFormCard');
                if (btn && formCard && formCard.style.display === 'none') btn.click();
            }, 100);
        }
        this.loadData();
    },

    async initTable() {
        this.table = new DataTable(document.querySelector('#page-issues #tableContainer'), {
            columns: [
                { key: 'stt', label: 'STT', width: '60px', align: 'center', render: (_, __, index) => (IssuesPage.params.page - 1) * IssuesPage.params.page_size + index + 1 },
                { key: 'ma_phieu', label: 'Số Phiếu Xuất', width: '150px' },
                { key: 'ngay_xuat', label: 'Ngày Xuất', width: '120px', render: (val) => utils.formatDate(val) },
                { key: 'nguoi_yeu_cau', label: 'Người Yêu Cầu' },
                { key: 'nguoi_xuat', label: 'Người Xuất' },
                { key: 'loai_xuat', label: 'Loại Xuất' },
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
            emptyText: 'Chưa có phiếu xuất nào.',
            onRowClick: (row, e) => {
                if (e.target.closest('.action-buttons')) return;
                this.viewIssueDetails(row.id);
            }
        });

        await this.loadData();
    },

    async loadData() {
        try {
            const data = await api.issues.list(this.params);
            this.table.updateData(data.issues, data.total);
            this.table.options.currentPage = data.page;
            this.table.render();
            this.renderPagination(data);
        } catch (error) {
            window.toast.error('Không thể tải danh sách phiếu xuất');
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
        const container = document.querySelector('#page-issues #paginationContainer');
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
        const tbody = document.querySelector('#page-issues #itemsTable tbody');
        const submitBtn = document.querySelector('#page-issues #btnSubmitIssue');
        
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
                    <td>${item.cong_doan || ''}</td>
                    <td>${item.loai_xuat || 'Cấp mới'}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-ghost btn-icon text-danger" onclick="IssuesPage.removeItem(${index})">
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
        this.setupCategoryAutocomplete('nguoi_yeu_cau', 'nguoiYeuCauDropdown', 'nhan_vien');
        this.setupCategoryAutocomplete('nguoi_nhan_phieu', 'nguoiNhanDropdown', 'nhan_vien');
        this.setupCategoryAutocomplete('item_cong_doan', 'itemCongDoanDropdown', 'cong_doan');

        const searchInput = document.querySelector('#page-issues #searchInput');
        const clearSearchIssue = document.querySelector('#page-issues #clearSearchIssue');
        const dropdown = document.querySelector('#page-issues #searchIssueDropdown');
        let currentFocusList = -1;
        
        // Search list
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            clearSearchIssue.style.display = val ? 'block' : 'none';
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
                    const data = await api.issues.list({ search: val, page: 1, page_size: 10 });
                    this.renderIssueDropdown(data.issues || data.receipts || []);
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
                this.setActiveIssueAutocomplete(items, currentFocusList);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocusList--;
                if (currentFocusList < 0) currentFocusList = items.length - 1;
                this.setActiveIssueAutocomplete(items, currentFocusList);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocusList > -1) {
                    items[currentFocusList].click();
                }
            }
        });

        clearSearchIssue.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchIssue.style.display = 'none';
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
        const btnToggleForm = document.querySelector('#page-issues #btnToggleForm');
        const btnCloseForm = document.querySelector('#page-issues #btnCloseForm');
        const formCard = document.querySelector('#page-issues #issueFormCard');

        btnToggleForm.addEventListener('click', () => {
            if (!window.Auth.hasPermission('perm_add')) {
                if (window.toast) window.toast.error("Bạn không có quyền thực hiện thao tác này.");
                else alert("Bạn không có quyền thực hiện thao tác này.");
                return;
            }
            if (formCard.style.display === 'none') {
                formCard.style.display = 'block';
                btnToggleForm.innerHTML = '<i class="fas fa-minus"></i> Thu gọn form';
            } else {
                formCard.style.display = 'none';
                btnToggleForm.innerHTML = '<i class="fas fa-plus"></i> Tạo phiếu xuất';
                
                // Reset edit mode if closing
                if (this.editingIssueId) {
                    this.editingIssueId = null;
                    document.querySelector('#page-issues #issueForm').reset();
                    document.querySelector('#page-issues #ngay_xuat').value = utils.getTodayYYYYMMDD();
                    document.querySelector('#page-issues #nguoi_xuat').value = window.Auth ? window.Auth.user.full_name : '';
                    document.querySelector('#page-issues #btnSubmitIssue').innerHTML = '<i class="fas fa-save"></i> Xác nhận xuất kho';
                    document.querySelector('#page-issues #issueFormCard .card-title').innerHTML = '<i class="fas fa-file-export"></i> Lập Phiếu Xuất Kho';
                    this.currentItems = [];
                    this.updateItemsTable();
                }
            }
        });

        btnCloseForm.addEventListener('click', () => {
            btnToggleForm.click();
        });

        // Autocomplete
        const searchItem = document.querySelector('#page-issues #search_item');
        const clearSearchItem = document.querySelector('#page-issues #clearSearchItem');
        const itemDropdown = document.querySelector('#page-issues #itemDropdown');
        const selectedItemId = document.querySelector('#page-issues #selected_item_id');
        const selectedItemName = document.querySelector('#page-issues #selected_item_name');
        const selectedItemStock = document.querySelector('#page-issues #selected_item_stock');
        const itemQty = document.querySelector('#page-issues #item_qty');

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
                    <li class="autocomplete-add-new" id="btnAddNewProductIssue">
                        <i class="fas fa-plus-circle"></i> Thêm sản phẩm mới vào kho
                    </li>
                `;
                itemDropdown.style.display = 'block';
            }
        });

        clearSearchItem.addEventListener('click', () => {
            searchItem.value = '';
            document.querySelector('#page-issues #item_ma_so').value = '';
            document.querySelector('#page-issues #item_ton_hien_tai').value = '';
            document.querySelector('#page-issues #item_dvt').value = '';
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
            const addNewBtn = e.target.closest('#btnAddNewProductIssue');
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
                selectedItemStock.value = li.dataset.stock;
                searchItem.value = `${li.dataset.code} - ${li.dataset.name}`;
                document.querySelector('#page-issues #item_ma_so').value = li.dataset.code;
                document.querySelector('#page-issues #item_ton_hien_tai').value = utils.formatNumber(li.dataset.stock);
                document.querySelector('#page-issues #item_dvt').value = li.dataset.dvt;
                
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
        document.querySelector('#page-issues #btnAddItem').addEventListener('click', () => {
            const id = selectedItemId.value;
            const searchVal = searchItem.value;
            const qty = parseInt(document.querySelector('#page-issues #item_qty').value);
            const stock = parseInt(selectedItemStock.value);
            const congDoan = document.querySelector('#page-issues #item_cong_doan').value;
            const loaiXuat = document.querySelector('#page-issues #item_loai_xuat').value || 'Cấp mới';

            if (!id) {
                window.toast.error('Vui lòng chọn một mặt hàng từ danh sách gợi ý');
                return;
            }
            if (!qty || qty <= 0) {
                window.toast.error('Số lượng phải lớn hơn 0');
                return;
            }
            
            // Check if stock is sufficient
            // We need to account for items already added in the list
            const existingItem = this.currentItems.find(i => i.item_id == id);
            const currentQty = existingItem ? existingItem.so_luong : 0;
            
            if (qty + currentQty > stock) {
                window.toast.error(`Vật tư này chỉ còn tồn kho ${stock}. Không thể xuất quá số lượng hiện có.`);
                return;
            }

            // Check if item already exists
            const existingIndex = this.currentItems.findIndex(i => i.item_id == id);
            if (existingIndex >= 0) {
                this.currentItems[existingIndex].so_luong += qty;
                if (congDoan) this.currentItems[existingIndex].cong_doan = congDoan;
                this.currentItems[existingIndex].loai_xuat = loaiXuat;
            } else {
                const ma_so = document.querySelector('#page-issues #item_ma_so').value;
                const ten_hang = selectedItemName.value;
                const dvt = document.querySelector('#page-issues #item_dvt').value;
                
                this.currentItems.push({
                    item_id: parseInt(id),
                    ma_so: ma_so,
                    ten_hang: ten_hang,
                    don_vi_tinh: dvt,
                    so_luong: qty,
                    cong_doan: congDoan,
                    loai_xuat: loaiXuat
                });
            }

            this.updateItemsTable();
            
            // Reset fields
            searchItem.value = '';
            selectedItemId.value = '';
            document.querySelector('#page-issues #item_ma_so').value = '';
            document.querySelector('#page-issues #item_ton_hien_tai').value = '';
            document.querySelector('#page-issues #item_dvt').value = '';
            document.querySelector('#page-issues #item_qty').value = '';
            document.querySelector('#page-issues #item_cong_doan').value = '';
            document.querySelector('#page-issues #item_loai_xuat').value = 'Cấp mới';
            clearSearchItem.style.display = 'none';
            searchItem.focus();
        });

        // Submit form
        document.querySelector('#page-issues #issueForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.currentItems.length === 0) {
                window.toast.error('Phiếu xuất phải có ít nhất 1 mặt hàng');
                return;
            }

            const submitBtn = document.querySelector('#page-issues #btnSubmitIssue');
            const nguoiYeuCau = document.querySelector('#page-issues #nguoi_yeu_cau').value;
            const nguoiXuat = document.querySelector('#page-issues #nguoi_xuat').value;
            const nguoiNhanPhieu = document.querySelector('#page-issues #nguoi_nhan_phieu').value;
            const ghiChu = document.querySelector('#page-issues #ghi_chu').value;
            
            const data = {
                ngay_xuat: document.querySelector('#page-issues #ngay_xuat').value,
                nguoi_yeu_cau: nguoiYeuCau,
                nguoi_xuat: nguoiXuat,
                loai_xuat: 'Theo chi tiết',
                ghi_chu: ghiChu,
                items: this.currentItems.map(i => ({
                    item_id: i.item_id,
                    so_luong: i.so_luong,
                    cong_doan: i.cong_doan || '',
                    nguoi_nhan: nguoiNhanPhieu,
                    loai_xuat: i.loai_xuat || 'Cấp mới'
                }))
            };

            utils.setLoading(submitBtn, true);

            try {
                if (this.editingIssueId) {
                    await api.issues.update(this.editingIssueId, data);
                    window.toast.success('Đã cập nhật phiếu xuất kho thành công');
                } else {
                    await api.issues.create(data);
                    window.toast.success('Đã lưu phiếu xuất kho thành công');
                }
                
                // Reset form
                this.editingIssueId = null;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Xác nhận xuất kho';
                document.querySelector('#page-issues #issueFormCard .card-title').innerHTML = '<i class="fas fa-file-export"></i> Lập Phiếu Xuất Kho';
                document.querySelector('#page-issues #issueForm').reset();
                document.querySelector('#page-issues #ngay_xuat').value = utils.getTodayYYYYMMDD();
                document.querySelector('#page-issues #nguoi_xuat').value = window.Auth ? window.Auth.user.full_name : '';
                this.currentItems = [];
                this.updateItemsTable();
                
                if (formCard && formCard.style.display !== 'none') {
                    btnToggleForm.click();
                }
                this.loadData();
                this.loadAutocompleteData(); // Refresh stock data
            } catch (error) {
                window.toast.error(error.message || 'Có lỗi xảy ra khi lưu phiếu');
            } finally {
                utils.setLoading(submitBtn, false);
            }
        });

        // Table actions (View / Delete)
        document.querySelector('#page-issues #tableContainer').addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.btn-delete');

            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                const row = this.table.options.data.find(r => r.id == id) || { ma_phieu: id };
                window.modal.confirmDelete('Xác nhận xóa', `Bạn có chắc chắn muốn xóa phiếu xuất <b>${row.ma_phieu}</b>?<br><i>Lưu ý: Tồn kho của các vật tư trong phiếu sẽ được hoàn lại.</i>`, async () => {
                    try {
                        await api.issues.delete(id);
                        window.toast.success('Đã xóa phiếu xuất');
                        this.loadData();
                    } catch (error) {
                        window.toast.error(error.message || 'Lỗi khi xóa phiếu');
                    }
                });
            }
        });
    },

    async viewIssueDetails(id) {
        try {
            const issue = await api.issues.get(id);
            
            let itemsHtml = issue.transactions.map((t, index) => {
                const isCapMoi = (t.loai_xuat === 'Cấp mới' || t.loai_xuat === 'Cấp Mới');
                const isThayThe = (t.loai_xuat === 'Thay thế' || t.loai_xuat === 'Thay Thế');
                return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${t.ma_so}</td>
                    <td>${t.ten_hang}</td>
                    <td class="text-right">${utils.formatNumber(t.so_luong)}</td>
                    <td>${t.don_vi_tinh}</td>
                    <td>${t.cong_doan || ''}</td>
                    <td class="text-center">${isCapMoi ? '<i class="fas fa-check text-success"></i>' : ''}</td>
                    <td class="text-center">${isThayThe ? '<i class="fas fa-check text-warning"></i>' : ''}</td>
                </tr>
            `;
            }).join('');

            const content = `
                <div class="issue-detail">
                    <div style="display: flex; gap: 20px; margin-bottom: 20px; background: var(--bg-card); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="flex: 1;">
                            <p style="margin: 0 0 8px 0;"><strong>Số Phiếu:</strong> ${issue.ma_phieu}</p>
                            <p style="margin: 0;"><strong>Ngày Xuất:</strong> ${utils.formatDate(issue.ngay_xuat)}</p>
                        </div>
                        <div style="flex: 1;">
                            <p style="margin: 0 0 8px 0;"><strong>Người Yêu Cầu:</strong> ${issue.nguoi_yeu_cau}</p>
                            <p style="margin: 0 0 8px 0;"><strong>Người Xuất:</strong> ${issue.nguoi_xuat}</p>
                            <p style="margin: 0 0 8px 0;"><strong>Loại Xuất:</strong> ${issue.loai_xuat || 'Cấp mới'}</p>
                            <p style="margin: 0;"><strong>Người Nhận:</strong> ${issue.transactions && issue.transactions.length > 0 ? (issue.transactions[0].nguoi_nhan || '') : ''}</p>
                        </div>
                        <div style="flex: 1;">
                            <p style="margin: 0;"><strong>Ghi Chú:</strong> ${issue.ghi_chu || ''}</p>
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
                                    <th>Công Đoạn</th>
                                    <th class="text-center">Cấp mới</th>
                                    <th class="text-center">Thay thế</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
                ${utils.generatePrintTemplate('issue', issue)}
            `;
            
            const buttons = [];
            if (window.Auth && window.Auth.hasPermission('perm_edit')) {
                buttons.push({
                    html: '<i class="fas fa-edit"></i> Sửa',
                    className: 'btn btn-ghost btn-sm text-warning',
                    onClick: (win) => {
                        win.remove();
                        IssuesPage.editIssue(issue);
                    }
                });
            }
            if (window.Auth && window.Auth.hasPermission('perm_delete')) {
                buttons.push({
                    html: '<i class="fas fa-trash"></i> Xóa',
                    className: 'btn btn-ghost btn-sm text-danger',
                    onClick: async (win) => {
                        if (confirm('Bạn có chắc chắn muốn xóa phiếu này? Số lượng tồn kho sẽ được tính toán lại.')) {
                            try {
                                await api.issues.delete(id);
                                window.toast.success('Xóa phiếu thành công');
                                win.remove();
                                IssuesPage.loadData();
                            } catch (error) {
                                window.toast.error(error.message);
                            }
                        }
                    }
                });
            }

            window.floatingWindow.show({
                id: 'issue-' + id,
                title: 'Chi Tiết Phiếu Xuất Kho - ' + issue.ma_phieu,
                content: content,
                width: '1400px',
                height: '800px',
                print: true,
                exportExcelUrl: `${API_BASE_URL}/issues/${id}/export-excel`,
                buttons: buttons
            });
        } catch (error) {
            window.toast.error('Không thể tải chi tiết phiếu xuất');
        }
    },
    
    editIssue(issue) {
        this.editingIssueId = issue.id;
        
        // Open form if closed
        const formCard = document.querySelector('#page-issues #issueFormCard');
        const btnToggleForm = document.querySelector('#page-issues #btnToggleForm');
        if (formCard.style.display === 'none') {
            btnToggleForm.click();
        }
        
        // Populate header
        document.querySelector('#page-issues #issueFormCard .card-title').innerHTML = `<i class="fas fa-edit"></i> Sửa Phiếu Xuất: ${issue.ma_phieu}`;
        document.querySelector('#page-issues #ngay_xuat').value = issue.ngay_xuat;
        document.querySelector('#page-issues #nguoi_yeu_cau').value = issue.nguoi_yeu_cau || '';
        document.querySelector('#page-issues #nguoi_xuat').value = issue.nguoi_xuat || '';
        document.querySelector('#page-issues #ghi_chu').value = issue.ghi_chu || '';
        
        const nguoiNhanPhieu = issue.transactions.length > 0 ? issue.transactions[0].nguoi_nhan : '';
        document.querySelector('#page-issues #nguoi_nhan_phieu').value = nguoiNhanPhieu || '';
        
        // Populate items
        this.currentItems = issue.transactions.map(tx => ({
            item_id: tx.item_id,
            ma_so: tx.ma_so,
            ten_hang: tx.ten_hang,
            so_luong: tx.so_luong,
            don_vi_tinh: tx.don_vi_tinh,
            ton_cuoi: tx.ton_cuoi || 0,
            cong_doan: tx.cong_doan || '',
            loai_xuat: tx.loai_xuat || 'Cấp mới'
        }));
        
        this.updateItemsTable();
        
        // Update button
        const submitBtn = document.querySelector('#page-issues #btnSubmitIssue');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Cập nhật phiếu';
        submitBtn.disabled = false;
        
        // Scroll to form
        formCard.scrollIntoView({ behavior: 'smooth' });
    },
    
    renderIssueDropdown(issues) {
        const dropdown = document.querySelector('#page-issues #searchIssueDropdown');
        if (!dropdown) return;
        
        if (issues.length === 0) {
            dropdown.innerHTML = '<div class="p-2 text-muted text-center">Không tìm thấy phiếu</div>';
        } else {
            dropdown.innerHTML = issues.map(issue => `
                <div class="autocomplete-item" onclick="IssuesPage.selectIssue('${issue.ma_phieu}')" style="padding: 10px; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                    <div class="item-name" style="font-weight: 500;">${issue.ma_phieu}</div>
                    <div class="item-code" style="font-size: 0.85em; color: var(--text-muted);">${issue.nguoi_xuat} | ${utils.formatDate(issue.ngay_xuat)}</div>
                </div>
            `).join('');
        }
        dropdown.classList.add('show');
    },
    
    selectIssue(ma_phieu) {
        const searchInput = document.querySelector('#page-issues #searchInput');
        searchInput.value = ma_phieu;
        this.params.search = ma_phieu;
        this.params.page = 1;
        
        document.querySelector('#page-issues #searchIssueDropdown').classList.remove('show');
        document.querySelector('#page-issues #clearSearchIssue').style.display = 'block';
        
        this.loadData();
    },

    setActiveIssueAutocomplete(items, currentFocus) {
        items.forEach(item => item.style.backgroundColor = '');
        if (currentFocus > -1 && items[currentFocus]) {
            items[currentFocus].style.backgroundColor = 'var(--bg-hover)';
            items[currentFocus].scrollIntoView({ block: 'nearest' });
        }
    },

    showNewProductModal(prefillName = '') {
        const content = `
            <form id="newProductFormIssue">
                <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Tên hàng hóa <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="np_ten_hang_i" required value="${prefillName}" placeholder="Nhập tên hàng hóa">
                    </div>
                    <div class="form-group">
                        <label>Mã số / Part number <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="np_ma_so_i" required placeholder="VD: TS-280-10MM">
                    </div>
                    <div class="form-group">
                        <label>Nhà cung cấp</label>
                        <input type="text" class="form-control" id="np_nha_cung_cap_i" placeholder="Tên nhà cung cấp">
                    </div>
                    <div class="form-group">
                        <label>Đơn vị tính</label>
                        <select class="form-control" id="np_don_vi_tinh_i">
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
                        <input type="text" class="form-control" id="np_vi_tri_i" placeholder="VD: VỊ TRÍ" value="VỊ TRÍ">
                    </div>
                    <div class="form-group">
                        <label>Định mức tối thiểu</label>
                        <input type="number" class="form-control" id="np_dinh_muc_i" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <label>Công đoạn sử dụng</label>
                        <input type="text" class="form-control" id="np_cong_doan_i" placeholder="Công đoạn">
                    </div>
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Ghi chú</label>
                        <input type="text" class="form-control" id="np_ghi_chu_i" placeholder="Ghi chú thêm (nếu có)">
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
                        const ten_hang = document.getElementById('np_ten_hang_i').value.trim();
                        const ma_so = document.getElementById('np_ma_so_i').value.trim();

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
                            nha_cung_cap: document.getElementById('np_nha_cung_cap_i').value.trim(),
                            don_vi_tinh: document.getElementById('np_don_vi_tinh_i').value,
                            vi_tri: document.getElementById('np_vi_tri_i').value.trim(),
                            dinh_muc: parseInt(document.getElementById('np_dinh_muc_i').value) || 0,
                            cong_doan: document.getElementById('np_cong_doan_i').value.trim(),
                            ghi_chu: document.getElementById('np_ghi_chu_i').value.trim(),
                            ton_dau: 0
                        };

                        try {
                            const newItem = await api.inventory.create(productData);
                            window.toast.success(`Đã thêm sản phẩm "${newItem.ten_hang}" vào kho`);
                            window.modal.hide();

                            // Refresh autocomplete data
                            await this.loadAutocompleteData();

                            // Auto-select the new item in the form
                            const searchItem = document.querySelector('#page-issues #search_item');
                            const selectedItemId = document.querySelector('#page-issues #selected_item_id');
                            const selectedItemName = document.querySelector('#page-issues #selected_item_name');
                            const selectedItemStock = document.querySelector('#page-issues #selected_item_stock');
                            const clearSearchItem = document.querySelector('#page-issues #clearSearchItem');

                            selectedItemId.value = newItem.id;
                            selectedItemName.value = newItem.ten_hang;
                            selectedItemStock.value = newItem.ton_cuoi;
                            searchItem.value = `${newItem.ma_so} - ${newItem.ten_hang}`;
                            document.querySelector('#page-issues #item_ma_so').value = newItem.ma_so;
                            document.querySelector('#page-issues #item_ton_hien_tai').value = utils.formatNumber(newItem.ton_cuoi);
                            document.querySelector('#page-issues #item_dvt').value = newItem.don_vi_tinh;
                            clearSearchItem.style.display = 'block';

                            // Focus on quantity
                            document.querySelector('#page-issues #item_qty').focus();
                        } catch (error) {
                            window.toast.error(error.message || 'Lỗi khi thêm sản phẩm mới');
                        }
                    }
                }
            ]
        });
    },

    setupCategoryAutocomplete(inputId, dropdownId, categoryCode) {
        const input = document.querySelector(`#page-issues #${inputId}`);
        const dropdown = document.querySelector(`#page-issues #${dropdownId}`);
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
