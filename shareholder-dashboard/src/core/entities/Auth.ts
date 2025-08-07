import { User } from "../types/user";

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface TokenValidationResponse {
    valid: boolean;
    user_id?: number;
    is_admin?: boolean;
    email?: string;
}