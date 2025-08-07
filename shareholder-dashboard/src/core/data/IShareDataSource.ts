import { DashboardData } from "../types";
import { ShareIssuance } from "../types/share";

export interface IShareDataSource {
    getShareholderIssuance(): Promise<ShareIssuance[]>;
    getCertificat(data: string): Promise<string>;
    getShareDashboardData(): Promise<DashboardData>;
    downloadCertificate(issuanceId: number): Promise<string>; // Optional method for downloading certificates
}
