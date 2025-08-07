import axios from 'axios';

export const setupAxiosAuthInterceptor = () => {
    axios.interceptors.request.use(
        (config) => {
            try {
                const authData = localStorage.getItem('auth-storage');
                if (authData) {
                    const parsedAuth = JSON.parse(authData);
                    const token = parsedAuth.state?.token;
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
            } catch (error) {
                console.error('[authInterceptor] Error parsing auth data:', error);
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                console.log('[authInterceptor] 401 unauthorized, clearing auth');
                localStorage.removeItem('auth-storage');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
};
