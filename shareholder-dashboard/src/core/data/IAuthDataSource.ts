import { AuthResponse, LoginRequest, RefreshTokenRequest, TokenValidationResponse } from "../entities/Auth";
import { User } from "../types/user";

export interface IAuthDataSource {
    login(credentials: LoginRequest): Promise<AuthResponse>;
    refreshToken(token: RefreshTokenRequest): Promise<AuthResponse>;
    validateToken(): Promise<TokenValidationResponse>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<User>;

}
