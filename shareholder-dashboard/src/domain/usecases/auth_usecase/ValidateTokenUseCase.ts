import { TokenValidationResponse } from "../../../core/entities/Auth";
import { IAuthRepository } from "../../repositories/IAuthRepository";

export class ValidateTokenUseCase {
    private authRepository: IAuthRepository;

    constructor(authRepository: IAuthRepository) {
        this.authRepository = authRepository;
    }

    async execute(): Promise<TokenValidationResponse> {
        try {
            const validationResponse = await this.authRepository.validateToken();

            if (!validationResponse.valid) {
                throw new Error('Invalid token');
            }

            return validationResponse;
        } catch (error) {
            console.error('Token validation failed:', error);
            throw error;
        }
    }
}