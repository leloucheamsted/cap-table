import { ShareDistributionItem } from "../entities/Share";
import { User } from "./user";

export interface ShareIssuance {
    id: number;
    user_id: number;
    amount: number;
    issued_at: Date;
    certificate_path?: string;
    certificate_available: boolean;
    owner?: User;
    price_per_share?: number;
}

export interface ShareDistributionResponse {
    total_shares: number;
    distribution: ShareDistributionItem[];
}

