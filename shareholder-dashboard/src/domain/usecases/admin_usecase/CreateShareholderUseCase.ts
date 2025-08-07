import { CreateShareholderRequest, ShareholderWithShares } from "../../../core/entities/Share";
import { IAdminRepository } from "../../repositories/IAdminRepository";

export class CreateShareholderUseCase {
    private adminRepository: IAdminRepository;

    constructor(adminRepository: IAdminRepository) {
        this.adminRepository = adminRepository;
    }

    async execute(shareholderData: CreateShareholderRequest): Promise<ShareholderWithShares> {
        try {
            this.validateShareholderData(shareholderData);

            const newShareholder = await this.adminRepository.createShareholder(shareholderData);

            console.log(`Shareholder ${newShareholder.name} created successfully`);
            return newShareholder;
        } catch (error) {
            console.error('Failed to create shareholder:', error);
            throw error;
        }
    }

    private validateShareholderData(data: CreateShareholderRequest): void {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Shareholder name is required');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error('Valid email is required');
        }

        if (!data.password || data.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}