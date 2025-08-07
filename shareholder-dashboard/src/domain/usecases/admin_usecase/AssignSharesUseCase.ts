import { ShareIssuanceCreate, ShareIssuance } from "../../models/share";
import { IAdminRepository } from "../../repositories/IAdminRepository";

export class AssignSharesUseCase {
    private adminRepository: IAdminRepository;

    constructor(adminRepository: IAdminRepository) {
        this.adminRepository = adminRepository;
    }

    async execute(issuanceData: ShareIssuanceCreate): Promise<ShareIssuance> {
        try {
            this.validateIssuanceData(issuanceData);

            const assignSharesFunction = this.adminRepository.assignInssuanceToShareholder();
            const newIssuance = await assignSharesFunction(issuanceData);

            console.log(`Assigned ${newIssuance.amount} shares to user ${newIssuance.user_id}`);
            return newIssuance;
        } catch (error) {
            console.error('Failed to assign shares:', error);
            throw error;
        }
    }

    private validateIssuanceData(data: ShareIssuanceCreate): void {
        if (!data.user_id || data.user_id <= 0) {
            throw new Error('Valid user ID is required');
        }

        if (!data.amount || data.amount <= 0) {
            throw new Error('Share amount must be greater than 0');
        }

        if (data.amount > 10000000) {
            throw new Error('Share amount exceeds maximum allowed limit');
        }
    }
}