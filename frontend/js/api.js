/**
 * WMS API Client
 * Giao tiáº¿p vá»›i FastAPI Backend
 */
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8888/api' 
    : '/api'; // Same domain in production

const api = {
    // Helper Ä‘á»ƒ check server status
    async checkStatus() {
        try {
            // DÃ¹ng endpoint nháº¹ nháº¥t Ä‘á»ƒ check (vÃ­ dá»¥ dashboard)
            const res = await fetch(`${API_BASE_URL}/reports/dashboard`, { method: 'HEAD' });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // Get active warehouse
    getKhoId() {
        return localStorage.getItem('active_kho_id') || 1;
    },

    // Cáº¥u hÃ¬nh fetch chung
    async fetchJSON(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (window.Auth && window.Auth.token) {
            headers['Authorization'] = 'Bearer ' + window.Auth.token;
        }

        try {
            const response = await fetch(url, { ...options, headers });
            
            if (response.status === 401) {
                // Token hết hạn hoặc không hợp lệ
                if (window.Auth) window.Auth.logout();
                throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
            }
            
            if (response.status === 403) {
                throw new Error("Bạn không có quyền thực hiện thao tác này.");
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMsg = `Lỗi HTTP: ${response.status}`;
                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        errorMsg = errorData.detail.map(e => e.msg).join(', ');
                    } else if (typeof errorData.detail === 'string') {
                        errorMsg = errorData.detail;
                    } else {
                        errorMsg = JSON.stringify(errorData.detail);
                    }
                }
                throw new Error(errorMsg);
            }

            // Xá»­ lÃ½ trÆ°á» ng há»£p khÃ´ng cÃ³ body (VD: DELETE)
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },
    
    // Danh mục (Categories)
    categories: {
        list: (loai = '') => api.fetchJSON(`/categories${loai ? '?loai=' + loai : ''}`),
        create: (data) => api.fetchJSON('/categories', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => api.fetchJSON(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => api.fetchJSON(`/categories/${id}`, { method: 'DELETE' })
    },

    // Tồn kho (Inventory)
    inventory: {
        list: (params) => {
            params = params || {};
            params.kho_id = api.getKhoId();
            const query = new URLSearchParams(params).toString();
            return api.fetchJSON(`/items?${query}`);
        },
        getAll: (search = '') => api.fetchJSON(`/items/all?search=${encodeURIComponent(search)}&kho_id=${api.getKhoId()}`),
        get: (id) => api.fetchJSON(`/items/${id}`),
        create: (data) => {
            data.kho_id = parseInt(api.getKhoId());
            return api.fetchJSON('/items', { method: 'POST', body: JSON.stringify(data) });
        },
        update: (id, data) => api.fetchJSON(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => api.fetchJSON(`/items/${id}`, { method: 'DELETE' }),
        uploadImage: async (id, file) => {
            const formData = new FormData();
            formData.append('file', file);
            
            // get token from sessionStorage since api module uses it internally
            const token = sessionStorage.getItem('wms_token');
            const response = await fetch(`${API_BASE_URL}/items/${id}/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || 'Lỗi khi upload ảnh');
            }

            return await response.json();
        },
        importExcel: async (file, updateExisting = false) => {
            const formData = new FormData();
            formData.append('file', file);
            
            const token = sessionStorage.getItem('wms_token');
            const khoId = api.getKhoId();
            const response = await fetch(`${API_BASE_URL}/items/import?kho_id=${khoId}&update_existing=${updateExisting}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || 'Lỗi khi nhập file Excel');
            }

            return await response.json();
        },
        getImportTemplateUrl: () => `${API_BASE_URL}/items/import/template`
    },

    // Authentication
    auth: {
        login: async (username, password) => {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch(`${API_BASE_URL}/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Đăng nhập thất bại');
            }
            
            return response.json();
        },
        changePassword: (data) => api.fetchJSON('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
        me: () => api.fetchJSON('/auth/me'),
        
        forgotPassword: (username) => api.fetchJSON('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ username })
        }),
        
        resetPassword: (username, otp, new_password) => api.fetchJSON('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ username, otp, new_password })
        })
    },

    // Giao dá»‹ch (Transactions)
    transactions: {
        list: (params) => {
            params = params || {};
            params.kho_id = api.getKhoId();
            const query = new URLSearchParams(params).toString();
            return api.fetchJSON(`/transactions?${query}`);
        },
        getExcelUrl: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return `${API_BASE_URL}/transactions/export-excel${query ? '?' + query : ''}`;
        },
        import: (data) => api.fetchJSON('/transactions/import', { method: 'POST', body: JSON.stringify(data) }),
        export: (data) => api.fetchJSON('/transactions/export', { method: 'POST', body: JSON.stringify(data) }),
        delete: (id) => api.fetchJSON(`/transactions/${id}`, { method: 'DELETE' })
    },

    // Danh má»¥c (Categories)
    categories: {
        list: (type = '') => api.fetchJSON(`/categories${type ? '?loai=' + type : ''}`),
        create: (data) => api.fetchJSON('/categories', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => api.fetchJSON(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => api.fetchJSON(`/categories/${id}`, { method: 'DELETE' })
    },

    // BÃ¡o cÃ¡o (Reports)
    reports: {
        dashboard: () => api.fetchJSON(`/reports/dashboard?kho_id=${api.getKhoId()}`),
        getExcelUrl: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return `${API_BASE_URL}/reports/export/inventory${query ? '?' + query : ''}`;
        },
        sendWarningEmail: (emails) => api.fetchJSON('/reports/send-warning-email', { method: 'POST', body: JSON.stringify({ emails, kho_id: api.getKhoId() }) })
    },

    // Phiáº¿u nháº­p (Receipts)
    receipts: {
        list: (params) => {
            params = params || {};
            params.kho_id = api.getKhoId();
            const query = new URLSearchParams(params).toString();
            return api.fetchJSON(`/receipts?${query}`);
        },
        get: (id) => api.fetchJSON(`/receipts/${id}`),
        create: (data) => {
            data.kho_id = parseInt(api.getKhoId());
            return api.fetchJSON('/receipts', { method: 'POST', body: JSON.stringify(data) });
        },
        delete: (id) => api.fetchJSON(`/receipts/${id}`, { method: 'DELETE' })
    },

    // Phiếu xuất (Issues)
    issues: {
        list: (params) => {
            params = params || {};
            params.kho_id = api.getKhoId();
            const query = new URLSearchParams(params).toString();
            return api.fetchJSON(`/issues?${query}`);
        },
        get: (id) => api.fetchJSON(`/issues/${id}`),
        create: (data) => {
            data.kho_id = parseInt(api.getKhoId());
            return api.fetchJSON('/issues', { method: 'POST', body: JSON.stringify(data) });
        },
        delete: (id) => api.fetchJSON(`/issues/${id}`, { method: 'DELETE' })
    },
    
    // Quản lý người dùng
    users: {
        list: () => api.fetchJSON('/users/'),
        create: (data) => api.fetchJSON('/users/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => api.fetchJSON(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => api.fetchJSON(`/users/${id}`, { method: 'DELETE' })
    },
    
    // CAi t há thAng (Settings)
    settings: {
        list: () => api.fetchJSON('/settings'),
        update: (key, value) => api.fetchJSON(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) })
    }
};
