/**
 * Giao diện Modal Box
 */
const ModalSystem = {
    init() {
        this.overlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.title = document.getElementById('modalTitle');
        this.body = document.getElementById('modalBody');
        this.footer = document.getElementById('modalFooter');
        
        // Đóng khi click nút X
        document.getElementById('modalClose').addEventListener('click', () => this.hide());
        
        // Phóng to/thu nhỏ khi click nút Maximize
        document.getElementById('modalMaximize').addEventListener('click', () => {
            const icon = document.querySelector('#modalMaximize i');
            if (this.modal.classList.contains('maximized')) {
                this.modal.classList.remove('maximized');
                icon.className = 'fas fa-expand';
                // Reset styles
                this.modal.style.width = '';
                this.modal.style.height = '';
                this.modal.style.maxWidth = this._lastMaxWidth || '640px';
                this.modal.style.maxHeight = '';
                this.modal.style.margin = '';
                this.modal.style.borderRadius = '';
                this.modal.style.display = '';
                this.modal.style.flexDirection = '';
                this.overlay.style.padding = '';
                if (this.body) this.body.style.flex = '';
            } else {
                this.modal.classList.add('maximized');
                icon.className = 'fas fa-compress';
                // Save current width
                this._lastMaxWidth = this.modal.style.maxWidth;
                // Force max styles
                this.modal.style.width = '100%';
                this.modal.style.height = '100%';
                this.modal.style.maxWidth = '100vw';
                this.modal.style.maxHeight = '100vh';
                this.modal.style.margin = '0';
                this.modal.style.borderRadius = '0';
                this.modal.style.display = 'flex';
                this.modal.style.flexDirection = 'column';
                this.overlay.style.padding = '0';
                if (this.body) this.body.style.flex = '1';
            }
        });
        
        // Đóng khi click ra ngoài overlay (Tạm thời vô hiệu hóa theo yêu cầu)
        this.overlay.addEventListener('click', (e) => {
            // if (e.target === this.overlay) this.hide();
        });
        
        // Thoát bằng phím Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('show')) {
                this.hide();
            }
        });

        // Gắn vào window để gọi từ mọi nơi
        window.modal = this;
    },

    show(options) {
        // Reset maximized state
        this.modal.classList.remove('maximized');
        const maximizeIcon = document.querySelector('#modalMaximize i');
        if(maximizeIcon) maximizeIcon.className = 'fas fa-expand';

        this.title.textContent = options.title || 'Thông báo';
        
        // Set body
        if (typeof options.content === 'string') {
            this.body.innerHTML = options.content;
        } else if (options.content instanceof HTMLElement) {
            this.body.innerHTML = '';
            this.body.appendChild(options.content);
        }

        // Set width nếu có
        if (options.width) {
            this.modal.style.maxWidth = options.width;
        } else {
            this.modal.style.maxWidth = '640px';
        }

        // Tạo nút footer
        this.footer.innerHTML = '';
        if (options.buttons && options.buttons.length > 0) {
            options.buttons.forEach(btnInfo => {
                const btn = document.createElement('button');
                btn.className = `btn ${btnInfo.class || 'btn-ghost'}`;
                btn.innerHTML = btnInfo.text;
                btn.addEventListener('click', () => {
                    if (btnInfo.onClick) {
                        btnInfo.onClick(this);
                    } else {
                        this.hide();
                    }
                });
                this.footer.appendChild(btn);
            });
        } else {
            // Nút mặc định
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn btn-ghost';
            closeBtn.textContent = 'Đóng';
            closeBtn.addEventListener('click', () => this.hide());
            this.footer.appendChild(closeBtn);
        }

        // Hiển thị
        this.overlay.classList.add('show');
        
        // Callback khi show
        if (options.onShow) {
            setTimeout(() => options.onShow(this.body), 50);
        }
    },

    hide() {
        this.overlay.classList.remove('show');
    },
    
    // Hàm tiện ích: Modal xác nhận xoá
    confirmDelete(title, message, onConfirm) {
        this.show({
            title: title || 'Xác nhận xoá',
            content: `<p class="text-danger"><i class="fas fa-triangle-exclamation"></i> ${message}</p>`,
            width: '400px',
            buttons: [
                { text: 'Hủy bỏ', class: 'btn-ghost' },
                { 
                    text: '<i class="fas fa-trash"></i> Xoá', 
                    class: 'btn-danger', 
                    onClick: () => {
                        onConfirm();
                        this.hide();
                    } 
                }
            ]
        });
    }
};

