import { AuthResponse, LoginRequest } from "../../../core/entities/Auth";
import { IAuthRepository } from "../../repositories/IAuthRepository";

export class LoginUseCase {
    private authRepository: IAuthRepository;

    constructor(authRepository: IAuthRepository) {
        this.authRepository = authRepository;
    }

    async execute(credentials: LoginRequest): Promise<AuthResponse> {
        try {
            if (!credentials.email || !credentials.password) {
                throw new Error('Email and password are required');
            }

            if (!this.isValidEmail(credentials.email)) {
                throw new Error('Invalid email format');
            }

            const authResponse = await this.authRepository.login(credentials);

            console.log(`User ${authResponse.user.email} logged in successfully`);

            return authResponse;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}