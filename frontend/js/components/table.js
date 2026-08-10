/**
 * Component Bảng dữ liệu có thể tái sử dụng
 */
class DataTable {
    constructor(container, options) {
        this.container = container;
        this.options = {
            columns: [],
            data: [],
            pagination: true,
            totalItems: 0,
            pageSize: 50,
            currentPage: 1,
            onPageChange: null,
            onSort: null,
            rowClass: null, // Function(row) trả về class css cho dòng
            emptyMessage: 'Không có dữ liệu',
            ...options
        };
        this.render();
    }

    render() {
        const tableHtml = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${this.options.columns.map(col => this._renderHeaderCell(col)).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${this._renderBody()}
                    </tbody>
                </table>
                ${this.options.pagination ? this._renderPagination() : ''}
            </div>
        `;
        this.container.innerHTML = tableHtml;
        this._attachEvents();
    }

    _renderHeaderCell(col) {
        const isSortable = col.sortable !== false && col.key;
        const sortIcon = isSortable ? '<i class="fas fa-sort sort-icon"></i>' : '';
        const alignClass = col.align ? `text-${col.align}` : '';
        const width = col.width ? `style="width: ${col.width}"` : '';
        
        return `<th class="${alignClass}" data-key="${col.key}" ${width} ${isSortable ? 'style="cursor:pointer"' : ''}>
                    ${col.title || col.label || ''} ${sortIcon}
                </th>`;
    }

    _renderBody() {
        if (!this.options.data || this.options.data.length === 0) {
            return `<tr><td colspan="${this.options.columns.length}" class="text-center text-muted py-4">
                        <div class="empty-state">
                            <i class="fas fa-box-open mb-2"></i>
                            <p>${this.options.emptyMessage}</p>
                        </div>
                    </td></tr>`;
        }

        return this.options.data.map((row, index) => {
            const trClass = this.options.rowClass ? this.options.rowClass(row) : '';
            return `<tr class="${trClass}" data-index="${index}" ${this.options.onRowClick ? 'style="cursor:pointer;"' : ''}>
                        ${this.options.columns.map(col => {
                            const alignClass = col.align ? `text-${col.align}` : '';
                            const content = col.render ? col.render(row[col.key], row, index) : (row[col.key] || '');
                            return `<td class="${alignClass}">${content}</td>`;
                        }).join('')}
                    </tr>`;
        }).join('');
    }

    _renderPagination() {
        if (this.options.totalItems === 0) return '';
        
        const totalPages = Math.ceil(this.options.totalItems / this.options.pageSize);
        const current = this.options.currentPage;
        
        let pages = [];
        // Simple pagination logic
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (current <= 4) {
                pages = [1, 2, 3, 4, 5, '...', totalPages];
            } else if (current >= totalPages - 3) {
                pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', current - 1, current, current + 1, '...', totalPages];
            }
        }

        const startIdx = (current - 1) * this.options.pageSize + 1;
        const endIdx = Math.min(current * this.options.pageSize, this.options.totalItems);

        return `
            <div class="pagination">
                <div class="pagination-info">
                    Hiển thị <b>${startIdx}</b> - <b>${endIdx}</b> trong tổng số <b>${this.options.totalItems}</b>
                </div>
                <div class="pagination-controls">
                    <button class="page-btn prev-btn" ${current === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
                    ${pages.map(p => {
                        if (p === '...') return `<span class="px-2">...</span>`;
                        return `<button class="page-btn num-btn ${p === current ? 'active' : ''}" data-page="${p}">${p}</button>`;
                    }).join('')}
                    <button class="page-btn next-btn" ${current === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        `;
    }

    _attachEvents() {
        // Sorting
        if (this.options.onSort) {
            this.container.querySelectorAll('th[data-key]').forEach(th => {
                if (th.style.cursor === 'pointer') {
                    th.addEventListener('click', () => {
                        const key = th.dataset.key;
                        const isAsc = !th.classList.contains('sorted') || th.querySelector('.fa-sort-up') == null;
                        
                        // Reset all icons
                        this.container.querySelectorAll('.sort-icon').forEach(icon => {
                            icon.className = 'fas fa-sort sort-icon';
                        });
                        this.container.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
                        
                        // Set active icon
                        th.classList.add('sorted');
                        const icon = th.querySelector('.sort-icon');
                        icon.className = `fas ${isAsc ? 'fa-sort-up' : 'fa-sort-down'} sort-icon`;
                        
                        this.options.onSort(key, isAsc ? 'asc' : 'desc');
                    });
                }
            });
        }

        // Row Click
        if (this.options.onRowClick) {
            this.container.querySelectorAll('tbody tr').forEach(tr => {
                tr.addEventListener('click', (e) => {
                    const idx = tr.dataset.index;
                    if (idx !== undefined && this.options.data[idx]) {
                        this.options.onRowClick(this.options.data[idx], e);
                    }
                });
            });
        }

        // Pagination
        if (this.options.pagination && this.options.onPageChange) {
            const current = this.options.currentPage;
            
            this.container.querySelectorAll('.num-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const p = parseInt(e.target.dataset.page);
                    if (p !== current) this.options.onPageChange(p);
                });
            });

            const prevBtn = this.container.querySelector('.prev-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (current > 1) this.options.onPageChange(current - 1);
                });
            }

            const nextBtn = this.container.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    const totalPages = Math.ceil(this.options.totalItems / this.options.pageSize);
                    if (current < totalPages) this.options.onPageChange(current + 1);
                });
            }
        }
    }

    updateData(data, totalItems) {
        this.options.data = data;
        if (totalItems !== undefined) this.options.totalItems = totalItems;
        this.render();
    }
}
