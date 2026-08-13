const WarehousesPage = {
    async render(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Quản lý kho</h3>
                    <button class="btn btn-primary" id="btnCreateWarehouse">
                        <i class="fas fa-plus"></i> Thêm kho mới
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table" id="warehousesTable">
                            <thead>
                                <tr>
                                    <th style="width: 50px;">ID</th>
                                    <th>Mã kho</th>
                                    <th>Tên kho</th>
                                    <th>Địa chỉ</th>
                                    <th>Mô tả</th>
                                    <th style="width: 100px; text-align: center;">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('btnCreateWarehouse').addEventListener('click', () => {
            if (!window.Auth.hasPermission('perm_add')) {
                if (window.toast) window.toast.error("Bạn không có quyền thực hiện thao tác này.");
                else alert("Bạn không có quyền thực hiện thao tác này.");
                return;
            }
            this.showModal();
        });
        await this.loadData();
    },

    async loadData() {
        try {
            const warehouses = await api.fetchJSON('/warehouses');
            const tbody = document.querySelector('#warehousesTable tbody');
            tbody.innerHTML = '';
            
            warehouses.forEach(w => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${w.id}</td>
                    <td>${utils.escapeHtml(w.ma_kho)}</td>
                    <td>${utils.escapeHtml(w.ten_kho)}</td>
                    <td>${utils.escapeHtml(w.dia_chi || '')}</td>
                    <td>${utils.escapeHtml(w.mo_ta || '')}</td>
                    <td class="text-center">
                        <div class="action-buttons" style="display: flex; gap: 5px; justify-content: center;">
                            <button class="btn btn-ghost text-primary btn-edit" data-id="${w.id}" title="Sửa"><i class="fas fa-edit"></i></button>
                            ${w.id !== 1 ? `<button class="btn btn-ghost text-danger btn-delete" data-id="${w.id}" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    const w = warehouses.find(x => x.id === id);
                    this.showModal(w);
                });
            });
            
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    this.deleteWarehouse(id);
                });
            });
            
        } catch(e) {
            if(window.toast) window.toast.error("Lỗi khi tải danh sách kho: " + e.message);
        }
    },

    showModal(warehouse = null) {
        const isEdit = !!warehouse;
        const content = `
            <form id="warehouseForm">
                <div class="form-group mb-3">
                    <label>Mã kho (*)</label>
                    <input type="text" id="wh_ma_kho" class="form-control" required value="${isEdit ? warehouse.ma_kho : ''}">
                </div>
                <div class="form-group mb-3">
                    <label>Tên kho (*)</label>
                    <input type="text" id="wh_ten_kho" class="form-control" required value="${isEdit ? warehouse.ten_kho : ''}">
                </div>
                <div class="form-group mb-3">
                    <label>Địa chỉ</label>
                    <input type="text" id="wh_dia_chi" class="form-control" value="${isEdit ? (warehouse.dia_chi || '') : ''}">
                </div>
                <div class="form-group mb-3">
                    <label>Mô tả</label>
                    <textarea id="wh_mo_ta" class="form-control">${isEdit ? (warehouse.mo_ta || '') : ''}</textarea>
                </div>
            </form>
        `;
        
        window.modal.show({
            title: isEdit ? 'Cập nhật kho' : 'Thêm kho mới',
            content: content,
            buttons: [
                { text: 'Hủy', class: 'btn-ghost text-muted' },
                { text: 'Lưu', class: 'btn-primary', onClick: async () => {
                    const form = document.getElementById('warehouseForm');
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }
                    const data = {
                        ma_kho: document.getElementById('wh_ma_kho').value.trim(),
                        ten_kho: document.getElementById('wh_ten_kho').value.trim(),
                        dia_chi: document.getElementById('wh_dia_chi').value.trim(),
                        mo_ta: document.getElementById('wh_mo_ta').value.trim()
                    };
                    
                    try {
                        if (isEdit) {
                            await api.fetchJSON('/warehouses/' + warehouse.id, { method: 'PUT', body: JSON.stringify(data) });
                            if(window.toast) window.toast.success("Đã cập nhật kho");
                        } else {
                            await api.fetchJSON('/warehouses', { method: 'POST', body: JSON.stringify(data) });
                            if(window.toast) window.toast.success("Đã thêm kho mới");
                        }
                        window.modal.hide();
                        this.loadData();
                        // Also refresh warehouse selector
                        App.initWarehouseSelector();
                    } catch(e) {
                        if(window.toast) window.toast.error("Lỗi: " + e.message);
                    }
                }}
            ]
        });
    },

    async deleteWarehouse(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa kho này? LƯU Ý: Không thể xóa kho nếu đang có hàng tồn bên trong.')) return;
        try {
            await api.fetchJSON('/warehouses/' + id, { method: 'DELETE' });
            if(window.toast) window.toast.success("Đã xóa kho");
            this.loadData();
            App.initWarehouseSelector();
        } catch(e) {
            if(window.toast) window.toast.error("Lỗi xóa kho: " + e.message);
        }
    }
};
