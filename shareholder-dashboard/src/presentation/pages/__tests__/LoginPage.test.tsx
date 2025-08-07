import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { useAuth } from '../../hooks/useAuth';

// Mock du hook useAuth
jest.mock('../../hooks/useAuth');

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Wrapper pour React Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration par défaut du mock useAuth
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            isInitialized: true,
            login: jest.fn(),
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: jest.fn()
        });
    });

    const renderLoginPage = () => {
        return render(
            <RouterWrapper>
                <LoginPage />
            </RouterWrapper>
        );
    };

    test('renders login form with all elements', () => {
        renderLoginPage();

        // Vérifier la présence des éléments principaux
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        expect(screen.getByText('Sign in to your EquiBoard account')).toBeInTheDocument();
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByAltText('EquiBoard Logo')).toBeInTheDocument();
    });

    test('validates email field correctly', async () => {
        renderLoginPage();

        const emailInput = screen.getByPlaceholderText('Enter your email');
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // Test avec email vide
        fireEvent.click(submitButton);
        await waitFor(() => {
            expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
        });

        // Test avec email invalide
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.click(submitButton);
        await waitFor(() => {
            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        });
    });

    test('validates password field correctly', async () => {
        renderLoginPage();

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // Test avec mot de passe vide
        fireEvent.click(submitButton);
        await waitFor(() => {
            expect(screen.getByText('Please enter your password')).toBeInTheDocument();
        });

        // Test avec mot de passe trop court
        fireEvent.change(passwordInput, { target: { value: '123' } });
        fireEvent.click(submitButton);
        await waitFor(() => {
            expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
        });
    });

    test('disables submit button when form is invalid', () => {
        renderLoginPage();

        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // Le bouton doit être désactivé quand le formulaire est vide
        expect(submitButton).toBeDisabled();

        // Remplir seulement l'email
        const emailInput = screen.getByPlaceholderText('Enter your email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        expect(submitButton).toBeDisabled();

        // Remplir aussi le mot de passe avec une valeur valide
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        expect(submitButton).not.toBeDisabled();
    });

    test('handles successful login and redirects admin user', async () => {
        const mockLogin = jest.fn().mockResolvedValue({
            access_token: 'token123',
            user: { id: 1, name: 'Admin', email: 'admin@example.com', is_admin: true }
        });

        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            isInitialized: true,
            login: mockLogin,
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: jest.fn()
        });

        renderLoginPage();

        // Remplir le formulaire
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
            target: { value: 'admin@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'password123' }
        });

        // Soumettre le formulaire
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'admin@example.com',
                password: 'password123'
            });
            expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
        });
    });

    test('handles successful login and redirects regular user', async () => {
        const mockLogin = jest.fn().mockResolvedValue({
            access_token: 'token123',
            user: { id: 2, name: 'User', email: 'user@example.com', is_admin: false }
        });

        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            isInitialized: true,
            login: mockLogin,
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: jest.fn()
        });

        renderLoginPage();

        // Remplir le formulaire
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
            target: { value: 'user@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'password123' }
        });

        // Soumettre le formulaire
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'password123'
            });
            expect(mockNavigate).toHaveBeenCalledWith('/share', { replace: true });
        });
    });

    test('displays error message when login fails', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: 'Invalid credentials',
            isInitialized: true,
            login: jest.fn(),
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: jest.fn()
        });

        renderLoginPage();

        expect(screen.getByText('Login Failed')).toBeInTheDocument();
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    test('clears error when user starts typing', () => {
        const mockClearError = jest.fn();
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: 'Invalid credentials',
            isInitialized: true,
            login: jest.fn(),
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: mockClearError
        });

        renderLoginPage();

        // Taper dans le champ email devrait déclencher clearError
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
            target: { value: 'test@example.com' }
        });

        expect(mockClearError).toHaveBeenCalled();
    });

    test('shows loading state during login', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: true,
            error: null,
            isInitialized: true,
            login: jest.fn(),
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: jest.fn()
        });

        renderLoginPage();

        // Vérifier que les champs sont désactivés pendant le chargement
        expect(screen.getByPlaceholderText('Enter your email')).toBeDisabled();
        expect(screen.getByPlaceholderText('Enter your password')).toBeDisabled();

        // Vérifier que le bouton affiche l'état de chargement
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeDisabled();
    });

    test('handles login failure gracefully', async () => {
        const mockLogin = jest.fn().mockRejectedValue(new Error('Network error'));

        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            isInitialized: true,
            login: mockLogin,
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: jest.fn()
        });

        renderLoginPage();

        // Remplir le formulaire
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'password123' }
        });

        // Soumettre le formulaire
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalled();
            // Le navigate ne devrait pas être appelé en cas d'erreur
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    test('toggles password visibility', () => {
        renderLoginPage();

        const passwordInput = screen.getByPlaceholderText('Enter your password');

        // Par défaut, le mot de passe est masqué
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Cliquer sur l'icône pour afficher le mot de passe
        const toggleButton = screen.getByRole('button', { name: '' }); // L'icône toggle
        fireEvent.click(toggleButton);

        expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('trims and converts email to lowercase', async () => {
        const mockLogin = jest.fn().mockResolvedValue({
            access_token: 'token123',
            user: { id: 1, name: 'User', email: 'user@example.com', is_admin: false }
        });

        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: null,
            isInitialized: true,
            login: mockLogin,
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: jest.fn()
        });

        renderLoginPage();

        // Remplir avec un email contenant des espaces et des majuscules
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
            target: { value: '  USER@EXAMPLE.COM  ' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'password123' }
        });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'user@example.com', // Trimmed et en minuscules
                password: 'password123'
            });
        });
    });

    test('prevents form submission when already loading', () => {
        const mockLogin = jest.fn();
        mockUseAuth.mockReturnValue({
            user: null,
            loading: true,
            error: null,
            isInitialized: true,
            login: mockLogin,
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: jest.fn()
        });

        renderLoginPage();

        // Le bouton devrait être désactivé
        const submitButton = screen.getByRole('button');
        expect(submitButton).toBeDisabled();

        // Même si on essaie de cliquer, la fonction ne devrait pas être appelée
        fireEvent.click(submitButton);
        expect(mockLogin).not.toHaveBeenCalled();
    });

    test('displays support contact message', () => {
        renderLoginPage();

        expect(screen.getByText('Having trouble signing in? Contact your administrator.')).toBeInTheDocument();
    });

    test('closes error alert when close button is clicked', () => {
        const mockClearError = jest.fn();
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            error: 'Test error message',
            isInitialized: true,
            login: jest.fn(),
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
            clearError: mockClearError
        });

        renderLoginPage();

        // Trouver et cliquer sur le bouton de fermeture de l'alerte
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        expect(mockClearError).toHaveBeenCalled();
    });
});
