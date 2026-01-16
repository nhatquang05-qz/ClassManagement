import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

if (!baseUrl.endsWith('/api')) {
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }
    baseUrl += '/api';
}

console.log('API Base URL:', baseUrl);

const api = axios.create({
    baseURL: baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Phiên đăng nhập hết hạn hoặc không hợp lệ. Đang đăng xuất...');

            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');

            localStorage.removeItem('token');
            localStorage.removeItem('user');

            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
