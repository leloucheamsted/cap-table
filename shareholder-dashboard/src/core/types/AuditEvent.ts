import { User } from "./type";

export interface AuditEvent {
    id: number;
    event_type: string;
    user_id?: number;
    target_user_id?: number;
    ip_address?: string;
    user_agent?: string;
    details?: any;
    created_at: string;
    user?: User;
    target_user?: User;
}

export interface AuditEventFilter {
    event_type?: string;
    user_id?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}

export interface AuditStats {
    total_events: number;
    today_events: Record<string, number>;
    active_users_today: number;
}