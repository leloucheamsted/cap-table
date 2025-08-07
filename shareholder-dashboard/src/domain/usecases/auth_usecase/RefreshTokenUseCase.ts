import { AuthResponse, RefreshTokenRequest } from "../../../core/entities/Auth";
import { IAuthRepository } from "../../repositories/IAuthRepository";

export class RefreshTokenUseCase {
    private authRepository: IAuthRepository;

    constructor(authRepository: IAuthRepository) {
        this.authRepository = authRepository;
    }

    async execute(refreshToken: string): Promise<AuthResponse> {
        try {
            if (!refreshToken) {
                throw new Error('Refresh token is required');
            }

            const tokenRequest: RefreshTokenRequest = {
                refresh_token: refreshToken
            };

            const authResponse = await this.authRepository.refreshToken(tokenRequest);

            console.log('Token refreshed successfully');
            return authResponse;
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    }
}