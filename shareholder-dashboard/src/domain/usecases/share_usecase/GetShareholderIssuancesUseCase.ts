import { ShareIssuance } from "../../models/share";
import { IShareRepository } from "../../repositories/IShareRepository";

export class GetShareholderIssuancesUseCase {
    private shareRepository: IShareRepository;

    constructor(shareRepository: IShareRepository) {
        this.shareRepository = shareRepository;
    }

    async execute(): Promise<ShareIssuance[]> {
        try {
            const issuances = await this.shareRepository.getShareholderIssuance();

            const sortedIssuances = issuances.sort((a, b) =>
                new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
            );

            const totalShares = sortedIssuances.reduce((sum, issuance) => sum + issuance.amount, 0);

            console.log(`Retrieved ${sortedIssuances.length} issuances with total of ${totalShares} shares`);
            return sortedIssuances;
        } catch (error) {
            console.error('Failed to get shareholder issuances:', error);
            throw new Error('Unable to load your share issuances');
        }
    }

    async getTotalShares(): Promise<number> {
        try {
            const issuances = await this.execute();
            return issuances.reduce((sum, issuance) => sum + issuance.amount, 0);
        } catch (error) {
            console.error('Failed to calculate total shares:', error);
            throw new Error('Unable to calculate total shares');
        }
    }
}