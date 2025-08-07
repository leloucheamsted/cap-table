import { IAuditRepository } from "../../repositories/IAuditRepository";
import { AuditEvent } from "../../../core/types/AuditEvent";


export class GetRecentAuditEventsUseCase {
    constructor(private auditRepository: IAuditRepository) { }


    async execute(limit: number = 10): Promise<AuditEvent[]> {
        try {
            if (limit < 1 || limit > 50) {
                throw new Error("Limit must be between 1 and 50");
            }

            const events = await this.auditRepository.getRecentAuditEvents(limit);

            if (!Array.isArray(events)) {
                throw new Error("Invalid response format: expected array of audit events");
            }

            events.forEach((event, index) => {
                if (!event.id || !event.event_type || !event.created_at) {
                    throw new Error(`Invalid audit event format at index ${index}`);
                }
            });

            return events;
        } catch (error) {
            console.error('[GetRecentAuditEventsUseCase] Error retrieving recent audit events:', error);
            throw new Error(`Failed to get recent audit events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}