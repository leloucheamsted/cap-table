import { ShareIssuance } from "../../models/share";
import { IShareRepository } from "../../repositories/IShareRepository";

export class GetShareSummaryUseCase {
    private shareRepository: IShareRepository;

    constructor(shareRepository: IShareRepository) {
        this.shareRepository = shareRepository;
    }

    async execute(): Promise<ShareSummary> {
        try {
            const issuances = await this.shareRepository.getShareholderIssuance();

            const summary = this.calculateSummary(issuances);

            console.log('Share summary calculated successfully');
            return summary;
        } catch (error) {
            console.error('Failed to get share summary:', error);
            throw new Error('Unable to load share summary');
        }
    }

    private calculateSummary(issuances: ShareIssuance[]): ShareSummary {
        const totalShares = issuances.reduce((sum, issuance) => sum + issuance.amount, 0);
        const totalIssuances = issuances.length;
        const firstIssuance = issuances.length > 0
            ? issuances.reduce((earliest, current) =>
                new Date(current.issued_at) < new Date(earliest.issued_at) ? current : earliest
            )
            : null;
        const lastIssuance = issuances.length > 0
            ? issuances.reduce((latest, current) =>
                new Date(current.issued_at) > new Date(latest.issued_at) ? current : latest
            )
            : null;

        const firstIssuanceDate = firstIssuance ? new Date(firstIssuance.issued_at).toISOString() : null;
        const lastIssuanceDate = lastIssuance ? new Date(lastIssuance.issued_at).toISOString() : null;

        return {
            totalShares,
            totalIssuances,
            firstIssuanceDate,
            lastIssuanceDate,
            averageSharesPerIssuance: totalIssuances > 0 ? Math.round(totalShares / totalIssuances) : 0
        };
    }
}

export interface ShareSummary {
    totalShares: number;
    totalIssuances: number;
    firstIssuanceDate: string | null;
    lastIssuanceDate: string | null;
    averageSharesPerIssuance: number;
}