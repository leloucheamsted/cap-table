import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "../../../shared/constants";

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });

    failedQueue = [];
};

export const setupAxiosGlobalInterceptor = () => {
    axios.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`);

            const token = localStorage.getItem(TOKEN_KEY);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        },
        (error: AxiosError) => {
            console.error('[Request Error]', error);
            return Promise.reject(error);
        }
    );

    axios.interceptors.response.use(
        (response: AxiosResponse) => {
            console.log(`[Response] ${response.status}: ${response.config.url}`);
            return response;
        },
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

            console.error('[Response Error]', error?.response?.data || error.message);

            if (error.response?.status === 401 && !originalRequest._retry) {
                if (originalRequest.url?.includes('/auth/login') ||
                    originalRequest.url?.includes('/auth/refresh')) {
                    return Promise.reject(error);
                }

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then(token => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return axios(originalRequest);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    handleAuthFailure();
                    return Promise.reject(error);
                }

                try {
                    const response = await axios.post('/auth/refresh', {
                        refresh_token: refreshToken
                    });

                    const { access_token, refresh_token: newRefreshToken } = response.data;

                    localStorage.setItem(TOKEN_KEY, access_token);
                    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    }

                    processQueue(null, access_token);

                    console.log('[Token Refresh] Successfully refreshed access token');

                    return axios(originalRequest);

                } catch (refreshError) {
                    processQueue(refreshError, null);
                    handleAuthFailure();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );
};

const handleAuthFailure = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }

    console.log('[Auth Failure] Redirecting to login page');
};