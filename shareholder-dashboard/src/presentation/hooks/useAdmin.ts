import { useCallback, useState } from 'react';
import { CreateShareholderRequest, ShareholderWithShares } from '../../core/entities/Share';
import { AdminDashboardData } from '../../core/types/Admin';
import { CreateShareholderUseCase } from '../../domain/usecases/admin_usecase/CreateShareholderUseCase';
import { GetDashboardDataUseCase } from '../../domain/usecases/admin_usecase/GetDashboardDataUseCase';
import { AdminEndPoint } from '../../infrastructure/api/endpoints/admin_endpoint';
import { AdminRepositoryApi } from '../../infrastructure/persistance/AdminRepositoryApi';
import { GetShareholdersWithSharesUseCase } from '../../domain/usecases/admin_usecase/GetShareholdersWithSharesUseCase';
import { GetIssuancesUseCase } from '../../domain/usecases/admin_usecase/GetIssuancesUseCase';
import { AssignSharesUseCase } from '../../domain/usecases/admin_usecase/AssignSharesUseCase';
import { GenerateShareCertificationUseCase } from '../../domain/usecases/admin_usecase/GenerateShareCertificationUseCase';
import { DownloadShareCertificationUseCase } from '../../domain/usecases/admin_usecase/DownloadShareCertificationUseCase';
import { ShareIssuance } from '../../core/types/share';

const adminEndpoint = new AdminEndPoint();
const adminRepository = new AdminRepositoryApi(adminEndpoint);
const getDashboardDataUseCase = new GetDashboardDataUseCase(adminRepository);
const createShareholderUseCase = new CreateShareholderUseCase(adminRepository);
const getShareholdersUseCase = new GetShareholdersWithSharesUseCase(adminRepository);
const getIssuancesUseCase = new GetIssuancesUseCase(adminRepository);
const assignSharesUseCase = new AssignSharesUseCase(adminRepository);
const generateCertificateUseCase = new GenerateShareCertificationUseCase(adminRepository);
const downloadCertificateUseCase = new DownloadShareCertificationUseCase(adminRepository);
export const useAdmin = () => {
    const [shareholders, setShareholders] = useState<ShareholderWithShares[]>([]);
    const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [issuances, setIssuances] = useState<ShareIssuance[]>([]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const addShareholder = useCallback((newShareholder: ShareholderWithShares) => {
        setShareholders(prev => [...prev, newShareholder]);
    }, []);

    const loadDashboardData = useCallback(
        async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getDashboardDataUseCase.execute();
                setDashboardData(data);

            } catch (err: any) {
                setError(err.message || "Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const loadShareholders = useCallback(
        async () => {
            try {
                setLoading(true);
                setError(null);

                const shareholders = await getShareholdersUseCase.execute();
                setShareholders(shareholders);
                const issuances = await getIssuancesUseCase.execute();
                setIssuances(issuances);
            } catch (err: any) {
                setError(err.message || "Failed to load shareholders");
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const createShareholder = useCallback(
        async (shareholderData: CreateShareholderRequest) => {
            try {
                setLoading(true);
                setError(null);

                const newShareholder = await createShareholderUseCase.execute(shareholderData);
                addShareholder(newShareholder);

                return newShareholder;
            } catch (err: any) {
                setError(err.message || "Failed to create shareholder");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [addShareholder]
    );

    const assignShares = useCallback(
        async (user_id: number, amount: number, price_per_share?: number) => {
            try {
                setLoading(true);
                setError(null);

                const issuanceData = {
                    user_id,
                    amount,
                    price_per_share: price_per_share || 1.0
                };

                const newIssuance = await assignSharesUseCase.execute(issuanceData);

                // Mettre à jour la liste des issuances
                setIssuances(prev => [...prev, newIssuance]);

                // Recharger les données pour mettre à jour les pourcentages
                await loadShareholders();

                return newIssuance;
            } catch (err: any) {
                setError(err.message || "Failed to assign shares");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [loadShareholders]
    );

    const generateCertificate = useCallback(
        async (issuanceId: number) => {
            try {
                setLoading(true);
                setError(null);

                console.log(`[useAdmin] Generating certificate for issuance ID: ${issuanceId}`);

                const certificateUrl = await generateCertificateUseCase.execute(issuanceId);
                setIssuances(prev =>
                    prev.map(issuance =>
                        issuance.id === issuanceId
                            ? { ...issuance, certificate_path: certificateUrl }
                            : issuance
                    )
                );

                console.log(`[useAdmin] Certificate generated successfully: ${certificateUrl}`);
                return certificateUrl;

            } catch (err: any) {
                setError(err.message || "Failed to generate certificate");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const downloadCertificate = useCallback(
        async (issuanceId: number) => {
            try {
                setLoading(true);
                setError(null);

                console.log(`[useAdmin] Downloading certificate for issuance ID: ${issuanceId}`);

                const downloadUrl = await downloadCertificateUseCase.adminExecuteDownload(issuanceId.toString());

                console.log(`[useAdmin] Certificate download URL: ${downloadUrl}`);

                // window.open(downloadUrl, '_blank');

                // return downloadUrl;

            } catch (err: any) {
                setError(err.message || "Failed to download certificate");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );


    return {
        shareholders,
        dashboardData,
        loading,
        error,
        issuances,
        loadDashboardData,
        loadShareholders,
        createShareholder,
        assignShares,
        generateCertificate,
        downloadCertificate,
        clearError,
        addShareholder,

        hasShareholders: shareholders.length > 0,
        isEmpty: shareholders.length === 0 && !loading,
        hasData: dashboardData !== null,
    };
};