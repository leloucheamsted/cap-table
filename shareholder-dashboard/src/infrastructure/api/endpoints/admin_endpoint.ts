import { IAdminDataSource } from "../../../core/data/IAdminDataSource";
import { CreateShareholderRequest, ShareholderWithShares, ShareIssuanceCreate } from "../../../core/entities/Share";
import { AdminDashboardData } from "../../../core/types/Admin";
import { ShareIssuance } from "../../../core/types/share";
import axiosInstance from "../config/axiosConfig";

export class AdminEndPoint implements IAdminDataSource {

    private baseUrl: string;

    constructor(baseUrl: string = '/admin') {
        this.baseUrl = baseUrl;
    }
    generateShareCertificate(issuanceId: number): Promise<string> {
        return axiosInstance.post<string>(`${this.baseUrl}/issuances/${issuanceId}/certificate`)
            .then(response => response.data);
    }
    downloadShareCertificate(issuanceId: number): Promise<string> {
        return axiosInstance.get<string>(`${this.baseUrl}/issuances/${issuanceId}/certificate/download`)
            .then(response => response.data);
    }
    async getDashboardData(): Promise<AdminDashboardData> {
        const response = await axiosInstance.get<AdminDashboardData>(`${this.baseUrl}/dashboard`);
        return response.data;
    }
    async createShareholder(data: CreateShareholderRequest): Promise<ShareholderWithShares> {
        const response = await axiosInstance.post<ShareholderWithShares>(`${this.baseUrl}/shareholders`, data);
        return response.data;
    }
    async getShareDistribution(): Promise<AdminDashboardData> {
        const response = await axiosInstance.get<AdminDashboardData>(`${this.baseUrl}/share-distribution`);
        return response.data;
    }
    async getListedShareholdersWithShares(): Promise<ShareholderWithShares[]> {
        const response = await axiosInstance.get<ShareholderWithShares[]>(`${this.baseUrl}/shareholders`);
        return response.data;
    }
    async getIssuance(): Promise<ShareIssuance[]> {
        const response = await axiosInstance.get<ShareIssuance[]>(`${this.baseUrl}/issuances`);
        return response.data;
    }
    assignInssuanceToShareholder(): (data: ShareIssuanceCreate) => Promise<ShareIssuance> {
        return async (data: ShareIssuanceCreate): Promise<ShareIssuance> => {
            const response = await axiosInstance.post<ShareIssuance>(`${this.baseUrl}/issuances`, {
                "amount": data.amount,
                "user_id": data.user_id,
                "owner_id": data.user_id,
                "price_per_share": 10
            });
            return response.data;
        };
    }

}