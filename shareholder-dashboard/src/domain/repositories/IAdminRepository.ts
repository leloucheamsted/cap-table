import { CreateShareholderRequest, ShareholderWithShares, ShareIssuanceCreate } from "../../core/entities/Share";
import { AdminDashboardData } from "../../core/types/Admin";
import { ShareIssuance } from "../../core/types/share";

export interface IAdminRepository {
    getDashboardData(): Promise<AdminDashboardData>;
    createShareholder(data: CreateShareholderRequest): Promise<ShareholderWithShares>;
    getShareDistribution(): Promise<AdminDashboardData>;
    getListedShareholdersWithShares(): Promise<ShareholderWithShares[]>;
    getIssuance(): Promise<ShareIssuance[]>;
    assignInssuanceToShareholder(): (data: ShareIssuanceCreate) => Promise<ShareIssuance>;
    generateShareCertificate(issuanceId: number): Promise<string>;
    downloadShareCertificate(issuanceId: number): Promise<string>;
}
