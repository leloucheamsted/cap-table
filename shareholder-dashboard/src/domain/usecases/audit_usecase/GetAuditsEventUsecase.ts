import { IAuditRepository } from "../../repositories/IAuditRepository";
import { AuditEvent, AuditEventFilter } from "../../../core/types/AuditEvent";


export class GetAuditEventsUseCase {
    constructor(private auditRepository: IAuditRepository) { }


    async execute(filter: AuditEventFilter): Promise<AuditEvent[]> {
        try {

            this.validateFilter(filter);

            const events = await this.auditRepository.getAuditEvents(filter);


            if (!Array.isArray(events)) {
                throw new Error("Invalid response format: expected array of audit events");
            }

            const sortedEvents = events.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            return sortedEvents;
        } catch (error) {
            console.error('[GetAuditEventsUseCase] Error retrieving audit events:', error);
            throw new Error(`Failed to get audit events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }


    private validateFilter(filter: AuditEventFilter): void {
        if (filter.limit && (filter.limit < 1 || filter.limit > 1000)) {
            throw new Error("Limit must be between 1 and 1000");
        }

        if (filter.offset && filter.offset < 0) {
            throw new Error("Offset must be non-negative");
        }

        if (filter.start_date && filter.end_date) {
            const startDate = new Date(filter.start_date);
            const endDate = new Date(filter.end_date);

            if (startDate > endDate) {
                throw new Error("Start date must be before or equal to end date");
            }
        }

        if (filter.user_id && filter.user_id < 1) {
            throw new Error("User ID must be a positive integer");
        }
    }
}