/**
 * Giao diện Cửa sổ nổi có thể kéo thả (Draggable Window)
 */
const WindowManager = {
    windows: [],
    baseZIndex: 1050,

    init() {
        this.container = document.createElement('div');
        this.container.id = 'windowContainer';
        document.body.appendChild(this.container);
        window.windowManager = this;
    },

    show(options) {
        const win = new DraggableWindow(options, this);
        this.windows.push(win);
        return win;
    },

    bringToFront(win) {
        this.baseZIndex += 1;
        win.element.style.zIndex = this.baseZIndex;
    },

    remove(win) {
        this.windows = this.windows.filter(w => w !== win);
    }
};

class DraggableWindow {
    constructor(options, manager) {
        this.manager = manager;
        this.options = options;
        this.element = document.createElement('div');
        this.element.className = 'floating-window';
        
        // Initial width and position
        this.element.style.width = options.width || '600px';
        
        // Stagger positions based on how many are open
        const offset = (this.manager.windows.length * 30) % 150;
        this.element.style.top = (100 + offset) + 'px';
        this.element.style.left = (window.innerWidth / 2 - parseInt(options.width || 600) / 2 + offset) + 'px';

        this.build();
        this.attachEvents();
        
        this.manager.container.appendChild(this.element);
        this.manager.bringToFront(this);
    }

    build() {
        // Header
        const header = document.createElement('div');
        header.className = 'floating-window-header';
        
        const title = document.createElement('h3');
        title.textContent = this.options.title || 'Cửa sổ';
        header.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'floating-window-close';
        closeBtn.innerHTML = '<i class="fas fa-xmark"></i>';
        closeBtn.addEventListener('click', () => this.close());
        header.appendChild(closeBtn);
        
        // Body
        this.body = document.createElement('div');
        this.body.className = 'floating-window-body';
        if (typeof this.options.content === 'string') {
            this.body.innerHTML = this.options.content;
        } else if (this.options.content instanceof HTMLElement) {
            this.body.appendChild(this.options.content);
        }

        // Footer
        const footer = document.createElement('div');
        footer.className = 'floating-window-footer';
        
        if (this.options.buttons && this.options.buttons.length > 0) {
            this.options.buttons.forEach(btnInfo => {
                const btn = document.createElement('button');
                btn.className = `btn ${btnInfo.class || 'btn-ghost'}`;
                btn.innerHTML = btnInfo.text;
                btn.addEventListener('click', () => {
                    if (btnInfo.onClick) {
                        btnInfo.onClick(this);
                    } else {
                        if (btnInfo.close) this.close();
                    }
                });
                footer.appendChild(btn);
            });
        }

        this.element.appendChild(header);
        this.element.appendChild(this.body);
        if (this.options.buttons && this.options.buttons.length > 0) {
            this.element.appendChild(footer);
        }
        
        this.header = header;
    }

    attachEvents() {
        // Bring to front on click
        this.element.addEventListener('mousedown', () => {
            this.manager.bringToFront(this);
        });

        // Make draggable
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Constrain to window bounds roughly
            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;
            
            if (newTop < 0) newTop = 0;
            if (newTop > window.innerHeight - 50) newTop = window.innerHeight - 50;
            if (newLeft < -this.element.offsetWidth + 50) newLeft = -this.element.offsetWidth + 50;
            if (newLeft > window.innerWidth - 50) newLeft = window.innerWidth - 50;

            this.element.style.left = newLeft + 'px';
            this.element.style.top = newTop + 'px';
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        this.header.addEventListener('mousedown', (e) => {
            // Prevent drag if clicking close button
            if (e.target.closest('.floating-window-close')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.element.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            this.manager.bringToFront(this);
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    close() {
        this.element.remove();
        this.manager.remove(this);
    }
}

// Initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
    WindowManager.init();
});
