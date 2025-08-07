import { AuthResponse, LoginRequest, RefreshTokenRequest, TokenValidationResponse } from "../../core/entities/Auth";
import { User } from "../models/user";

export interface IAuthRepository {
    login(credentials: LoginRequest): Promise<AuthResponse>;
    refreshToken(token: RefreshTokenRequest): Promise<AuthResponse>;
    validateToken(): Promise<TokenValidationResponse>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<User>;
}
