import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShareDashboard } from '../ShareDashboard';
import { useAuth } from '../../hooks/useAuth';
import { useShare } from '../../hooks/useShares';

// Mock des hooks
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useShares');
jest.mock('../../../shared/components/LogoutModal', () => ({
    LogoutModal: ({ visible, onClose, onConfirm }: any) =>
        visible ? (
            <div data-testid="logout-modal">
                <button onClick={onClose}>Close</button>
                <button onClick={onConfirm}>Confirm</button>
            </div>
        ) : null
}));

// Mock des données de test
const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    is_admin: false,
    created_at: new Date('2024-01-01T00:00:00Z')
};

const mockDashboard = {
    statistics: {
        total_shares: 1000,
        total_value: 1500,
        total_issuances: 3
    },
    recent_issuances: [
        {
            id: 1,
            amount: 500,
            issued_at: new Date('2024-01-01'),
            price_per_share: 1.5,
            certificate_available: true,
            owner: { id: 1, name: 'John Doe', email: 'john@example.com' }
        },
        {
            id: 2,
            amount: 300,
            issued_at: new Date('2024-02-01'),
            price_per_share: 1.5,
            certificate_available: true,
            owner: { id: 1, name: 'John Doe', email: 'john@example.com' }
        }
    ]
};

const mockStatsData = {
    totalIssuances: 3
};

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseShare = useShare as jest.MockedFunction<typeof useShare>;

