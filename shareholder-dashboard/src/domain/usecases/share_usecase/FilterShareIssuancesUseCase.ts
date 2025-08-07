import { ShareIssuance } from "../../models/share";
import { IShareRepository } from "../../repositories/IShareRepository";

export class FilterShareIssuancesUseCase {
    private shareRepository: IShareRepository;

    constructor(shareRepository: IShareRepository) {
        this.shareRepository = shareRepository;
    }

    async execute(filters: ShareFilters): Promise<ShareIssuance[]> {
        try {
            const allIssuances = await this.shareRepository.getShareholderIssuance();

            let filteredIssuances = [...allIssuances];

            if (filters.startDate) {
                filteredIssuances = filteredIssuances.filter(issuance =>
                    new Date(issuance.issued_at) >= new Date(filters.startDate!)
                );
            }

            if (filters.endDate) {
                filteredIssuances = filteredIssuances.filter(issuance =>
                    new Date(issuance.issued_at) <= new Date(filters.endDate!)
                );
            }

            if (filters.minAmount && filters.minAmount > 0) {
                filteredIssuances = filteredIssuances.filter(issuance =>
                    issuance.amount >= filters.minAmount!
                );
            }

            if (filters.maxAmount && filters.maxAmount > 0) {
                filteredIssuances = filteredIssuances.filter(issuance =>
                    issuance.amount <= filters.maxAmount!
                );
            }

            if (filters.sortBy) {
                filteredIssuances = this.sortIssuances(filteredIssuances, filters.sortBy, filters.sortOrder);
            }

            console.log(`Filtered ${filteredIssuances.length} issuances from ${allIssuances.length} total`);
            return filteredIssuances;
        } catch (error) {
            console.error('Failed to filter share issuances:', error);
            throw new Error('Unable to filter share issuances');
        }
    }

    private sortIssuances(
        issuances: ShareIssuance[],
        sortBy: SortBy,
        sortOrder: SortOrder = 'desc'
    ): ShareIssuance[] {
        return issuances.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.issued_at).getTime() - new Date(b.issued_at).getTime();
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                default:
                    return 0;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }
}

export interface ShareFilters {
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: SortBy;
    sortOrder?: SortOrder;
}

export type SortBy = 'date' | 'amount';
export type SortOrder = 'asc' | 'desc';