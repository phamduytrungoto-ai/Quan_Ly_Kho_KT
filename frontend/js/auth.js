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

    logout() {
        this.token = null;
        this.user = null;
        sessionStorage.removeItem('wms_token');
        sessionStorage.removeItem('wms_user');
        window.location.reload();
    },

    isAuthenticated() {
        return !!this.token && !!this.user;
    },

    hasPermission(permName) {
        if (!this.user) return false;
        if (this.user.is_admin) return true;
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
