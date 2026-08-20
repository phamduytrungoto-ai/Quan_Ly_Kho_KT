/**
 * Quản lý Authentication và Phân quyền
 */
const Auth = {
    token: sessionStorage.getItem('wms_token'),
    user: null,

    init() {
        this.token = sessionStorage.getItem('wms_token');
        try {
            const userStr = sessionStorage.getItem('wms_user');
            if (userStr) {
                this.user = JSON.parse(userStr);
            }
        } catch (e) {
            console.error('Error parsing user data', e);
        }
    },

    setToken(token) {
        this.token = token;
        sessionStorage.setItem('wms_token', token);
    },

    setUser(user) {
        this.user = user;
        sessionStorage.setItem('wms_user', JSON.stringify(user));
    },

    async logout() {
        if (this.token) {
            try {
                // Ensure API_BASE_URL is defined (from api.js) or fallback to '/api'
                const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api';
                await fetch(baseUrl + '/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + this.token
                    }
                });
            } catch (e) {
                console.error('Logout error', e);
            }
        }
        
        this.token = null;
        this.user = null;
        sessionStorage.removeItem('wms_token');
        sessionStorage.removeItem('wms_user');
        window.location.reload();
    },

    isAuthenticated() {
        return !!this.token && !!this.user;
    },

    hasPermission(permName, khoId = null) {
        if (!this.user) return false;
        if (this.user.is_admin) return true;
        
        if (this.user.permissions && this.user.permissions.length > 0) {
            const targetKhoId = parseInt(khoId || localStorage.getItem('active_kho_id') || 1);
            const perm = this.user.permissions.find(p => p.warehouse_id === targetKhoId);
            if (perm) return !!perm[permName];
            return false;
        }
        
        return !!this.user[permName];
    },

    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Đăng nhập thất bại');
            }

            const data = await res.json();
            this.setToken(data.access_token);

            // Fetch user info
            const userRes = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': 'Bearer ' + data.access_token
                }
            });
            
            if (!userRes.ok) throw new Error('Không lấy được thông tin user');
            const userData = await userRes.json();
            this.setUser(userData);
            
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
};

Auth.init();
window.Auth = Auth;
