import { useState, useEffect } from 'react';
import { ShareRepositoryApi } from '../../infrastructure/persistance/ShareRepositoryApi';
import { SharesEndPoint } from '../../infrastructure/api/endpoints/shares_endpoint';
import { GetDashboardUsecase } from '../../domain/usecases/share_usecase/GetDashboardUsecase';
import { DashboardData } from '../../core/types';

const shareEndpoint = new SharesEndPoint();
const shareRepository = new ShareRepositoryApi(shareEndpoint);
const getDashboardUsecase = new GetDashboardUsecase(shareRepository);

export const useDashboard = () => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getDashboardUsecase.execute();
            setDashboardData(data);

            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => setError(null);

    // Auto-load dashboard data on mount
    useEffect(() => {
        loadDashboardData();
    }, []);

    return {
        dashboardData,
        loading,
        error,

        // Actions
        loadDashboardData,
        clearError,

        // Computed values
        isLoaded: dashboardData !== null,
        isEmpty: dashboardData === null && !loading,
    };
};
