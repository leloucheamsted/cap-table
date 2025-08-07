import { ShareDistributionResponse, ShareIssuance } from "./share";

export interface AdminDashboardData {
    totalShareholders: number;
    totalShares: number;
    recentIssuances: ShareIssuance[];
    shareDistribution: ShareDistributionResponse;
}
export interface AdminApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}