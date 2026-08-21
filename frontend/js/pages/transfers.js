const TransfersPage = {
    async render(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Phiếu chuyển kho</h3>
                    <button class="btn btn-primary" id="btnCreateTransfer">
                        <i class="fas fa-plus"></i> Tạo phiếu chuyển
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table" id="transfersTable">
                            <thead>
                                <tr>
                                    <th>Mã phiếu</th>
                                    <th>Ngày chuyển</th>
                                    <th>Từ kho</th>
                                    <th>Đến kho</th>
                                    <th>Người chuyển</th>
                                    <th>Ghi chú</th>
                                    <th style="width: 100px; text-align: center;">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('btnCreateTransfer').addEventListener('click', () => {
            if (!window.Auth.hasPermission('perm_add')) {
                if (window.toast) window.toast.error("Bạn không có quyền thực hiện thao tác này.");
                else alert("Bạn không có quyền thực hiện thao tác này.");
                return;
            }
            this.showModal();
        });
        await this.loadData();
        this.bindGlobalEvents();
    },

    async loadData() {
        try {
            const transfers = await api.fetchJSON('/transfers');
            const warehouses = await api.fetchJSON('/warehouses');
            const whMap = {};
            warehouses.forEach(w => whMap[w.id] = w.ten_kho);
            
            const tbody = document.querySelector('#transfersTable tbody');
            tbody.innerHTML = '';
            
            transfers.forEach(t => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.addEventListener('click', (e) => {
                    if (e.target.closest('.action-buttons')) return;
                    this.viewTransferDetails(t.id);
                });
                tr.innerHTML = `
                    <td>${utils.escapeHtml(t.ma_phieu)}</td>
                    <td>${utils.formatDate(t.ngay_chuyen)}</td>
                    <td>${utils.escapeHtml(whMap[t.tu_kho_id] || t.tu_kho_id)}</td>
                    <td>${utils.escapeHtml(whMap[t.den_kho_id] || t.den_kho_id)}</td>
                    <td>${utils.escapeHtml(t.nguoi_chuyen || '')}</td>
                    <td>${utils.escapeHtml(t.ghi_chu || '')}</td>
                    <td class="text-center">
                        <div class="action-buttons" style="display: flex; gap: 5px; justify-content: center;">
                            <button class="btn btn-ghost text-danger btn-delete" data-id="${t.id}" title="Xóa & Hoàn tác"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    this.deleteTransfer(id);
                });
            });
            
        } catch(e) {
            if(window.toast) window.toast.error("Lỗi khi tải danh sách phiếu chuyển: " + e.message);
        }
    },

    async showModal(transfer = null) {
        const warehouses = await api.fetchJSON('/warehouses');
        let allOptionsHtml = '';
        let allowedOptionsHtml = '';
        
        // Determine allowed IDs for "Từ kho"
        const isAdmin = window.Auth.user.is_admin;
        const perms = window.Auth.user.permissions || [];
        const allowedIds = perms.filter(p => p.perm_view).map(p => p.warehouse_id);

        warehouses.forEach(w => {
            const html = `<option value="${w.id}">${utils.escapeHtml(w.ten_kho)}</option>`;
            allOptionsHtml += html;
            
            if (isAdmin || allowedIds.includes(w.id)) {
                allowedOptionsHtml += html;
            }
        });
        
        // If user has no access to any warehouse, they can't create transfer out
        if (allowedOptionsHtml === '') {
            window.toast.error("Bạn không có quyền chuyển kho từ bất kỳ kho nào!");
            return;
        }
        
        const content = `
            <form id="transferForm">
                <div class="row">
                    <div class="col-md-6 form-group mb-3">
                        <label>Mã phiếu (*)</label>
                        <input type="text" id="tr_ma_phieu" class="form-control" required placeholder="Tự tạo hoặc nhập mã">
                    </div>
                    <div class="col-md-6 form-group mb-3">
                        <label>Ngày chuyển (*)</label>
                        <input type="date" id="tr_ngay_chuyen" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 form-group mb-3">
                        <label>Từ kho (*)</label>
                        <select id="tr_tu_kho" class="form-control" required>${allowedOptionsHtml}</select>
                    </div>
                    <div class="col-md-6 form-group mb-3">
                        <label>Đến kho (*)</label>
                        <select id="tr_den_kho" class="form-control" required>${allOptionsHtml}</select>
                    </div>
                </div>
                <div class="form-group mb-3">
                    <label>Người chuyển</label>
                    <input type="text" id="tr_nguoi_chuyen" class="form-control" value="${window.Auth.user.full_name || window.Auth.user.username || ''}">
                </div>
                <div class="form-group mb-3">
                    <label>Ghi chú</label>
                    <textarea id="tr_ghi_chu" class="form-control"></textarea>
                </div>
                
                <h5 class="mt-4">Chi tiết vật tư chuyển</h5>
                <table class="data-table" id="transferItemsTable" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Vật tư (Tìm theo mã/tên)</th>
                            <th style="width: 130px;">Vị trí (Từ)</th>
                            <th style="width: 70px;">Số lượng</th>
                            <th style="width: 130px;">Vị trí (Đến)</th>
                            <th style="width: 40px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Items will be added here -->
                    </tbody>
                </table>
                <button type="button" class="btn btn-secondary btn-sm" id="btnAddItem"><i class="fas fa-plus"></i> Thêm vật tư</button>
            </form>
        `;
        
        this.editingTransferId = transfer ? transfer.id : null;
        
        window.modal.show({
            title: transfer ? 'Sửa phiếu chuyển kho' : 'Tạo phiếu chuyển kho',
            content: content,
            width: '1000px',
            buttons: [
                { text: 'Hủy', class: 'btn-ghost text-muted' },
                { text: transfer ? 'Cập nhật phiếu' : 'Tạo phiếu', class: 'btn-primary', onClick: async () => this.submitTransfer() }
            ]
        });
        
        if (transfer) {
            document.getElementById('tr_ma_phieu').value = transfer.ma_phieu;
            document.getElementById('tr_ma_phieu').readOnly = true;
            document.getElementById('tr_ngay_chuyen').value = transfer.ngay_chuyen;
            document.getElementById('tr_tu_kho').value = transfer.tu_kho_id;
            document.getElementById('tr_tu_kho').disabled = true;
            document.getElementById('tr_den_kho').value = transfer.den_kho_id;
            document.getElementById('tr_den_kho').disabled = true;
            document.getElementById('tr_nguoi_chuyen').value = transfer.nguoi_chuyen || '';
            document.getElementById('tr_ghi_chu').value = transfer.ghi_chu || '';
            
            if (transfer.transactions && transfer.transactions.length > 0) {
                transfer.transactions.forEach(tx => this.addItemRow(tx));
            } else {
                this.addItemRow();
            }
        } else {
            // Add random ma phieu
            document.getElementById('tr_ma_phieu').value = 'CK-' + new Date().getTime().toString().slice(-6);
            this.addItemRow(); // add first row
        }
        
        document.getElementById('btnAddItem').addEventListener('click', () => this.addItemRow());
    },
    
    addItemRow(tx = null) {
        const tbody = document.querySelector('#transferItemsTable tbody');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="position: relative; width: 100%;">
                    <input type="text" class="form-control search-item" placeholder="Nhập mã hoặc tên vật tư để tìm..." required style="width: 100%;" autocomplete="off">
                    <input type="hidden" class="item-id">
                    <div class="autocomplete-results" style="display: none; position: absolute; z-index: 100; width: 100%; max-height: 200px; overflow-y: auto; background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
                </div>
            </td>
            <td><input type="text" class="form-control item-vitri-cu" readonly value="${tx && tx.vi_tri_cu ? tx.vi_tri_cu : ''}"></td>
            <td><input type="number" class="form-control item-qty" min="1" required value="${tx ? tx.so_luong : ''}" style="width: 70px;"></td>
            <td><input type="text" class="form-control item-vitri-moi" placeholder="Vị trí mới" value="${tx && tx.vi_tri_moi ? tx.vi_tri_moi : ''}"></td>
            <td class="text-center"><button type="button" class="btn btn-ghost btn-icon text-danger btn-remove-row" title="Xóa dòng"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
        
        tr.querySelector('.btn-remove-row').addEventListener('click', () => tr.remove());
        
        // Autocomplete logic
        const input = tr.querySelector('.search-item');
        const hidden = tr.querySelector('.item-id');
        const results = tr.querySelector('.autocomplete-results');
        
        if (tx) {
            input.value = `${tx.ma_so} - ${tx.ten_hang}`;
            hidden.value = tx.item_id;
        }
        let timeout = null;
        
        input.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const val = e.target.value.trim();
            hidden.value = ''; // Reset hidden value when user types
            if (!val) {
                results.style.display = 'none';
                return;
            }
            timeout = setTimeout(async () => {
                const kho_id = document.getElementById('tr_tu_kho').value;
                const items = await api.fetchJSON('/items/all?search=' + encodeURIComponent(val) + '&kho_id=' + kho_id);
                if (items.length > 0) {
                    results.innerHTML = items.map(item => `
                        <div class="autocomplete-item" data-id="${item.id}" data-name="${utils.escapeHtml(item.ten_hang)}" data-vitri="${utils.escapeHtml(item.vi_tri || '')}" style="padding: 8px; cursor: pointer; border-bottom: 1px solid var(--border-color); white-space: normal; word-break: break-word; line-height: 1.4;">
                            <strong>${utils.escapeHtml(item.ma_so)}</strong> - ${utils.escapeHtml(item.ten_hang)} (Tồn: ${item.ton_cuoi})
                        </div>
                    `).join('');
                    results.style.display = 'block';
                    
                    results.querySelectorAll('.autocomplete-item').forEach(div => {
                        div.addEventListener('click', (e) => {
                            e.stopPropagation();
                            hidden.value = div.dataset.id;
                            input.value = div.dataset.name;
                            tr.querySelector('.item-vitri-cu').value = div.dataset.vitri;
                            results.style.display = 'none';
                        });
                    });
                } else {
                    results.innerHTML = '<div style="padding: 8px;">Không tìm thấy kết quả trong kho nguồn</div>';
                    results.style.display = 'block';
                }
            }, 300);
        });
        
        // We handle hiding via a global click listener to prevent tab-switching issues
    },
    
    bindGlobalEvents() {
        if (!this._globalClickHandler) {
            this._globalClickHandler = (e) => {
                document.querySelectorAll('#transferItemsTable .autocomplete-results').forEach(results => {
                    const tr = results.closest('tr');
                    if (tr && !tr.contains(e.target)) {
                        results.style.display = 'none';
                    }
                });
            };
            document.addEventListener('click', this._globalClickHandler);
        }
    },
    
    async submitTransfer() {
        const form = document.getElementById('transferForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const tu_kho = document.getElementById('tr_tu_kho').value;
        const den_kho = document.getElementById('tr_den_kho').value;
        if (tu_kho === den_kho) {
            if(window.toast) window.toast.error('Kho xuất và kho nhập phải khác nhau!');
            return;
        }
        
        const items = [];
        const rows = document.querySelectorAll('#transferItemsTable tbody tr');
        let hasError = false;
        
        for (const tr of rows) {
            const itemId = tr.querySelector('.item-id').value;
            const qty = parseInt(tr.querySelector('.item-qty').value);
            const vitri_moi = tr.querySelector('.item-vitri-moi').value.trim();
            if (!itemId) {
                if(window.toast) window.toast.error('Vui lòng chọn vật tư từ danh sách gợi ý');
                hasError = true;
                break;
            }
            if (!qty || qty <= 0) {
                if(window.toast) window.toast.error('Số lượng chuyển phải > 0');
                hasError = true;
                break;
            }
            items.push({ item_id: parseInt(itemId), so_luong: qty, vi_tri_moi: vitri_moi });
        }
        
        if (hasError) return;
        if (items.length === 0) {
            if(window.toast) window.toast.error('Vui lòng thêm ít nhất 1 vật tư');
            return;
        }
        
        const data = {
            ma_phieu: document.getElementById('tr_ma_phieu').value.trim(),
            ngay_chuyen: document.getElementById('tr_ngay_chuyen').value,
            tu_kho_id: parseInt(tu_kho),
            den_kho_id: parseInt(den_kho),
            nguoi_chuyen: document.getElementById('tr_nguoi_chuyen').value.trim(),
            ghi_chu: document.getElementById('tr_ghi_chu').value.trim(),
            items: items
        };
        
        try {
            if (this.editingTransferId) {
                data.tu_kho_id = document.getElementById('tr_tu_kho').value;
                data.den_kho_id = document.getElementById('tr_den_kho').value;
                await api.transfers.update(this.editingTransferId, data);
                if(window.toast) window.toast.success("Cập nhật phiếu chuyển kho thành công");
            } else {
                await api.transfers.create(data);
                if(window.toast) window.toast.success("Tạo phiếu chuyển kho thành công");
            }
            window.modal.hide();
            this.loadData();
        } catch(e) {
            if(window.toast) window.toast.error("Lỗi: " + e.message);
        }
    },

    async deleteTransfer(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa phiếu chuyển kho này? Dữ liệu tồn kho sẽ được hoàn lại.')) return;
        try {
            await api.fetchJSON('/transfers/' + id, { method: 'DELETE' });
            if(window.toast) window.toast.success("Đã xóa phiếu và hoàn tồn kho");
            this.loadData();
        } catch(e) {
            if(window.toast) window.toast.error("Lỗi xóa: " + e.message);
        }
    },
    
    async viewTransferDetails(id) {
        try {
            const transfer = await api.fetchJSON('/transfers/' + id);
            const warehouses = await api.fetchJSON('/warehouses');
            const whMap = {};
            warehouses.forEach(w => whMap[w.id] = w.ten_kho);
            
            let itemsHtml = transfer.transactions.map((t, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${utils.escapeHtml(t.ma_so)}</td>
                    <td>${utils.escapeHtml(t.ten_hang)}</td>
                    <td class="text-right">${utils.formatNumber(t.so_luong)}</td>
                    <td>${utils.escapeHtml(t.don_vi_tinh || '')}</td>
                    <td>${utils.escapeHtml(t.vi_tri_cu || '')}</td>
                    <td>${utils.escapeHtml(t.vi_tri_moi || '')}</td>
                    <td>${utils.escapeHtml(t.ghi_chu || '')}</td>
                </tr>
            `).join('');

            const content = `
                <div class="receipt-detail">
                    <div style="display: flex; gap: 20px; margin-bottom: 20px; background: var(--bg-card); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="flex: 1;">
                            <p style="margin: 0 0 8px 0;"><strong>Số Phiếu:</strong> ${utils.escapeHtml(transfer.ma_phieu)}</p>
                            <p style="margin: 0 0 8px 0;"><strong>Ngày Chuyển:</strong> ${utils.formatDate(transfer.ngay_chuyen)}</p>
                            <p style="margin: 0;"><strong>Người Chuyển:</strong> ${utils.escapeHtml(transfer.nguoi_chuyen)}</p>
                        </div>
                        <div style="flex: 1;">
                            <p style="margin: 0 0 8px 0;"><strong>Từ Kho:</strong> ${utils.escapeHtml(whMap[transfer.tu_kho_id] || transfer.tu_kho_id)}</p>
                            <p style="margin: 0 0 8px 0;"><strong>Đến Kho:</strong> ${utils.escapeHtml(whMap[transfer.den_kho_id] || transfer.den_kho_id)}</p>
                            <p style="margin: 0;"><strong>Ghi Chú:</strong> ${transfer.ghi_chu || ''}</p>
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
                                    <th>Vị Trí Từ</th>
                                    <th>Vị Trí Đến</th>
                                    <th>Ghi Chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
                ${utils.generatePrintTemplate('transfer', transfer)}
            `;

            const buttons = [];
            if (window.Auth && window.Auth.hasPermission('perm_edit')) {
                buttons.push({
                    html: '<i class="fas fa-edit"></i> Sửa',
                    className: 'btn btn-ghost btn-sm text-warning',
                    onClick: (win) => {
                        win.remove();
                        TransfersPage.showModal(transfer);
                    }
                });
            }
            if (window.Auth && window.Auth.hasPermission('perm_delete')) {
                buttons.push({
                    html: '<i class="fas fa-trash"></i> Xóa',
                    className: 'btn btn-ghost btn-sm text-danger',
                    onClick: async (win) => {
                        if (confirm('Bạn có chắc chắn muốn xóa phiếu này? Dữ liệu tồn kho sẽ được tính toán lại.')) {
                            try {
                                await api.transfers.delete(id);
                                window.toast.success('Xóa phiếu thành công');
                                win.remove();
                                TransfersPage.loadData();
                            } catch (error) {
                                window.toast.error(error.message);
                            }
                        }
                    }
                });
            }

            window.floatingWindow.show({
                id: 'transfer-' + id,
                title: 'Chi Tiết Phiếu Chuyển Kho - ' + transfer.ma_phieu,
                content: content,
                width: '1400px',
                height: '800px',
                print: true,
                exportExcelUrl: `${API_BASE_URL}/transfers/${id}/export-excel`,
                buttons: buttons
            });
        } catch (error) {
            if(window.toast) window.toast.error('Không thể tải chi tiết phiếu chuyển: ' + error.message);
        }
    }
};
