/**
 * Phân quyền (Users Management)
 */
const UsersPage = {
    async render(container) {
        if (!window.Auth.user.is_admin) {
            container.innerHTML = '<div class="p-4"><h3 class="text-danger">Không có quyền truy cập</h3></div>';
            return;
        }

        container.innerHTML = `
            <div class="card mb-4">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin:0">Quản lý Tài Khoản & Phân Quyền</h3>
                    <button class="btn btn-primary" id="btnCreateUser">
                        <i class="fas fa-plus"></i> Thêm tài khoản
                    </button>
                </div>
                <div class="table-container">
                    <table class="data-table" id="usersTable">
                        <thead>
                            <tr>
                                <th>Tên đăng nhập</th>
                                <th>Email</th>
                                <th>Họ tên</th>
                                <th>Vai trò</th>
                                <th>Quyền hạn</th>
                                <th>Trạng thái</th>
                                <th style="width: 100px; text-align: center;">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="7" class="text-center">Đang tải...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        try {
            this.users = await api.users.list();
            this.renderTable();
        } catch (error) {
            window.toast.error('Lỗi tải danh sách người dùng: ' + error.message);
        }
    },

    renderTable() {
        const tbody = document.querySelector('#usersTable tbody');
        if (!this.users || this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không có dữ liệu</td></tr>';
            return;
        }

        const permissionNames = {
            perm_view: 'Xem',
            perm_add: 'Thêm',
            perm_edit: 'Sửa',
            perm_delete: 'Xóa',
            perm_approve: 'Duyệt',
            perm_print: 'In',
            perm_excel: 'Xuất Excel'
        };

        tbody.innerHTML = this.users.map(u => {
            let perms = [];
            if (u.is_admin) {
                perms.push('<span class="badge" style="background:var(--accent-blue);color:#fff">Toàn quyền (Admin)</span>');
            } else if (u.permissions && u.permissions.length > 0) {
                u.permissions.forEach(p => {
                    let whPerms = [];
                    for (const [key, name] of Object.entries(permissionNames)) {
                        if (p[key]) whPerms.push(name);
                    }
                    if (whPerms.length > 0) {
                        perms.push(`<span class="badge" style="background:var(--accent-blue-glow);color:var(--accent-blue);margin-bottom:2px">Kho ID ${p.warehouse_id}: ${whPerms.join(', ')}</span><br>`);
                    }
                });
            }

            return `
                <tr>
                    <td><strong>${u.username}</strong></td>
                    <td>${u.email || '-'}</td>
                    <td>${u.full_name || '-'}</td>
                    <td>${u.role}</td>
                    <td><div style="display:flex;flex-wrap:wrap;gap:4px">${perms.join('') || '<span class="text-muted">Không có quyền</span>'}</div></td>
                    <td>
                        ${u.is_active 
                            ? '<span class="badge bg-success-light text-success">Hoạt động</span>'
                            : '<span class="badge bg-danger-light text-danger">Khóa</span>'
                        }
                    </td>
                    <td class="text-center">
                        <div class="action-buttons">
                            <button class="btn btn-ghost text-primary btn-edit" data-id="${u.id}" title="Phân quyền/Sửa"><i class="fas fa-edit"></i></button>
                            ${u.username !== 'admin' ? `<button class="btn btn-ghost text-danger btn-delete" data-id="${u.id}" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Bind buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => this.showModal(parseInt(e.currentTarget.dataset.id)));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDelete(parseInt(e.currentTarget.dataset.id)));
        });
    },

    async showModal(userId = null) {
        const user = userId ? this.users.find(u => u.id === userId) : null;
        
        let warehouses = [];
        try {
            warehouses = await api.fetchJSON('/warehouses');
        } catch(e) {
            console.error("Lỗi tải kho", e);
        }
        
        const perms = [
            { id: 'perm_view', label: 'Xem' },
            { id: 'perm_add', label: 'Thêm' },
            { id: 'perm_edit', label: 'Sửa' },
            { id: 'perm_delete', label: 'Xóa' },
            { id: 'perm_approve', label: 'Duyệt' },
            { id: 'perm_print', label: 'In' },
            { id: 'perm_excel', label: 'Xuất Excel' }
        ];

        let warehouseRows = '';
        if (warehouses && warehouses.length > 0) {
            warehouses.forEach(wh => {
                let userPerm = user && user.permissions ? user.permissions.find(p => p.warehouse_id === wh.id) : null;
                
                let checksHtml = perms.map(p => `
                    <td class="text-center" style="vertical-align: middle;">
                        <input type="checkbox" class="perm-checkbox" data-kho="${wh.id}" data-perm="${p.id}" ${(!user && p.id === 'perm_view') || (userPerm && userPerm[p.id]) ? 'checked' : ''}>
                    </td>
                `).join('');
                
                warehouseRows += `
                    <tr>
                        <td><strong>${wh.ma_kho}</strong><br><small>${wh.ten_kho}</small></td>
                        ${checksHtml}
                    </tr>
                `;
            });
        }

        const formHtml = `
            <form id="userForm">
                <input type="hidden" id="userId" value="${user?.id || ''}">
                <div class="form-group mb-3">
                    <label>Tên đăng nhập <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="u_username" required value="${user?.username || ''}" ${user ? 'readonly disabled' : ''}>
                </div>
                <div class="form-group mb-3">
                    <label>Email</label>
                    <input type="email" class="form-control" id="u_email" value="${user?.email || ''}">
                </div>
                <div class="form-group mb-3">
                    <label>Mật khẩu ${user ? '<small class="text-muted">(Để trống nếu không muốn đổi)</small>' : '<span class="text-danger">*</span>'}</label>
                    <input type="password" class="form-control" id="u_password" ${!user ? 'required' : ''}>
                </div>
                <div class="form-grid mb-3">
                    <div class="form-group">
                        <label>Họ tên</label>
                        <input type="text" class="form-control" id="u_fullname" value="${user?.full_name || ''}">
                    </div>
                    <div class="form-group">
                        <label>Vai trò / Chức vụ</label>
                        <input type="text" class="form-control" id="u_role" value="${user?.role || 'Nhân viên'}">
                    </div>
                </div>
                <div class="form-group mb-3">
                    <label style="display:flex;align-items:center;gap:8px;font-weight:bold;">
                        <input type="checkbox" id="u_is_admin" ${user?.is_admin ? 'checked' : ''} style="width:18px;height:18px"> 
                        Tài khoản này là Quản trị viên (Toàn quyền)
                    </label>
                </div>
                <div class="form-group mb-3" id="permissionsGroup">
                    <label style="margin-bottom:10px;display:block"><strong>Ma trận Phân quyền theo Kho:</strong></label>
                    <div style="overflow-x: auto; background: var(--bg-input); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <table class="data-table" style="margin: 0;">
                            <thead>
                                <tr>
                                    <th>Kho</th>
                                    ${perms.map(p => `<th class="text-center" style="width: 60px;">${p.label}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${warehouseRows}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="form-group mt-3">
                    <label style="display:flex;align-items:center;gap:8px;">
                        <input type="checkbox" id="u_is_active" ${!user || user?.is_active ? 'checked' : ''}> Đang hoạt động
                    </label>
                </div>
            </form>
        `;

        window.modal.show({
            title: user ? 'Sửa Tài Khoản & Phân Quyền' : 'Thêm Tài Khoản',
            content: formHtml,
            width: '1000px',
            buttons: [
                { text: 'Hủy', class: 'btn-ghost text-muted', close: true },
                { text: 'Lưu lại', class: 'btn-primary', onClick: () => this.handleSave() }
            ]
        });

        // Tự động ẩn/hiện bảng phân quyền nếu là admin
        const adminCheck = document.querySelector('#page-users #u_is_admin');
        const permGroup = document.querySelector('#page-users #permissionsGroup');
        const togglePerms = () => {
            permGroup.style.opacity = adminCheck.checked ? '0.5' : '1';
            permGroup.style.pointerEvents = adminCheck.checked ? 'none' : 'auto';
        };
        adminCheck.addEventListener('change', togglePerms);
        togglePerms();
    },

    async handleSave() {
        const form = document.querySelector('#userForm');
        if (!form.reportValidity()) return false;

        const id = document.querySelector('#userId').value;
        const permissionsMap = {};
        document.querySelectorAll('.perm-checkbox').forEach(cb => {
            const khoId = parseInt(cb.dataset.kho);
            const permId = cb.dataset.perm;
            if (!permissionsMap[khoId]) permissionsMap[khoId] = { warehouse_id: khoId };
            permissionsMap[khoId][permId] = cb.checked;
        });

        const permissionsList = Object.values(permissionsMap).filter(p => 
            p.perm_view || p.perm_add || p.perm_edit || p.perm_delete || p.perm_approve || p.perm_print || p.perm_excel
        );

        const data = {
            username: document.querySelector('#u_username').value,
            email: document.querySelector('#u_email').value,
            full_name: document.querySelector('#u_fullname').value,
            role: document.querySelector('#u_role').value,
            is_admin: document.querySelector('#u_is_admin').checked,
            is_active: document.querySelector('#u_is_active').checked,
            permissions: permissionsList
        };

        const pass = document.querySelector('#u_password').value;
        if (pass) data.password = pass;

        try {
            if (id) {
                await api.users.update(id, data);
                window.toast.success('Cập nhật tài khoản thành công');
                if (id == window.Auth.user.id && pass) {
                    window.toast.info('Bạn vừa đổi mật khẩu của chính mình. Vui lòng đăng nhập lại.');
                    setTimeout(() => window.Auth.logout(), 2000);
                }
            } else {
                await api.users.create(data);
                window.toast.success('Thêm tài khoản thành công');
            }
            window.modal.hide();
            this.loadData();
            return true;
        } catch (error) {
            window.toast.error(error.message);
            return false;
        }
    },

    async handleDelete(id) {
        if (!confirm('Bạn có chắc muốn xóa tài khoản này không? Mọi quyền truy cập sẽ bị thu hồi vĩnh viễn.')) return;
        
        try {
            await api.users.delete(id);
            window.toast.success('Đã xóa tài khoản');
            this.loadData();
        } catch (error) {
            window.toast.error(error.message);
        }
    },

    bindEvents() {
        document.querySelector('#page-users #btnCreateUser').addEventListener('click', () => {
            if (!window.Auth.hasPermission('perm_add')) {
                if (window.toast) window.toast.error("Bạn không có quyền thực hiện thao tác này.");
                else alert("Bạn không có quyền thực hiện thao tác này.");
                return;
            }
            this.showModal();
        });
    }
};
