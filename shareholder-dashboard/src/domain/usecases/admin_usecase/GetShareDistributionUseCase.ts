import { AdminDashboardData } from "../../../core/types/Admin";
import { IAdminRepository } from "../../repositories/IAdminRepository";

export class GetShareDistributionUseCase {
    private adminRepository: IAdminRepository;

    constructor(adminRepository: IAdminRepository) {
        this.adminRepository = adminRepository;
    }

    async execute(): Promise<AdminDashboardData> {
        try {
            const distributionData = await this.adminRepository.getShareDistribution();

            console.log('Share distribution data retrieved successfully');
            return distributionData;
        } catch (error) {
            console.error('Failed to get share distribution:', error);
            throw new Error('Unable to load share distribution data');
        }
    }
}