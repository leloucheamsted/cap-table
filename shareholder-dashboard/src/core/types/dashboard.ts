import { ShareIssuance } from "./share";
import { User } from "./user";

export interface DashboardStatistics {
    total_shares: number;
    total_issuances: number;
    total_value: number;
}

export interface DashboardUser {
    id: number;
    name: string;
    email: string;
}

export interface DashboardResponse {
    user: DashboardUser;
    statistics: DashboardStatistics;
    recent_issuances: ShareIssuance[];
}

export interface DashboardData {
    user: DashboardUser;
    statistics: DashboardStatistics;
    recent_issuances: ShareIssuance[];
}
