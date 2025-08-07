import { CreateShareholderRequest, ShareholderWithShares, ShareIssuanceCreate } from "../entities/Share";
import { AdminDashboardData } from "../types/Admin";
import { ShareIssuance } from "../types/share";

export interface IAdminDataSource {
    getDashboardData(): Promise<AdminDashboardData>;
    createShareholder(data: CreateShareholderRequest): Promise<ShareholderWithShares>;
    getShareDistribution(): Promise<AdminDashboardData>;
    getListedShareholdersWithShares(): Promise<ShareholderWithShares[]>;
    getIssuance(): Promise<ShareIssuance[]>;
    assignInssuanceToShareholder(): (data: ShareIssuanceCreate) => Promise<ShareIssuance>;
    generateShareCertificate(issuanceId: number): Promise<string>;
    downloadShareCertificate(issuanceId: number): Promise<string>;
}
