import { User } from "../types/user";

export interface AdminUser extends User {
    is_admin: true;
}

export interface CreateShareholderRequest {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
}

export interface ShareIssuanceCreate {
    user_id: number;
    amount: number;
}
export interface ShareDistributionItem {
    shareholder_name: string;
    shares_count: number;
    percentage: number;
}
export interface ShareholderWithShares {
    id: number;
    name: string;
    email: string;
    total_shares: number;
    created_at: string;
}