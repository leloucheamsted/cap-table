import { IShareDataSource } from "../../../core/data/IShareDataSource";
import { DashboardData } from "../../../core/types";

export class GetDashboardUsecase {
    private shareDataSource: IShareDataSource;

    constructor(shareDataSource: IShareDataSource) {
        this.shareDataSource = shareDataSource;
    }

    async execute(): Promise<DashboardData> {
        try {
            const dashboardData = await this.shareDataSource.getShareDashboardData();
            return dashboardData;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw new Error('Failed to fetch dashboard data');
        }
    }
}
