import { IAuditRepository } from "../../repositories/IAuditRepository";
import { AuditStats } from "../../../core/types/AuditEvent";


export class GetAuditStatsUseCase {
    constructor(private auditRepository: IAuditRepository) { }


    async execute(): Promise<AuditStats> {
        try {
            const stats = await this.auditRepository.getAuditStats();

            if (!stats) {
                throw new Error("Failed to retrieve audit statistics");
            }

            if (typeof stats.total_events !== 'number' || stats.total_events < 0) {
                throw new Error("Invalid audit statistics format");
            }

            return stats;
        } catch (error) {
            console.error('[GetAuditStatsUseCase] Error retrieving audit statistics:', error);
            throw new Error(`Failed to get audit statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}