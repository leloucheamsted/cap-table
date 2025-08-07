import { ShareIssuance } from "./share";

export interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    created_at: Date;
    shares?: ShareIssuance[];
}

export interface UserCreate {
    name: string;
    email: string;
    password: string;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface UserResponse {
    access_token: string;
    token_type: string;
    user: User;
}