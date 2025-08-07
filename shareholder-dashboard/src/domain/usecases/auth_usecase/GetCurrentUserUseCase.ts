import { User } from "../../models/user";
import { IAuthRepository } from "../../repositories/IAuthRepository";

export class GetCurrentUserUseCase {
    private authRepository: IAuthRepository;

    constructor(authRepository: IAuthRepository) {
        this.authRepository = authRepository;
    }

    async execute(): Promise<User> {
        try {
            const user = await this.authRepository.getCurrentUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            return user;
        } catch (error) {
            console.error('Get current user failed:', error);
            throw error;
        }
    }
}