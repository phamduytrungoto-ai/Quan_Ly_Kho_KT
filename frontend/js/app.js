/**
 * Main Application Logic
 * Xử lý routing (chuyển trang), sidebar, và init
 */
const App = {
    pages: {
        'dashboard': DashboardPage,
        'inventory': InventoryPage,
        'history': HistoryPage,
        'categories': CategoriesPage,
        'reports': ReportsPage,
        'receipts': ReceiptsPage,
        'issues': IssuesPage,
        'users': UsersPage,
        'warehouses': WarehousesPage,
        'transfers': TransfersPage
    },
    
    currentPage: null,

    init() {
        // Kiểm tra đăng nhập
        if (!window.Auth || !window.Auth.isAuthenticated()) {
            document.getElementById('loginContainer').style.display = 'flex';
            document.getElementById('appContainer').style.display = 'none';
            this.initLoginForm();
            return;
        }

        // Đã đăng nhập
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Hiển thị thông tin user
        document.getElementById('currentUserName').textContent = window.Auth.user.full_name || window.Auth.user.username;
        document.getElementById('currentUserRole').textContent = window.Auth.user.role;

        // Xử lý ẩn hiện theo phân quyền
        document.body.className = '';
        if (!window.Auth.hasPermission('perm_add')) document.body.classList.add('no-perm-add');
        if (!window.Auth.hasPermission('perm_edit')) document.body.classList.add('no-perm-edit');
        if (!window.Auth.hasPermission('perm_delete')) document.body.classList.add('no-perm-delete');
        if (!window.Auth.hasPermission('perm_excel')) document.body.classList.add('no-perm-excel');
        if (!window.Auth.hasPermission('perm_view')) document.body.classList.add('no-perm-view');
        
        // Ẩn hiện menu theo phân quyền
        if (window.Auth.user.is_admin) {
            document.getElementById('nav-users').style.display = 'flex';
            document.getElementById('nav-warehouses').style.display = 'flex';
            document.getElementById('btnSettings').style.display = 'flex';
            
            // Xử lý nút Cài đặt
            document.getElementById('btnSettings').addEventListener('click', async () => {
                try {
                    const [warehouses, settingsArr] = await Promise.all([
                        api.fetchJSON('/warehouses'),
                        api.fetchJSON('/settings')
                    ]);
                    
                    const settings = {};
                    settingsArr.forEach(s => settings[s.key] = s.value);
                    
                    let content = `
                        <div class="settings-container">
                            <div class="settings-tabs" style="display: flex; gap: 10px; border-bottom: 1px solid var(--border-color); margin-bottom: 20px; padding-bottom: 10px;">
                                <button class="btn btn-primary settings-tab-btn" data-target="tab-system" style="padding: 8px 15px;"><i class="fas fa-sync-alt"></i> Cập nhật</button>
                                <button class="btn btn-ghost text-muted settings-tab-btn" data-target="tab-email" style="padding: 8px 15px;"><i class="fas fa-envelope"></i> SMTP Server</button>
                                <button class="btn btn-ghost text-muted settings-tab-btn" data-target="tab-warehouse" style="padding: 8px 15px;"><i class="fas fa-warehouse"></i> Cảnh báo Kho</button>
                            </div>
                            <div class="settings-content" style="max-height: 55vh; overflow-y: auto; padding-right: 5px;">
                    `;
                    
                    // Add System Update Section (Tab 1)
                    content += `
                        <div id="tab-system" class="settings-tab-pane">
                            <div class="card mb-4" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                                <h4 style="margin-top: 0; margin-bottom: 15px; color: var(--primary-color);">Cập nhật Hệ thống</h4>
                                <p class="text-muted mb-3" style="font-size: 0.9em;">Cập nhật phiên bản từ Github. Sau khi cập nhật thành công, bạn cần khởi động lại server từ khay hệ thống.</p>
                                
                                <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 12px;">
                                    <div style="flex: 1; min-width: 200px;">
                                        <label class="form-label" style="margin-bottom: 5px; font-size: 0.85em;">Chọn phiên bản:</label>
                                        <select id="selectVersion" class="form-control" style="width: 100%;">
                                            <option value="main">🔄 Mới nhất (nhánh main)</option>
                                        </select>
                                    </div>
                                    <button id="btnCheckVersions" class="btn btn-ghost text-info" style="padding: 8px 14px; white-space: nowrap;">
                                        <i class="fas fa-search"></i> Kiểm tra phiên bản
                                    </button>
                                    <button id="btnUpdateSystem" class="btn btn-primary" style="padding: 8px 14px; white-space: nowrap;">
                                        <i class="fas fa-cloud-download-alt"></i> Cập nhật
                                    </button>
                                </div>
                                <div id="versionDescription" class="text-muted" style="font-size: 0.85em; margin-bottom: 10px; display: none;"></div>
                                <div id="updateResult" style="padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px; display: none; white-space: pre-wrap; font-family: monospace; font-size: 0.85em; max-height: 150px; overflow-y: auto;"></div>
                            </div>
                        </div>
                    `;
                    
                    // Add SMTP Settings Section (Tab 2)
                    content += `
                        <div id="tab-email" class="settings-tab-pane" style="display: none;">
                            <div class="card mb-4" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                                <h4 style="margin-top: 0; margin-bottom: 15px; color: var(--primary-color);">Cấu hình Máy chủ Gửi Email (SMTP)</h4>
                                <p class="text-muted mb-3" style="font-size: 0.9em;">Cấu hình ưu tiên lấy từ giao diện này. Nếu để trống sẽ sử dụng cấu hình mặc định trong file .env.</p>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                    <!-- Primary -->
                                    <div>
                                        <h5 style="margin: 0 0 10px 0; color: #fff;">1. Máy chủ Nội bộ (Mạng LAN)</h5>
                                        <div class="form-group mb-2">
                                            <label class="form-label">SMTP_HOST</label>
                                            <input type="text" id="sys_SMTP_HOST" class="form-control" value="${settings.SMTP_HOST || ''}" placeholder="vd: 192.168.1.100">
                                        </div>
                                        <div class="form-group mb-2">
                                            <label class="form-label">SMTP_PORT</label>
                                            <input type="number" id="sys_SMTP_PORT" class="form-control" value="${settings.SMTP_PORT || ''}" placeholder="587">
                                        </div>
                                        <div class="form-group mb-2">
                                            <label class="form-label">SMTP_USER (Tùy chọn)</label>
                                            <input type="text" id="sys_SMTP_USER" class="form-control" value="${settings.SMTP_USER || ''}">
                                        </div>
                                        <div class="form-group mb-2">
                                            <label class="form-label">SMTP_PASSWORD (Tùy chọn)</label>
                                            <input type="password" id="sys_SMTP_PASSWORD" class="form-control" value="${settings.SMTP_PASSWORD || ''}">
                                        </div>
                                    </div>
                                    
                                    <!-- Fallback -->
                                    <div>
                                        <h5 style="margin: 0 0 10px 0; color: #fff;">2. Dự phòng (Mạng ngoài/Gmail)</h5>
                                        <div class="form-group mb-2">
                                            <label class="form-label">SMTP_FALLBACK_HOST</label>
                                            <input type="text" id="sys_SMTP_FALLBACK_HOST" class="form-control" value="${settings.SMTP_FALLBACK_HOST || ''}" placeholder="vd: smtp.gmail.com">
                                        </div>
                                        <div class="form-group mb-2">
                                            <label class="form-label">SMTP_FALLBACK_PORT</label>
                                            <input type="number" id="sys_SMTP_FALLBACK_PORT" class="form-control" value="${settings.SMTP_FALLBACK_PORT || ''}" placeholder="465">
                                        </div>
                                        <div class="form-group mb-2">
                                            <label class="form-label">SMTP_FALLBACK_USER</label>
                                            <input type="text" id="sys_SMTP_FALLBACK_USER" class="form-control" value="${settings.SMTP_FALLBACK_USER || ''}">
                                        </div>
                                        <div class="form-group mb-2">
                                            <label class="form-label">SMTP_FALLBACK_PASSWORD</label>
                                            <input type="password" id="sys_SMTP_FALLBACK_PASSWORD" class="form-control" value="${settings.SMTP_FALLBACK_PASSWORD || ''}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Add Warehouse Settings Section (Tab 3)
                    content += `
                        <div id="tab-warehouse" class="settings-tab-pane" style="display: none;">
                            <p class="text-muted mb-3"><i class="fas fa-info-circle"></i> Cài đặt tự động gửi email cảnh báo hàng dưới định mức cho từng kho.</p>
                    `;
                    
                    warehouses.forEach(wh => {
                        const isEnabled = wh.email_enabled;
                        const scheduleTime = wh.email_schedule_time || '08:00';
                        const recipients = wh.email_recipients || '';
                        
                        content += `
                            <div class="card mb-3" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                                <h4 style="margin-top: 0; margin-bottom: 15px; color: var(--primary-color); border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">Kho: ${wh.ten_kho}</h4>
                                <div class="form-group mb-3">
                                    <label class="form-label" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                        <input type="checkbox" id="settingEnabled_${wh.id}" ${isEnabled ? 'checked' : ''}>
                                        Bật tự động gửi email cảnh báo hàng ngày
                                    </label>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">Giờ gửi (HH:MM)</label>
                                    <input type="time" id="settingTime_${wh.id}" class="form-control" value="${scheduleTime}">
                                </div>
                                <div class="form-group mb-0">
                                    <label class="form-label">Email người nhận (Cách nhau bằng dấu phẩy)</label>
                                    <textarea id="settingEmails_${wh.id}" class="form-control" rows="2" placeholder="vd: admin@abc.com, manager@abc.com">${recipients}</textarea>
                                </div>
                            </div>
                        `;
                    });
                    content += `</div></div></div>`;
                    
                    window.modal.show({
                        title: 'Cài đặt hệ thống',
                        content: content,
                        width: '800px',
                        onShow: (modalBody) => {
                            // Xử lý chuyển tab
                            const tabBtns = modalBody.querySelectorAll('.settings-tab-btn');
                            const tabPanes = modalBody.querySelectorAll('.settings-tab-pane');
                            
                            tabBtns.forEach(btn => {
                                btn.addEventListener('click', () => {
                                    tabBtns.forEach(b => {
                                        b.classList.remove('btn-primary');
                                        b.classList.add('btn-ghost', 'text-muted');
                                    });
                                    tabPanes.forEach(p => p.style.display = 'none');
                                    
                                    btn.classList.remove('btn-ghost', 'text-muted');
                                    btn.classList.add('btn-primary');
                                    
                                    const targetId = btn.getAttribute('data-target');
                                    const targetPane = modalBody.querySelector('#' + targetId);
                                    if(targetPane) targetPane.style.display = 'block';
                                });
                            });
                            
                            // Xử lý kiểm tra phiên bản
                            const btnCheckVersions = modalBody.querySelector('#btnCheckVersions');
                            const selectVersion = modalBody.querySelector('#selectVersion');
                            const versionDesc = modalBody.querySelector('#versionDescription');
                            let versionsData = [];
                            
                            if (btnCheckVersions) {
                                btnCheckVersions.addEventListener('click', async () => {
                                    btnCheckVersions.disabled = true;
                                    btnCheckVersions.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang kiểm tra...';
                                    try {
                                        const res = await api.fetchJSON('/settings/releases');
                                        versionsData = res.versions || [];
                                        selectVersion.innerHTML = '';
                                        versionsData.forEach(v => {
                                            const opt = document.createElement('option');
                                            opt.value = v.tag;
                                            opt.textContent = v.date ? `${v.name} (${v.date})` : v.name;
                                            selectVersion.appendChild(opt);
                                        });
                                        if (versionsData.length > 1) {
                                            if (window.toast) window.toast.success(`Tìm thấy ${versionsData.length - 1} phiên bản`);
                                        } else {
                                            if (window.toast) window.toast.info('Chưa có phiên bản nào được tạo. Chỉ có nhánh main.');
                                        }
                                        // Hiển thị mô tả phiên bản đầu tiên
                                        if (versionsData.length > 0 && versionsData[0].description) {
                                            versionDesc.style.display = 'block';
                                            versionDesc.textContent = versionsData[0].description;
                                        }
                                    } catch (err) {
                                        if (window.toast) window.toast.error('Không thể kiểm tra phiên bản: ' + err.message);
                                    } finally {
                                        btnCheckVersions.disabled = false;
                                        btnCheckVersions.innerHTML = '<i class="fas fa-search"></i> Kiểm tra phiên bản';
                                    }
                                });
                            }
                            
                            // Hiển thị mô tả khi chọn phiên bản khác
                            if (selectVersion) {
                                selectVersion.addEventListener('change', () => {
                                    const selected = versionsData.find(v => v.tag === selectVersion.value);
                                    if (selected && selected.description) {
                                        versionDesc.style.display = 'block';
                                        versionDesc.textContent = selected.description;
                                    } else {
                                        versionDesc.style.display = 'none';
                                    }
                                });
                            }

                            // Xử lý cập nhật
                            const btnUpdate = modalBody.querySelector('#btnUpdateSystem');
                            if (btnUpdate) {
                                btnUpdate.addEventListener('click', async () => {
                                    const selectedVersion = selectVersion.value;
                                    const resultDiv = modalBody.querySelector('#updateResult');
                                    btnUpdate.disabled = true;
                                    btnUpdate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật...';
                                    resultDiv.style.display = 'block';
                                    resultDiv.innerHTML = `Đang tải phiên bản "${selectedVersion}" từ Github...`;
                                    resultDiv.style.color = 'var(--text-main)';
                                    
                                    try {
                                        const res = await api.fetchJSON(`/settings/update_system?version=${encodeURIComponent(selectedVersion)}`, { method: 'POST' });
                                        resultDiv.innerHTML = res.message + '\n\nOutput:\n' + (res.output || '');
                                        resultDiv.style.color = '#10b981';
                                        if (window.toast) window.toast.success('Cập nhật thành công! Hãy khởi động lại server.');
                                    } catch (err) {
                                        resultDiv.innerHTML = 'Lỗi cập nhật:\n' + err.message;
                                        resultDiv.style.color = '#ef4444';
                                        if (window.toast) window.toast.error('Cập nhật thất bại: ' + err.message);
                                    } finally {
                                        btnUpdate.disabled = false;
                                        btnUpdate.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Cập nhật';
                                    }
                                });
                            }
                        },
                        buttons: [
                            { text: 'Hủy', class: 'btn-ghost text-muted' },
                            {
                                text: 'Lưu cài đặt', class: 'btn-primary',
                                onClick: async () => {
                                    try {
                                        const btn = document.querySelector('.modal .btn-primary');
                                        btn.disabled = true;
                                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
                                        
                                        // Save System Settings (SMTP)
                                        const sysKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FALLBACK_HOST', 'SMTP_FALLBACK_PORT', 'SMTP_FALLBACK_USER', 'SMTP_FALLBACK_PASSWORD'];
                                        for (const key of sysKeys) {
                                            const val = document.getElementById(`sys_${key}`).value;
                                            await api.fetchJSON(`/settings/${key}`, {
                                                method: 'PUT',
                                                body: JSON.stringify({ value: val })
                                            });
                                        }
                                        
                                        // Save each warehouse settings
                                        for (const wh of warehouses) {
                                            const enabled = document.getElementById(`settingEnabled_${wh.id}`).checked;
                                            const time = document.getElementById(`settingTime_${wh.id}`).value || '08:00';
                                            const rawEmails = document.getElementById(`settingEmails_${wh.id}`).value || '';
                                            const emails = rawEmails.replace(/[\n\r]+/g, ',').split(',').map(e => e.trim()).filter(e => e).join(', ');
                                            
                                            // Call API to update warehouse
                                            await api.fetchJSON(`/warehouses/${wh.id}`, {
                                                method: 'PUT',
                                                body: JSON.stringify({
                                                    email_enabled: enabled,
                                                    email_schedule_time: time,
                                                    email_recipients: emails
                                                })
                                            });
                                        }
                                        
                                        if (window.toast) window.toast.success('Lưu cài đặt thành công');
                                        window.modal.hide();
                                    } catch (err) {
                                        if (window.toast) window.toast.error('Lỗi khi lưu cài đặt: ' + err.message);
                                        const btn = document.querySelector('.modal .btn-primary');
                                        btn.disabled = false;
                                        btn.innerHTML = 'Lưu cài đặt';
                                    }
                                }
                            }
                        ]
                    });
                } catch (error) {
                    if (window.toast) window.toast.error('Lỗi khi tải cài đặt: ' + error.message);
                }
            });
        }

        // Đổi mật khẩu
        window.openModal = function(id) {
            const el = document.getElementById(id);
            if (el) el.classList.add('show');
        };
        window.closeModal = function(id) {
            const el = document.getElementById(id);
            if (el) el.classList.remove('show');
        };

        const btnChangePassword = document.getElementById('btnChangePassword');
        if (btnChangePassword) {
            btnChangePassword.addEventListener('click', () => {
                const form = document.getElementById('changePasswordForm');
                if (form) form.reset();
                window.openModal('changePasswordModal');
            });
        }
        
        // Xử lý form đổi mật khẩu
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(changePasswordForm);
                const old_password = formData.get('old_password');
                const new_password = formData.get('new_password');
                const confirm_password = formData.get('confirm_password');
                
                if (new_password !== confirm_password) {
                    if (window.toast) window.toast.error("Mật khẩu xác nhận không khớp!");
                    else alert("Mật khẩu xác nhận không khớp!");
                    return;
                }
                
                const btnSave = document.getElementById('btnSaveChangePassword');
                const originalText = btnSave.innerHTML;
                btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
                btnSave.disabled = true;
                
                try {
                    const res = await api.auth.changePassword({ old_password, new_password });
                    if (window.toast) window.toast.success(res.message);
                    window.closeModal('changePasswordModal');
                    setTimeout(() => {
                        window.Auth.logout();
                    }, 1500);
                } catch (error) {
                    if (window.toast) window.toast.error(error.message);
                    else alert(error.message);
                } finally {
                    btnSave.innerHTML = originalText;
                    btnSave.disabled = false;
                }
            });
        }

        // Đăng xuất
        document.getElementById('btnLogout').addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                window.Auth.logout();
            }
        });
        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', () => {
            const d = document.getElementById('userMenuDropdown');
            if (d && d.style.display === 'flex') {
                d.style.display = 'none';
            }
        });

        this.initSidebar();
        this.initTheme();
        this.initTime();
        this.initWarehouseSelector();
        this.startStatusCheck();
        
        // Load trang mặc định (từ URL hash hoặc dashboard)
        const hash = window.location.hash.substring(1) || 'dashboard';
        this.navigate(hash);

        // Lắng nghe sự kiện back/forward
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1) || 'dashboard';
            this.navigate(hash);
        });
    },

    async initWarehouseSelector() {
        const selector = document.getElementById('warehouseSelector');
        if (!selector) return;
        
        try {
            // Load warehouses from API
            const warehouses = await api.fetchJSON('/warehouses');
            
            // Check allowed
            let allowed = [];
            if (window.Auth.user.is_admin || window.Auth.user.allowed_kho_ids === '*') {
                allowed = warehouses;
            } else {
                const ids = (window.Auth.user.allowed_kho_ids || '1').split(',').map(x => parseInt(x.trim()));
                allowed = warehouses.filter(w => ids.includes(w.id));
            }
            
            if (allowed.length > 0) {
                selector.style.display = 'block';
                selector.innerHTML = '';
                allowed.forEach(w => {
                    const opt = document.createElement('option');
                    opt.value = w.id;
                    opt.textContent = w.ten_kho;
                    selector.appendChild(opt);
                });
                
                // Get active
                let activeId = localStorage.getItem('active_kho_id');
                if (!activeId || !allowed.find(w => w.id == activeId)) {
                    activeId = allowed[0].id;
                    localStorage.setItem('active_kho_id', activeId);
                }
                selector.value = activeId;
                
                selector.addEventListener('change', (e) => {
                    localStorage.setItem('active_kho_id', e.target.value);
                    // Reload current page
                    const hash = window.location.hash.substring(1) || 'dashboard';
                    this.navigate(hash, true); // force re-render
                });
            }
        } catch(e) {
            console.error("Error loading warehouses", e);
        }
    },

    initTheme() {
        const savedTheme = localStorage.getItem('wms_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('wms_theme', next);
            });
        }
    },

    initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebarToggle');
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const navItems = document.querySelectorAll('.nav-item');

        // Toggle (Desktop)
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });

        // Toggle (Mobile)
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });

        // Click ngoài để đóng sidebar (Mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && 
                sidebar.classList.contains('mobile-open') && 
                !sidebar.contains(e.target) && 
                e.target !== mobileBtn &&
                !mobileBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        });

        const btnUserGuide = document.getElementById('btnUserGuide');
        if (btnUserGuide) {
            btnUserGuide.href = API_BASE_URL.replace('/api', '/guide');
            btnUserGuide.target = '_blank';
            btnUserGuide.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    document.getElementById('sidebar').classList.remove('mobile-open');
                }
            });
        }

        // Click menu item
        navItems.forEach(item => {
            if (item.id === 'btnUserGuide') return; // let browser handle it natively

            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    window.location.hash = page;
                }
                
                if (window.innerWidth <= 1024) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        });
    },

    initTime() {
        const timeEl = document.getElementById('currentTime');
        const updateTime = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            timeEl.innerHTML = `<span>${timeStr}</span> <span class="text-muted">| ${dateStr}</span>`;
        };
        updateTime();
        setInterval(updateTime, 60000); // Cập nhật mỗi phút
    },

    async startStatusCheck() {
        const dot = document.querySelector('.status-dot');
        const text = document.querySelector('.server-status span:last-child');
        if(!dot || !text) return;
        const check = async () => {
            const isOk = await api.checkStatus();
            if (isOk) {
                dot.className = 'status-dot connected';
                text.textContent = 'Đã kết nối';
            } else {
                dot.className = 'status-dot error';
                text.textContent = 'Mất kết nối server';
            }
        };

        check();
        setInterval(check, 30000); // Check mỗi 30s
    },

    async navigate(pageName, force = false) {
        // Kiểm tra quyền truy cập trang Users
        if (pageName === 'users' && !window.Auth.user.is_admin) {
            window.toast.error('Bạn không có quyền truy cập trang này');
            return this.navigate('dashboard');
        }

        // Kích hoạt nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
                document.getElementById('pageTitle').textContent = item.querySelector('span').textContent;
            }
        });

        // Ẩn tất cả các trang
        document.querySelectorAll('.page-content').forEach(el => {
            el.style.display = 'none';
        });

        const contentArea = document.getElementById('contentArea');
        const pageContainerId = `page-${pageName}`;
        let pageContainer = document.getElementById(pageContainerId);

        let isNewContainer = pageContainer ? pageContainer.innerHTML.trim() === '' : false;
        
        if (force) {
            isNewContainer = true;
            if (pageContainer) {
                pageContainer.innerHTML = '';
            }
        }

        if (!pageContainer && !['history', 'receipts', 'issues', 'categories', 'users'].includes(pageName)) {
            contentArea.innerHTML = '<div class="loading-screen"><div class="spinner"></div><p>Đang tải dữ liệu...</p></div>';
            contentArea.style.display = 'block';
        } else {
            contentArea.style.display = 'none';
            if (!pageContainer) {
                pageContainer = document.createElement('div');
                pageContainer.id = pageContainerId;
                pageContainer.className = 'page-content';
                document.getElementById('mainContent').insertBefore(pageContainer, document.getElementById('contentArea'));
                isNewContainer = true;
            }
            if (isNewContainer) {
                pageContainer.innerHTML = '<div class="loading-screen"><div class="spinner"></div><p>Đang tải dữ liệu...</p></div>';
            }
            pageContainer.style.display = 'block';
        }

        try {
            const Page = this.pages[pageName];
            if (Page) {
                if (['history', 'receipts', 'issues', 'categories', 'users'].includes(pageName)) {
                    if (isNewContainer) {
                        await Page.render(pageContainer);
                    } else {
                        if (typeof Page.onActivate === 'function') {
                            Page.onActivate();
                        } else if (typeof Page.loadData === 'function') {
                            Page.loadData();
                        }
                    }
                } else {
                    await Page.render(contentArea);
                }
                this.currentPage = Page;
            } else {
                contentArea.innerHTML = '<div class="p-4"><h3 class="text-danger">Không tìm thấy trang</h3></div>';
                contentArea.style.display = 'block';
            }
        } catch (error) {
            console.error('Error rendering page:', error);
            const target = ['history', 'receipts', 'issues', 'categories', 'users'].includes(pageName) ? pageContainer : contentArea;
            target.innerHTML = `<div class="p-4"><h3 class="text-danger">Lỗi tải trang</h3><p>${error.message}</p></div>`;
        }
    },

    initLoginForm() {
        const form = document.getElementById('loginForm');
        const btn = document.getElementById('btnLogin');
        if (!form) return;

        // Toggle hiển thị mật khẩu
        const toggleBtn = document.getElementById('togglePassword');
        const passInput = document.getElementById('loginPassword');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = passInput.type === 'password';
                passInput.type = isPassword ? 'text' : 'password';
                toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            });
        }

        // Login page theme toggle
        const loginThemeToggle = document.getElementById('loginThemeToggle');
        if (loginThemeToggle) {
            loginThemeToggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('wms_theme', next);
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('loginUsername').value;
            const pass = document.getElementById('loginPassword').value;
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Đang xử lý...</span>';
            try {
                await window.Auth.login(user, pass);
                window.location.reload();
            } catch (err) {
                window.toast.error(err.message);
                btn.disabled = false;
                btn.innerHTML = '<span>Đăng nhập</span> <i class="fas fa-arrow-right"></i>';
            }
        });

        // Xử lý quên mật khẩu
        const forgotLink = document.getElementById('forgotPasswordLink');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.modal.show({
                    title: 'Khôi phục mật khẩu',
                    content: `
                        <div class="form-group mb-3">
                            <label class="form-label">Tên đăng nhập hoặc Email</label>
                            <input type="text" id="forgotUsername" class="form-control" placeholder="Nhập tên đăng nhập hoặc email">
                        </div>
                    `,
                    buttons: [
                        { text: 'Hủy', class: 'btn-ghost text-muted' },
                        { 
                            text: 'Nhận mã OTP', class: 'btn-primary', 
                            onClick: async () => {
                                const username = document.getElementById('forgotUsername').value;
                                if (!username) return window.toast.error('Vui lòng nhập tên đăng nhập hoặc email');
                                
                                const submitBtn = document.querySelector('.modal .btn-primary');
                                submitBtn.disabled = true;
                                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
                                
                                try {
                                    const res = await api.auth.forgotPassword(username);
                                    window.toast.success(res.message);
                                    
                                    // Chuyển sang form nhập OTP
                                    window.modal.show({
                                        title: 'Nhập mã xác thực',
                                        content: `
                                            <p class="text-muted mb-3">Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và nhập vào bên dưới.</p>
                                            <div class="form-group mb-3">
                                                <label class="form-label">Tên đăng nhập / Email</label>
                                                <input type="text" id="resetUsername" class="form-control" value="${username}" disabled>
                                            </div>
                                            <div class="form-group mb-3">
                                                <label class="form-label">Mã OTP (6 số)</label>
                                                <input type="text" id="resetOtp" class="form-control" placeholder="Nhập 6 số OTP" maxlength="6">
                                            </div>
                                            <div class="form-group mb-3">
                                                <label class="form-label">Mật khẩu mới</label>
                                                <input type="password" id="resetNewPass" class="form-control" placeholder="Nhập mật khẩu mới">
                                            </div>
                                        `,
                                        buttons: [
                                            { text: 'Hủy', class: 'btn-ghost text-muted' },
                                            { 
                                                text: 'Xác nhận đổi mật khẩu', class: 'btn-primary', 
                                                onClick: async () => {
                                                    const otp = document.getElementById('resetOtp').value;
                                                    const newPass = document.getElementById('resetNewPass').value;
                                                    if (!otp || !newPass) return window.toast.error('Vui lòng nhập đủ thông tin');
                                                    
                                                    const btn2 = document.querySelector('.modal .btn-primary');
                                                    btn2.disabled = true;
                                                    btn2.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
                                                    
                                                    try {
                                                        const res2 = await api.auth.resetPassword(username, otp, newPass);
                                                        window.toast.success(res2.message);
                                                        window.modal.hide();
                                                    } catch (err2) {
                                                        window.toast.error(err2.message);
                                                        btn2.disabled = false;
                                                        btn2.innerHTML = 'Xác nhận đổi mật khẩu';
                                                    }
                                                }
                                            }
                                        ]
                                    });
                                } catch (err) {
                                    window.toast.error(err.message);
                                    submitBtn.disabled = false;
                                    submitBtn.innerHTML = 'Nhận mã OTP';
                                }
                            }
                        }
                    ]
                });
            });
        }
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => App.init(), 100);
});