/**
 * Giao diện Floating Window (Cửa sổ nổi, có thể kéo thả, thay đổi kích thước, mở nhiều cửa sổ)
 */
const FloatingWindowSystem = {
    init() {
        this.zIndexCounter = 1000;
        this.openWindows = {};
        window.floatingWindow = this;
    },

    show(options) {
        if (options.id && this.openWindows[options.id]) {
            // Window already open, just bring to front
            const win = this.openWindows[options.id];
            this.zIndexCounter++;
            win.style.zIndex = this.zIndexCounter;
            
            // Add a brief highlight effect
            const originalBg = win.style.backgroundColor;
            win.style.backgroundColor = 'var(--bg-main)';
            setTimeout(() => { win.style.backgroundColor = originalBg; }, 300);
            return win;
        }

        this.zIndexCounter++;
        const win = document.createElement('div');
        win.className = 'floating-window';
        
        // Cấu hình CSS cơ bản cho floating window
        win.style.position = 'fixed';
        win.style.top = Math.max(50, 100 + (this.zIndexCounter - 1000) * 30) + 'px';
        win.style.left = Math.max(50, 100 + (this.zIndexCounter - 1000) * 30) + 'px';
        win.style.width = options.width || '1200px';
        win.style.height = options.height || '800px';
        win.style.backgroundColor = 'var(--bg-card)';
        win.style.border = '1px solid var(--border-color)';
        win.style.borderRadius = '8px';
        win.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        win.style.zIndex = this.zIndexCounter;
        win.style.resize = 'both';
        win.style.overflow = 'hidden';
        win.style.display = 'flex';
        win.style.flexDirection = 'column';
        win.style.minWidth = '400px';
        win.style.minHeight = '300px';

        // Header
        const header = document.createElement('div');
        header.className = 'floating-window-header';
        header.style.padding = '15px';
        header.style.borderBottom = '1px solid var(--border-color)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.cursor = 'move';
        header.style.backgroundColor = 'var(--bg-main)';
        header.style.userSelect = 'none';

        const title = document.createElement('h4');
        title.style.margin = '0';
        title.innerHTML = options.title || 'Chi tiết';
        
        const headerActions = document.createElement('div');
        headerActions.style.display = 'flex';
        headerActions.style.gap = '10px';

        if (options.print) {
            const handlePrint = (paperSize) => {
                const printWindow = window.open('', '_blank', 'width=1000,height=800');
                
                const customTemplate = win.querySelector('.print-template');
                let printContent = '';
                
                if (customTemplate) {
                    printContent = customTemplate.innerHTML;
                    if (paperSize === 'A4') {
                        printContent = printContent.replace(/size: A5 landscape;/g, 'size: A4 portrait;');
                    }
                } else {
                    printContent = `
                        <style>
                            body { font-family: 'Inter', Arial, sans-serif; padding: 20px; line-height: 1.6; color: #000; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f5f5f5; }
                            .text-right { text-align: right; }
                        </style>
                        ${win.querySelector('.floating-window-body').innerHTML}
                    `;
                }

                printWindow.document.write(`
                    <html>
                        <head>
                            <title>In Phiếu</title>
                            <style>
                                @media print {
                                    body { margin: 0; padding: 0; }
                                    button { display: none; }
                                    .print-template { display: block !important; }
                                }
                            </style>
                        </head>
                        <body>
                            ${printContent}
                            <script>
                                window.onload = () => { window.print(); window.close(); };
                            <\/script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            };

            const printA5Btn = document.createElement('button');
            printA5Btn.className = 'btn btn-ghost btn-sm text-primary';
            printA5Btn.innerHTML = '<i class="fas fa-print"></i> In A5 (Ngang)';
            printA5Btn.onclick = () => handlePrint('A5');
            headerActions.appendChild(printA5Btn);

            const printA4Btn = document.createElement('button');
            printA4Btn.className = 'btn btn-ghost btn-sm text-primary';
            printA4Btn.innerHTML = '<i class="fas fa-print"></i> In A4 (Đứng)';
            printA4Btn.onclick = () => handlePrint('A4');
            headerActions.appendChild(printA4Btn);
        }

        if (options.exportExcelUrl) {
            const exportExcelBtn = document.createElement('button');
            exportExcelBtn.className = 'btn btn-ghost btn-sm text-success';
            exportExcelBtn.innerHTML = '<i class="fas fa-file-excel"></i> Xuất Excel';
            exportExcelBtn.onclick = async () => {
                const originalText = exportExcelBtn.innerHTML;
                exportExcelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Xuất...';
                exportExcelBtn.disabled = true;
                try {
                    const response = await fetch(options.exportExcelUrl, {
                        headers: { 'Authorization': 'Bearer ' + (window.Auth ? window.Auth.token : '') }
                    });
                    if (!response.ok) throw new Error("Lỗi khi xuất file Excel");
                    
                    let filename = "export.xlsx";
                    const disposition = response.headers.get('content-disposition');
                    if (disposition && disposition.includes('filename=')) {
                        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                        if (matches != null && matches[1]) {
                            filename = matches[1].replace(/['"]/g, '');
                            if (filename.startsWith("UTF-8")) {
                                filename = decodeURIComponent(filename.replace("UTF-8''", ""));
                            }
                        }
                    }
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                } catch(e) {
                    alert(e.message);
                } finally {
                    exportExcelBtn.innerHTML = originalText;
                    exportExcelBtn.disabled = false;
                }
            };
            headerActions.appendChild(exportExcelBtn);
        }

        if (options.buttons && options.buttons.length > 0) {
            options.buttons.forEach(btnInfo => {
                const btn = document.createElement('button');
                btn.className = btnInfo.className || 'btn btn-ghost btn-sm';
                btn.innerHTML = btnInfo.html;
                if (btnInfo.id) btn.id = btnInfo.id;
                btn.onclick = () => btnInfo.onClick(win);
                headerActions.appendChild(btn);
            });
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-ghost btn-icon text-danger';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.onclick = () => win.remove();
        headerActions.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(headerActions);

        // Body
        const body = document.createElement('div');
        body.className = 'floating-window-body';
        body.style.padding = '20px';
        body.style.flex = '1';
        body.style.overflow = 'auto';
        
        if (typeof options.content === 'string') {
            body.innerHTML = options.content;
        } else if (options.content instanceof HTMLElement) {
            body.appendChild(options.content);
        }

        win.appendChild(header);
        win.appendChild(body);
        document.body.appendChild(win);

        // Logic kéo thả (Drag)
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            if (e.target === closeBtn || closeBtn.contains(e.target)) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(win.style.left || 0);
            startTop = parseInt(win.style.top || 0);
            
            // Mang cửa sổ lên trên cùng
            this.zIndexCounter++;
            win.style.zIndex = this.zIndexCounter;
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;
            win.style.left = (startLeft + e.clientX - startX) + 'px';
            win.style.top = (startTop + e.clientY - startY) + 'px';
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Click vào cửa sổ thì mang nó lên trên cùng
        win.addEventListener('mousedown', () => {
            if (parseInt(win.style.zIndex) !== this.zIndexCounter) {
                this.zIndexCounter++;
                win.style.zIndex = this.zIndexCounter;
            }
        });
        
        // Remove event listeners khi đóng để tránh memory leak
        const originalRemove = win.remove.bind(win);
        win.remove = () => {
            if (options.id) delete this.openWindows[options.id];
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            originalRemove();
        };

        if (options.id) {
            this.openWindows[options.id] = win;
        }

        return win;
    }
};

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    ModalSystem.init();
    FloatingWindowSystem.init();
});
