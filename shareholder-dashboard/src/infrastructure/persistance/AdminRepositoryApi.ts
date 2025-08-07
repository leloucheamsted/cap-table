import { CreateShareholderRequest, ShareholderWithShares } from "../../core/entities/Share";
import { AdminDashboardData } from "../../core/types/Admin";
import { ShareIssuance, ShareIssuanceCreate } from "../../domain/models/share";
import { IAdminRepository } from "../../domain/repositories/IAdminRepository";

export class AdminRepositoryApi implements IAdminRepository {
    private adminDataSource: IAdminRepository;


    constructor(adminDataSource: IAdminRepository) {
        this.adminDataSource = adminDataSource;
    }
    generateShareCertificate(issuanceId: number): Promise<string> {
        return this.adminDataSource.generateShareCertificate(issuanceId);
    }
    downloadShareCertificate(issuanceId: number): Promise<string> {
        return this.adminDataSource.downloadShareCertificate(issuanceId);
    }

    getDashboardData(): Promise<AdminDashboardData> {
        return this.adminDataSource.getDashboardData();
    }

    createShareholder(data: CreateShareholderRequest): Promise<ShareholderWithShares> {
        return this.adminDataSource.createShareholder(data);
    }

    getShareDistribution(): Promise<AdminDashboardData> {
        return this.adminDataSource.getShareDistribution();
    }

    getListedShareholdersWithShares(): Promise<ShareholderWithShares[]> {
        return this.adminDataSource.getListedShareholdersWithShares();
    }

    getIssuance(): Promise<ShareIssuance[]> {
        return this.adminDataSource.getIssuance();
    }

    assignInssuanceToShareholder(): (data: ShareIssuanceCreate) => Promise<ShareIssuance> {
        return this.adminDataSource.assignInssuanceToShareholder();
    }
} 