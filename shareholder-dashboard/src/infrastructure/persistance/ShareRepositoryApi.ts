import { IShareDataSource } from "../../core/data/IShareDataSource";
import { DashboardData } from "../../core/types";
import { ShareIssuance } from "../../domain/models/share";

export class ShareRepositoryApi implements IShareDataSource {
    private shareDataSource: IShareDataSource;

    constructor(shareDataSource: IShareDataSource) {
        this.shareDataSource = shareDataSource;
    }
    downloadCertificate(issuanceId: number): Promise<string> {
        return this.shareDataSource.downloadCertificate(issuanceId);
    }
    getShareDashboardData(): Promise<DashboardData> {
        return this.shareDataSource.getShareDashboardData();
    }

    getShareholderIssuance(): Promise<ShareIssuance[]> {
        return this.shareDataSource.getShareholderIssuance();
    }

    getCertificat(data: string): Promise<string> {
        return this.shareDataSource.getCertificat(data);
    }
}