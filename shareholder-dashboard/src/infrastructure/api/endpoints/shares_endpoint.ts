import { IShareDataSource } from "../../../core/data/IShareDataSource";
import { DashboardData } from "../../../core/types";
import { ShareIssuance } from "../../../core/types/share";
import axiosInstance from "../config/axiosConfig";

export class SharesEndPoint implements IShareDataSource {

    private baseUrl: string;

    constructor(baseUrl: string = '/shareholder') {
        this.baseUrl = baseUrl;
    }
    downloadCertificate(issuanceId: number): Promise<string> {
        return axiosInstance.get<string>(`${this.baseUrl}/certificate/${issuanceId}`)
            .then(response => response.data);
    }
    getShareDashboardData(): Promise<DashboardData> {
        return axiosInstance.get<DashboardData>(`${this.baseUrl}/dashboard`)
            .then(response => response.data);
    }
    async getShareholderIssuance(): Promise<ShareIssuance[]> {
        const response = await axiosInstance.get<ShareIssuance[]>(`${this.baseUrl}/issuances`);
        return response.data;
    }
    async getCertificat(data: string): Promise<string> {
        const response = await axiosInstance.get<string>(`${this.baseUrl}/certificat/${data}`);
        return response.data;
    }



}