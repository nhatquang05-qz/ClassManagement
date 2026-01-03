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
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;