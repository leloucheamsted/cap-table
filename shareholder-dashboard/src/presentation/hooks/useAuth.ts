import { useState, useEffect } from 'react';
import { AuthRepositoryApi } from '../../infrastructure/persistance/AuthRepositoryApi';
import { AuthEndPoint } from '../../infrastructure/api/endpoints/auth_endpoint';
import { LoginRequest } from '../../core/entities/Auth';
import { LoginUseCase } from '../../domain/usecases/auth_usecase/LoginUseCase';
import { LogoutUseCase } from '../../domain/usecases/auth_usecase/LogoutUseCase';
import { RefreshTokenUseCase } from '../../domain/usecases/auth_usecase/RefreshTokenUseCase';
import { GetCurrentUserUseCase } from '../../domain/usecases/auth_usecase/GetCurrentUserUseCase';
import { User } from '../../domain/models/user';
import { TokenStorage } from '../../shared/utils/TokenStorage';

const authEndpoint = new AuthEndPoint();
const authRepository = new AuthRepositoryApi(authEndpoint);
const loginUseCase = new LoginUseCase(authRepository);
const logoutUseCase = new LogoutUseCase(authRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(authRepository);
const getCurrentUserUseCase = new GetCurrentUserUseCase(authRepository);

export const useAuth = () => {


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [user, setUser] = useState<User | null>(null);


    const login = async (credentials: LoginRequest) => {
        try {
            setLoading(true);
            setError(null);

            const response = await loginUseCase.execute(credentials);
            setUser(response.user);
            TokenStorage.setToken(response.access_token);
            console.log('[useAuth] Login successful, user:', response.user.email, 'isAdmin:', response.user.is_admin);
            setIsInitialized(true);

            return response;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutUseCase.execute();
            TokenStorage.removeToken();
        } catch (err) {
            TokenStorage.removeToken();
        }
    };

    const getCurrentUser = async () => {
        try {
            setLoading(true);
            setError(null);

            const userData = await getCurrentUserUseCase.execute();

            const user: User = {
                id: userData.id,
                email: userData.email,
                is_admin: userData.is_admin,
                name: userData.name || '',
                created_at: userData.created_at || new Date()
            };

            setUser(user);
            console.log('[useAuth] Current user loaded:', user.email, 'isAdmin:', user.is_admin);

            return user;
        } catch (err: any) {
            console.error('[useAuth] Get current user failed:', err);
            setError(err.message);
            setUser(null);
            throw err;
        } finally {
            setLoading(false);
        }
    };
    return {
        user,
        loading,
        error,
        isInitialized,
        login,
        logout,
        getCurrentUser,
        clearError: () => setError(null),
    };
};