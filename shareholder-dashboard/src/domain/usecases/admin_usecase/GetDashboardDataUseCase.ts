import { AdminDashboardData } from "../../../core/types/Admin";
import { IAdminRepository } from "../../repositories/IAdminRepository";

export class GetDashboardDataUseCase {
    private adminRepository: IAdminRepository;

    constructor(adminRepository: IAdminRepository) {
        this.adminRepository = adminRepository;
    }

    async execute(): Promise<AdminDashboardData> {
        try {
            const dashboardData = await this.adminRepository.getDashboardData();

            console.log('Dashboard data retrieved successfully');
            return dashboardData;
        } catch (error) {
            console.error('Failed to get dashboard data:', error);
            throw new Error('Unable to load dashboard data');
        }
    }
}