import { IAuditDataSource } from "../../../core/data/IAuditDataSource";
import { AuditEventFilter, AuditEvent, AuditStats } from "../../../core/types/AuditEvent";
import axiosInstance from "../config/axiosConfig";

export class AuditEndpoint implements IAuditDataSource {
    private baseUrl: string;

    constructor(baseUrl: string = '/admin') {
        this.baseUrl = baseUrl;
    }
    async getAuditEvents(filter: AuditEventFilter): Promise<AuditEvent[]> {
        try {
            const response = await axiosInstance.post<AuditEvent[]>(`${this.baseUrl}/audit/events`, filter);
            return response.data;
        } catch (error) {
            console.error("Error fetching audit events:", error);
            throw error;
        }
    }
    async getRecentAuditEvents(limit: number): Promise<AuditEvent[]> {
        try {
            const response = await axiosInstance.get<AuditEvent[]>(`${this.baseUrl}/audit/recent`, {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching recent audit events:", error);
            throw error;
        }
    }
    async getAuditStats(): Promise<AuditStats> {
        try {
            const response = await axiosInstance.get<AuditStats>(`${this.baseUrl}/audit/stats`);
            return response.data;
        } catch (error) {
            console.error("Error fetching audit stats:", error);
            throw error;
        }
    }

}
