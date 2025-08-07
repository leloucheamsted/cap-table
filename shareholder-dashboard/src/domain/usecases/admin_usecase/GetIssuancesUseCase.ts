import { ShareIssuance } from "../../models/share";
import { IAdminRepository } from "../../repositories/IAdminRepository";

export class GetIssuancesUseCase {
    private adminRepository: IAdminRepository;

    constructor(adminRepository: IAdminRepository) {
        this.adminRepository = adminRepository;
    }

    async execute(): Promise<ShareIssuance[]> {
        try {
            const issuances = await this.adminRepository.getIssuance();
            console.log('Retrieved share issuances:', issuances);
            const sortedIssuances = issuances.sort((a, b) =>
                new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
            );

            console.log(`Retrieved ${sortedIssuances.length} share issuances`);
            return sortedIssuances;
        } catch (error) {
            console.error('Failed to get issuances:', error);
            throw new Error('Unable to load share issuances');
        }
    }
}