/**
 * Giao diện thông báo Toast
 */
const ToastSystem = {
    init() {
        this.container = document.getElementById('toastContainer');
        window.toast = {
            success: (msg) => this.show(msg, 'success', 'fa-circle-check'),
            error: (msg) => this.show(msg, 'error', 'fa-circle-exclamation'),
            warning: (msg) => this.show(msg, 'warning', 'fa-triangle-exclamation'),
            info: (msg) => this.show(msg, 'info', 'fa-circle-info')
        };
    },

    show(message, type, iconClass) {
        if (!this.container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <i class="fas ${iconClass} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><i class="fas fa-xmark"></i></button>
        `;

        // Thêm vào container
        this.container.appendChild(toast);

        // Xử lý nút đóng
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        // Tự động đóng sau 3s
        setTimeout(() => {
            if (this.container.contains(toast)) {
                this.remove(toast);
            }
        }, 3000);
    },

    remove(toast) {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }
};

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => ToastSystem.init());
