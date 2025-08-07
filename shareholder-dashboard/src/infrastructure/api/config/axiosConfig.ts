import axios from 'axios';
import { API_URL } from './environment';
import { TOKEN_KEY } from '../../../shared/constants';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor (auth headers, logs, etc.)
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            if (!config.headers) {
                config.headers = {} as import('axios').AxiosRequestHeaders;
            }
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor (global error handling)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Example: redirect to login on 401
        if (error.response?.status === 401) {
            // logout logic here if needed
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
