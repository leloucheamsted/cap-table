import { AuditEventFilter, AuditEvent, AuditStats } from "../types/AuditEvent";

export interface IAuditDataSource {
    getAuditEvents(filter: AuditEventFilter): Promise<AuditEvent[]>;
    getRecentAuditEvents(limit: number): Promise<AuditEvent[]>;
    getAuditStats(): Promise<AuditStats>;
}
