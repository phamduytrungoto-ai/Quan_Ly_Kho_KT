/**
 * Trang Lịch sử thao tác hệ thống (Action Logs)
 */
const ActionLogsPage = {
    table: null,
    params: { page: 1, page_size: 50 },

    async render(container) {
        const html = `
            <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 1.8rem; font-weight: bold; margin: 0; color: var(--text-heading);">LỊCH SỬ THAO TÁC HỆ THỐNG</h2>
            </div>

            <div class="card">
                <div class="toolbar" style="display: flex; flex-wrap: wrap; align-items: center; gap: 15px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
                    <div class="search-box" style="max-width: 300px; min-width: 225px; flex-grow: 1; position: relative;">
                        <i class="fas fa-search"></i>
                        <input type="text" class="form-control" id="searchLogs" placeholder="Tìm kiếm người dùng, hành động...">
                        <i class="fas fa-times clear-search" id="clearSearchLogs"></i>
                    </div>
                    <div class="filter-group" style="display: flex; align-items: center; gap: 10px;">
                        <label style="font-weight: bold; margin: 0; color: var(--text-primary); white-space: nowrap;">Từ Ngày</label>
                        <input type="date" class="form-control" id="fromDateLogs" style="width: 140px;">
                    </div>
                    <div class="filter-group" style="display: flex; align-items: center; gap: 10px;">
                        <label style="font-weight: bold; margin: 0; color: var(--text-primary); white-space: nowrap;">Đến ngày</label>
                        <input type="date" class="form-control" id="toDateLogs" style="width: 140px;">
                    </div>
                    <button class="btn btn-ghost" id="btnFilterLogs" title="Lọc dữ liệu"><i class="fas fa-search"></i></button>
                </div>
                
                <div id="logsTable"></div>
            </div>
        `;
        
        container.innerHTML = html;
        this.initTable();
        this.attachEvents();
        this.loadData();
    },

    initTable() {
        this.table = new DataTable(document.getElementById('logsTable'), {
            pageSize: 50,
            onPageChange: (page) => {
                this.params.page = page;
                this.loadData();
            },
            columns: [
                { 
                    title: 'THỜI GIAN', key: 'created_at', width: '160px',
                    render: (val) => `<span style="color: var(--text-muted); font-size: 0.9em;">${val || '---'}</span>`
                },
                { 
                    title: 'NGƯỜI DÙNG', key: 'username', width: '140px',
                    render: (val) => `<strong>${val || '---'}</strong>`
                },
                { 
                    title: 'ĐỊA CHỈ IP', key: 'ip_address', width: '130px',
                    render: (val) => `<span style="font-family: monospace; font-size: 0.9em;">${val || '---'}</span>`
                },
                { 
                    title: 'HÀNH ĐỘNG', key: 'action', width: '200px',
                    render: (val) => {
                        let color = 'var(--primary)';
                        if (val && (val.includes('Xóa') || val.includes('xóa'))) color = 'var(--danger)';
                        else if (val && (val.includes('Tạo') || val.includes('tạo') || val.includes('Nhập'))) color = 'var(--success)';
                        else if (val && (val.includes('Sửa') || val.includes('sửa') || val.includes('Cập nhật'))) color = 'var(--warning)';
                        else if (val && (val.includes('Đăng nhập') || val.includes('Đăng xuất'))) color = 'var(--info)';
                        return `<span style="color: ${color}; font-weight: 600;"><i class="fas fa-circle" style="font-size: 6px; vertical-align: middle; margin-right: 6px;"></i>${val || '---'}</span>`;
                    }
                },
                { 
                    title: 'CHI TIẾT', key: 'details',
                    render: (val) => `<span style="color: var(--text-secondary); font-size: 0.9em;">${val || ''}</span>`
                }
            ]
        });
    },

    attachEvents() {
        const searchInput = document.getElementById('searchLogs');
        const clearBtn = document.getElementById('clearSearchLogs');
        const fromDate = document.getElementById('fromDateLogs');
        const toDate = document.getElementById('toDateLogs');
        const filterBtn = document.getElementById('btnFilterLogs');

        let timeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const val = e.target.value;
            clearBtn.style.display = val ? 'block' : 'none';
            timeout = setTimeout(() => {
                this.params.search = val;
                this.params.page = 1;
                this.loadData();
            }, 500);
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            this.params.search = '';
            this.params.page = 1;
            this.loadData();
        });

        filterBtn.addEventListener('click', () => {
            this.params.from_date = fromDate.value || null;
            this.params.to_date = toDate.value || null;
            this.params.page = 1;
            this.loadData();
        });
    },

    async loadData() {
        try {
            let queryParams = new URLSearchParams({
                page: this.params.page,
                page_size: this.params.page_size
            });

            if (this.params.search) queryParams.append('search', this.params.search);
            if (this.params.from_date) queryParams.append('from_date', this.params.from_date);
            if (this.params.to_date) queryParams.append('to_date', this.params.to_date);

            const res = await api.fetchJSON('/logs?' + queryParams.toString());
            
            this.table.options.currentPage = res.page;
            this.table.updateData(res.logs, res.total);
        } catch (error) {
            console.error("Lỗi khi tải lịch sử thao tác:", error);
            if (window.toast) window.toast.error('Không thể tải lịch sử thao tác');
        }
    }
};
