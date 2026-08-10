/**
 * Trang Tổng quan (Dashboard)
 */
const DashboardPage = {
    chartInstance: null,

    async render(container) {
        utils.showLoading(container.id);
        
        try {
            const data = await api.reports.dashboard();
            
            const html = `
                <!-- KPI Cards -->
                <div class="kpi-grid">
                    <div class="kpi-card blue">
                        <div class="kpi-icon"><i class="fas fa-boxes-stacked"></i></div>
                        <div class="kpi-info">
                            <div class="kpi-label">Tổng mặt hàng</div>
                            <div class="kpi-value">${utils.formatNumber(data.stats.total_items)}</div>
                        </div>
                    </div>
                    <div class="kpi-card green">
                        <div class="kpi-icon"><i class="fas fa-arrow-down"></i></div>
                        <div class="kpi-info">
                            <div class="kpi-label">Nhập trong ngày</div>
                            <div class="kpi-value">${utils.formatNumber(data.stats.total_imports_today)}</div>
                        </div>
                    </div>
                    <div class="kpi-card amber">
                        <div class="kpi-icon"><i class="fas fa-arrow-up"></i></div>
                        <div class="kpi-info">
                            <div class="kpi-label">Xuất trong ngày</div>
                            <div class="kpi-value">${utils.formatNumber(data.stats.total_exports_today)}</div>
                        </div>
                    </div>
                    <div class="kpi-card red" style="cursor: pointer;" onclick="DashboardPage.showLowStockWarning()">
                        <div class="kpi-icon"><i class="fas fa-triangle-exclamation"></i></div>
                        <div class="kpi-info">
                            <div class="kpi-label">Cảnh báo tồn kho</div>
                            <div class="kpi-value">${utils.formatNumber(data.stats.low_stock_count)}</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <!-- Biểu đồ xu hướng -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Xu hướng Nhập/Xuất (6 tháng)</h3>
                        </div>
                        <div>
                            <canvas id="trendChart" height="250"></canvas>
                        </div>
                    </div>

                    <!-- Hoạt động gần đây -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Giao dịch mới nhất</h3>
                        </div>
                        <div class="recent-list">
                            ${data.recent_transactions.length > 0 ? data.recent_transactions.map(t => `
                                <div class="recent-item">
                                    <div class="type-icon ${t.loai.toLowerCase()}">
                                        <i class="fas ${t.loai === 'NHAP' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                                    </div>
                                    <div class="info">
                                        <div class="name" title="${t.ten_hang}">${t.ten_hang}</div>
                                        <div class="meta">
                                            <span class="badge ${t.loai.toLowerCase()}">${t.loai}</span> • 
                                            ${utils.formatDate(t.ngay)} • ${t.nguoi}
                                        </div>
                                    </div>
                                    <div class="qty ${t.loai === 'NHAP' ? 'text-success' : 'text-warning'}">
                                        ${t.loai === 'NHAP' ? '+' : '-'}${utils.formatNumber(t.so_luong)}
                                    </div>
                                </div>
                            `).join('') : '<div class="text-muted text-center py-4">Chưa có giao dịch nào</div>'}
                        </div>
                    </div>
                </div>

                <!-- Mặt hàng dưới định mức -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title text-danger"><i class="fas fa-exclamation-circle"></i> Mặt hàng dưới định mức (${data.low_stock_items.length})</h3>
                        <a href="#inventory" class="btn btn-ghost btn-sm">Xem tất cả</a>
                    </div>
                    <div id="lowStockTable"></div>
                </div>
            `;
            
            container.innerHTML = html;
            
            // Vẽ biểu đồ
            this.renderChart(data.monthly_trends);
            
            // Render bảng cảnh báo
            new DataTable(document.getElementById('lowStockTable'), {
                data: data.low_stock_items.slice(0, 5),
                pagination: false,
                rowClass: (row) => row.ton_cuoi <= 0 ? 'out-of-stock' : 'low-stock',
                columns: [
                    { title: 'Mã QL', key: 'ma_quan_ly', width: '80px' },
                    { title: 'Tên hàng', key: 'ten_hang' },
                    { title: 'Mã số', key: 'ma_so' },
                    { title: 'Vị trí', key: 'vi_tri' },
                    { title: 'Tồn kho', key: 'ton_cuoi', align: 'right', render: (val) => `<b>${utils.formatNumber(val)}</b>` },
                    { title: 'Định mức', key: 'dinh_muc', align: 'right' }
                ]
            });

        } catch (error) {
            container.innerHTML = `<div class="empty-state text-danger"><i class="fas fa-triangle-exclamation"></i><p>Lỗi tải dữ liệu: ${error.message}</p></div>`;
        }
    },

    renderChart(monthlyData) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        Chart.defaults.color = '#8b95a8';
        Chart.defaults.font.family = "'Inter', sans-serif";

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Nhập kho',
                        data: monthlyData.map(d => d.nhap),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderRadius: 4
                    },
                    {
                        label: 'Xuất kho',
                        data: monthlyData.map(d => d.xuat),
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true, boxWidth: 8 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        border: { display: false }
                    }
                }
            }
        });
    },

    destroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    },

    async showLowStockWarning() {
        try {
            // Lấy toàn bộ danh sách sản phẩm cảnh báo (xử lý phân trang vì API giới hạn 200/trang)
            let items = [];
            let page = 1;
            const pageSize = 200;
            while (true) {
                const response = await api.inventory.list({ low_stock: true, page: page, page_size: pageSize });
                const currentItems = response.items || [];
                items = items.concat(currentItems);
                if (currentItems.length < pageSize) break;
                page++;
            }

            let rows = items.map((item, index) => `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.ma_so || ''}</td>
                    <td>${item.ten_hang || ''}</td>
                    <td>${item.vi_tri || ''}</td>
                    <td class="text-right text-danger font-weight-bold">${utils.formatNumber(item.ton_cuoi)}</td>
                    <td class="text-right text-warning">${utils.formatNumber(item.dinh_muc)}</td>
                </tr>
            `).join('');

            if (items.length === 0) {
                rows = '<tr><td colspan="6" class="text-center text-muted" style="padding: 20px;">Không có sản phẩm nào thuộc diện cảnh báo</td></tr>';
            }

            const content = `
                <div class="table-container" style="max-height: 60vh; overflow-y: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                        <thead style="position: sticky; top: 0; background: var(--bg-card); z-index: 1;">
                            <tr>
                                <th class="text-center" style="width: 50px;">STT</th>
                                <th>Mã số</th>
                                <th>Tên hàng</th>
                                <th>Vị trí</th>
                                <th class="text-right">Tồn cuối</th>
                                <th class="text-right">Định mức</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `;

            window.modal.show({
                title: '⚠️ Danh sách sản phẩm Cảnh Báo Tồn Kho',
                content: content,
                width: '1200px',
                buttons: [
                    { text: 'Đóng', class: 'btn-ghost text-muted' },
                    {
                        text: '<i class="fas fa-envelope"></i> Gửi Email',
                        class: 'btn-primary',
                        onClick: async () => {
                            const emailStr = prompt("Nhập danh sách email người nhận (cách nhau bởi dấu phẩy):");
                            if (!emailStr) return;
                            
                            const emails = emailStr.split(',').map(e => e.trim()).filter(e => e);
                            if (emails.length === 0) return;
                            
                            try {
                                const btn = document.querySelector('.btn-primary');
                                const originalText = btn.innerHTML;
                                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
                                btn.disabled = true;
                                
                                const response = await api.reports.sendWarningEmail(emails);
                                if (window.toast) window.toast.success(response.message || 'Gửi email thành công');
                            } catch (err) {
                                if (window.toast) window.toast.error(err.message || 'Lỗi khi gửi email');
                            } finally {
                                window.modal.hide();
                            }
                        }
                    },
                    {
                        text: '<i class="fas fa-file-excel"></i> Xuất Excel',
                        class: 'btn-success',
                        onClick: () => {
                            window.location.href = api.reports.getExcelUrl({ low_stock: true });
                        }
                    }
                ]
            });
        } catch (error) {
            if (window.toast) window.toast.error('Lỗi khi tải danh sách cảnh báo: ' + error.message);
        }
    }
};
