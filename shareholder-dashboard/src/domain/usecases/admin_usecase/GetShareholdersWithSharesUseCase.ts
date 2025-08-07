import { ShareholderWithShares } from "../../../core/entities/Share";
import { IAdminRepository } from "../../repositories/IAdminRepository";

export class GetShareholdersWithSharesUseCase {
    private adminRepository: IAdminRepository;

    constructor(adminRepository: IAdminRepository) {
        this.adminRepository = adminRepository;
    }

    async execute(): Promise<ShareholderWithShares[]> {
        try {
            const shareholders = await this.adminRepository.getListedShareholdersWithShares();

            const sortedShareholders = shareholders.sort((a, b) => b.total_shares - a.total_shares);

            console.log(`Retrieved ${sortedShareholders.length} shareholders with shares`);
            return sortedShareholders;
        } catch (error) {
            console.error('Failed to get shareholders with shares:', error);
            throw new Error('Unable to load shareholders data');
        }
    }
}