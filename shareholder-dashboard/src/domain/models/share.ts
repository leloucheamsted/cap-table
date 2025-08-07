import { User } from "./user";

export interface ShareIssuance {
    id: number;
    user_id: number;
    amount: number;
    issued_at: Date;
    certificate_path?: string;
    certificate_available: boolean;
    owner?: User;
}

export interface ShareIssuanceCreate {
    user_id: number;
    amount: number;
}