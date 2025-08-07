import { IAuthDataSource } from "../../../core/data/IAuthDataSource";
import { AuthResponse, LoginRequest, RefreshTokenRequest, TokenValidationResponse } from "../../../core/entities/Auth"
import { User } from "../../../core/types";
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "../../../shared/constants";
import axiosInstance from "../config/axiosConfig";

export class AuthEndPoint implements IAuthDataSource {

    private baseUrl: string;

    constructor(baseUrl: string = '/auth') {
        this.baseUrl = baseUrl;
    }

    async getCurrentUser(): Promise<User> {
        try {
            const response = await axiosInstance.get<User>(`${this.baseUrl}/me`);
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch current user');
        }
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await axiosInstance.post<AuthResponse>(
                `${this.baseUrl}/login`,
                credentials
            );

            // Store tokens in localStorage
            localStorage.setItem('accessToken', response.data.access_token);
            localStorage.setItem('refreshToken', response.data.refresh_token);

            return response.data;
        } catch (error) {
            throw new Error('Login failed');
        }
    }

    async refreshToken(token: RefreshTokenRequest): Promise<AuthResponse> {
        return axiosInstance.post<AuthResponse>(
            `${this.baseUrl}/refresh`,
            token
        ).then(response => {
            // Update tokens in localStorage
            localStorage.setItem('accessToken', response.data.access_token);
            localStorage.setItem('refreshToken', response.data.refresh_token);
            return response.data;
        }).catch(error => {
            throw new Error('Token refresh failed');
        });
    }

    async validateToken(): Promise<TokenValidationResponse> {
        return axiosInstance.get<TokenValidationResponse>(
            `${this.baseUrl}/validate-token`
        ).then(response => {
            return response.data;
        }).catch(error => {
            throw new Error('Token validation failed');
        });
    }

    async logout(): Promise<void> {
        try {
            await axiosInstance.post(`${this.baseUrl}/logout`);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        } catch (error) {
            throw new Error('Logout failed');
        }
    }
}