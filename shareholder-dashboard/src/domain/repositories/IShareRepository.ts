import { DashboardData } from "../../core/types";
import { ShareIssuance } from "../models/share";

export interface IShareRepository {
    getShareholderIssuance(): Promise<ShareIssuance[]>;
    getCertificat(data: string): Promise<string>;
    getShareDashboardData(): Promise<DashboardData>;
    downloadCertificate(issuanceId: number): Promise<string>;
}
