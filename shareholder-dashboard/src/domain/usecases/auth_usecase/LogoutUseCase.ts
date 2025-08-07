import { IAuthRepository } from "../../repositories/IAuthRepository";

export class LogoutUseCase {
    private authRepository: IAuthRepository;

    constructor(authRepository: IAuthRepository) {
        this.authRepository = authRepository;
    }

    async execute(): Promise<void> {
        try {
            await this.authRepository.logout();
            console.log('User logged out successfully');
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }
}