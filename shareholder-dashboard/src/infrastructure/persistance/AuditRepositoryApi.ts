import { AuditEventFilter, AuditEvent, AuditStats } from "../../core/types/AuditEvent";
import { IAuditRepository } from "../../domain/repositories/IAuditRepository";
import { AuditEndpoint } from "../api/endpoints/audit_endpoint";

export class AuditRepositoryApi implements IAuditRepository {
    private auditEndpoint: AuditEndpoint;

    constructor(auditEndpoint: AuditEndpoint) {
        this.auditEndpoint = auditEndpoint;
    }

    async getAuditEvents(filter: AuditEventFilter): Promise<AuditEvent[]> {
        return this.auditEndpoint.getAuditEvents(filter);
    }

    async getRecentAuditEvents(limit: number): Promise<AuditEvent[]> {
        return this.auditEndpoint.getRecentAuditEvents(limit);
    }

    async getAuditStats(): Promise<AuditStats> {
        return this.auditEndpoint.getAuditStats();
    }
}