describe('ShareDashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration des mocks par défaut
        mockUseAuth.mockReturnValue({
            user: mockUser,
            loading: false,
            error: null,
            isInitialized: true,
            login: jest.fn(),
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: jest.fn()
        });

        mockUseShare.mockReturnValue({
            statsData: mockStatsData,
            dashboard: mockDashboard,
            issuances: mockDashboard.recent_issuances,
            downloadCertificate: jest.fn(),
            loadShareholderIssuances: jest.fn(),
            getIssuanceStats: jest.fn(),
            loading: false
        } as any);
    });

    test('renders ShareDashboard with user information', () => {
        render(<ShareDashboard />);

        // Vérifier que les informations utilisateur sont affichées
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
    });

    test('displays user statistics correctly', () => {
        render(<ShareDashboard />);

        // Vérifier que les statistiques sont affichées
        expect(screen.getByText('1000')).toBeInTheDocument(); // Total shares
        expect(screen.getByText('$1500')).toBeInTheDocument(); // Total value
        expect(screen.getByText('3 Certificates')).toBeInTheDocument(); // Total issuances
    });

    test('renders share issuances table with data', () => {
        render(<ShareDashboard />);

        // Vérifier que le tableau des issuances est affiché
        expect(screen.getByText('My Share Issuances')).toBeInTheDocument();
        expect(screen.getByText('#001')).toBeInTheDocument(); // Premier ID d'issuance
        expect(screen.getByText('#002')).toBeInTheDocument(); // Deuxième ID d'issuance
        expect(screen.getByText('500')).toBeInTheDocument(); // Nombre d'actions
        expect(screen.getByText('300')).toBeInTheDocument(); // Nombre d'actions
    });

    test('handles certificate download', async () => {
        const mockDownloadCertificate = jest.fn().mockResolvedValue({});
        mockUseShare.mockReturnValue({
            ...mockUseShare(),
            downloadCertificate: mockDownloadCertificate
        } as any);

        render(<ShareDashboard />);

        // Trouver et cliquer sur un bouton de téléchargement
        const downloadButtons = screen.getAllByText('Download');
        fireEvent.click(downloadButtons[0]);

        await waitFor(() => {
            expect(mockDownloadCertificate).toHaveBeenCalledWith('1');
        });
    });

    test('handles certificate download error', async () => {
        const mockDownloadCertificate = jest.fn().mockRejectedValue(new Error('Download failed'));
        mockUseShare.mockReturnValue({
            ...mockUseShare(),
            downloadCertificate: mockDownloadCertificate
        } as any);

        render(<ShareDashboard />);

        const downloadButtons = screen.getAllByText('Download');
        fireEvent.click(downloadButtons[0]);

        await waitFor(() => {
            expect(mockDownloadCertificate).toHaveBeenCalledWith('1');
        });
    });

    test('opens logout modal when logout button is clicked', () => {
        render(<ShareDashboard />);

        const logoutButton = screen.getByRole('button', { name: /logout/i });
        fireEvent.click(logoutButton);

        // Vérifier que le modal de déconnexion s'ouvre
        expect(screen.getByTestId('logout-modal')).toBeInTheDocument();
    });

    test('handles logout confirmation', async () => {
        const mockLogout = jest.fn().mockResolvedValue({});
        mockUseAuth.mockReturnValue({
            ...mockUseAuth(),
            logout: mockLogout
        });

        render(<ShareDashboard />);

        // Ouvrir le modal de déconnexion
        const logoutButton = screen.getByRole('button', { name: /logout/i });
        fireEvent.click(logoutButton);

        // Confirmer la déconnexion
        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalledTimes(1);
        });
    });

    test('formats dates correctly', () => {
        render(<ShareDashboard />);

        // Vérifier le formatage des dates (format MM DD, YYYY)
        expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
        expect(screen.getByText('Feb 1, 2024')).toBeInTheDocument();
    });

    test('displays price per share correctly', () => {
        render(<ShareDashboard />);

        // Vérifier l'affichage du prix par action
        expect(screen.getAllByText('$1.50')).toHaveLength(2); // 2 issuances avec le même prix
    });

    test('shows member since date correctly', () => {
        render(<ShareDashboard />);

        // Vérifier la date d'adhésion
        expect(screen.getByText('Member since Jan 1, 2024')).toBeInTheDocument();
    });

    test('disables download button when certificate not available', () => {
        const mockDashboardWithUnavailableCert = {
            ...mockDashboard,
            recent_issuances: [
                {
                    ...mockDashboard.recent_issuances[0],
                    certificate_available: false
                }
            ]
        };

        mockUseShare.mockReturnValue({
            ...mockUseShare(),
            dashboard: mockDashboardWithUnavailableCert,
            issuances: mockDashboardWithUnavailableCert.recent_issuances
        } as any);

        render(<ShareDashboard />);

        const downloadButton = screen.getByText('Download');
        expect(downloadButton).toBeDisabled();
    });

    test('calculates average shares per issuance correctly', () => {
        render(<ShareDashboard />);

        // Total shares: 1000, Total issuances: 3, Average: 333
        expect(screen.getByText('333')).toBeInTheDocument();
    });

    test('handles empty issuances list', () => {
        const mockEmptyDashboard = {
            statistics: {
                total_shares: 0,
                total_value: 0,
                total_issuances: 0
            },
            recent_issuances: []
        };

        mockUseShare.mockReturnValue({
            ...mockUseShare(),
            dashboard: mockEmptyDashboard,
            issuances: []
        } as any);

        render(<ShareDashboard />);

        expect(screen.getByText('No share issuances found')).toBeInTheDocument();
    });

    test('calls necessary hooks on component mount', () => {
        const mockGetCurrentUser = jest.fn();
        const mockGetIssuanceStats = jest.fn();

        mockUseAuth.mockReturnValue({
            ...mockUseAuth(),
            getCurrentUser: mockGetCurrentUser
        });

        mockUseShare.mockReturnValue({
            ...mockUseShare(),
            getIssuanceStats: mockGetIssuanceStats
        } as any);

        render(<ShareDashboard />);

        expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
        expect(mockGetIssuanceStats).toHaveBeenCalledTimes(1);
    });

    test('handles contact support button click', () => {
        render(<ShareDashboard />);

        const supportButton = screen.getByText('Contact Support');
        fireEvent.click(supportButton);

        // Le bouton devrait déclencher un message info
        // Dans un vrai test, on pourrait mocker message.info pour vérifier l'appel
    });

    test('displays correct total value in multiple places', () => {
        render(<ShareDashboard />);

        // Vérifier que la valeur totale est affichée dans la sidebar et dans l'en-tête du tableau
        const totalValueElements = screen.getAllByText('$1500');
        expect(totalValueElements).toHaveLength(2);
    });
});
