import { AuditEventFilter, AuditEvent, AuditStats } from "../../core/types/AuditEvent";

export interface IAuditRepository {
    getAuditEvents(filter: AuditEventFilter): Promise<AuditEvent[]>;
    getRecentAuditEvents(limit: number): Promise<AuditEvent[]>;
    getAuditStats(): Promise<AuditStats>;
}
