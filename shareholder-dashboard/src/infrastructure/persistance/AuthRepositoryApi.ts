import { IAuthDataSource } from "../../core/data/IAuthDataSource";
import { LoginRequest, AuthResponse, RefreshTokenRequest, TokenValidationResponse } from "../../core/entities/Auth";
import { User } from "../../domain/models/user";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository";

export class AuthRepositoryApi implements IAuthRepository {
    private authDataSource: IAuthDataSource;
    constructor(authDataSource: IAuthDataSource) {
        this.authDataSource = authDataSource;
    }
    getCurrentUser(): Promise<User> {
        return this.authDataSource.getCurrentUser();
    }
    login(credentials: LoginRequest): Promise<AuthResponse> {
        return this.authDataSource.login(credentials)
    }
    refreshToken(token: RefreshTokenRequest): Promise<AuthResponse> {
        return this.authDataSource.refreshToken(token);
    }
    validateToken(): Promise<TokenValidationResponse> {
        return this.authDataSource.validateToken();
    }
    logout(): Promise<void> {
        return this.authDataSource.logout();
    }

}