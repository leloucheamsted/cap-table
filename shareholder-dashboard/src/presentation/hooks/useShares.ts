import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShareIssuance } from '../../domain/models/share';
import { ShareRepositoryApi } from '../../infrastructure/persistance/ShareRepositoryApi';
import { DownloadCertificateUseCase } from '../../domain/usecases/share_usecase/DownloadCertificateUseCase';
import { FilterShareIssuancesUseCase, ShareFilters } from '../../domain/usecases/share_usecase/FilterShareIssuancesUseCase';
import { GetShareholderIssuancesUseCase } from '../../domain/usecases/share_usecase/GetShareholderIssuancesUseCase';
import { GetShareSummaryUseCase, ShareSummary } from '../../domain/usecases/share_usecase/GetShareSummaryUseCase';
import { SharesEndPoint } from '../../infrastructure/api/endpoints/shares_endpoint';
import { GetDashboardUsecase } from '../../domain/usecases/share_usecase/GetDashboardUsecase';
import { DashboardData } from '../../core/types';

const shareEndpoint = new SharesEndPoint();
const shareRepository = new ShareRepositoryApi(shareEndpoint);
const getIssuancesUseCase = new GetShareholderIssuancesUseCase(shareRepository);
const downloadCertificateUseCase = new DownloadCertificateUseCase(shareRepository);
const getShareSummaryUseCase = new GetShareSummaryUseCase(shareRepository);
const filterShareIssuancesUseCase = new FilterShareIssuancesUseCase(shareRepository);
const getShareDashboardDataUseCase = new GetDashboardUsecase(shareRepository);
export const useShare = () => {
    const [issuances, setIssuances] = useState<ShareIssuance[]>([]);
    const [totalShares, setTotalShares] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState<boolean>(false);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const addIssuance = useCallback((newIssuance: ShareIssuance) => {
        setIssuances(prev => [...prev, newIssuance]);
    }, []);


    const loadShareholderIssuances = useCallback(
        async () => {
            if (hasLoaded || loading) return;
            try {
                setLoading(true);
                setError(null);

                const issuances = await getIssuancesUseCase.execute();
                setIssuances(issuances);
                setHasLoaded(true);

                return issuances;
            } catch (err: any) {
                setError(err.message || "Failed to load issuances");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [hasLoaded, loading]
    );
    const downloadCertificate = useCallback(
        async (issuanceId: string) => {
            try {
                setError(null);

                await downloadCertificateUseCase.executeDownload(issuanceId);
            } catch (err: any) {
                setError(err.message || "Failed to download certificate");
                throw err;
            }
        },
        []
    );


    const getShareSummary = useCallback(
        async (): Promise<ShareSummary> => {
            try {
                setError(null);

                const summary = await getShareSummaryUseCase.execute();
                return summary;
            } catch (err: any) {
                setError(err.message || "Failed to get share summary");
                throw err;
            }
        },
        []
    );


    const filterIssuances = useCallback(
        async (filters: ShareFilters) => {
            try {
                setLoading(true);
                setError(null);

                const filteredIssuances = await filterShareIssuancesUseCase.execute(filters);
                setIssuances(filteredIssuances);

                return filteredIssuances;
            } catch (err: any) {
                setError(err.message || "Failed to filter issuances");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );



    const calculateTotalShares = useCallback(
        () => {
            const total = issuances.reduce((sum, issuance) => sum + issuance.amount, 0);
            setTotalShares(total);
            return total;
        },
        [issuances]
    );


    const getRecentIssuances = useCallback(
        (days: number = 30) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            return issuances.filter(issuance =>
                new Date(issuance.issued_at) >= cutoffDate
            );
        },
        [issuances]
    );


    const getIssuanceStats = useCallback(
        async () => {
            try {
                const dashboardData = await getShareDashboardDataUseCase.execute();
                setDashboard(dashboardData);
                return {
                    totalIssuances: dashboardData.statistics.total_issuances || issuances.length,
                    totalShares: dashboardData.statistics.total_shares || totalShares,
                    totalValue: dashboardData.statistics.total_value ||
                        (issuances.length > 0 ? Math.round(totalShares / issuances.length) : 0),
                };
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);

                if (issuances.length === 0) {
                    return {
                        totalIssuances: 0,
                        totalShares: 0,
                        averageSharesPerIssuance: 0,
                        firstIssuanceDate: null,
                        lastIssuanceDate: null
                    };
                }

                const sortedByDate = [...issuances].sort(
                    (a, b) => new Date(a.issued_at).getTime() - new Date(b.issued_at).getTime()
                );

                return {
                    totalIssuances: issuances.length,
                    totalShares,
                    totalValue: Math.round(totalShares / issuances.length),
                    firstIssuanceDate: sortedByDate[0].issued_at,
                    lastIssuanceDate: sortedByDate[sortedByDate.length - 1].issued_at
                };
            }
        },
        [issuances, totalShares]
    );

    const [statsData, setStatsData] = useState<any>({
        totalIssuances: 0,
        totalShares: 0,
        totalValue: 0,
        firstIssuanceDate: null,
        lastIssuanceDate: null
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const stats = await getIssuanceStats();
                setStatsData(stats);
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        };

        if (issuances.length > 0 || totalShares > 0) {
            loadStats();
        }
    }, [issuances, totalShares, getIssuanceStats]);
    return {
        issuances,
        totalShares,
        loading,
        error,

        loadShareholderIssuances,
        downloadCertificate,
        getShareSummary,
        filterIssuances,

        calculateTotalShares,
        getRecentIssuances,
        clearError,
        addIssuance,
        hasLoaded,
        dashboard,
        hasIssuances: issuances.length > 0,
        isEmpty: issuances.length === 0 && !loading,
        recentIssuances: getRecentIssuances(),
        statsData,
        getIssuanceStats
    };
};