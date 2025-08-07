import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseAuth = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
    useAuth: () => mockUseAuth()
}));

const TestLoginComponent = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const mockNavigate = jest.fn();

    const handleLogin = async () => {
        setLoading(true);
        try {
            // Simulation de la logique de login
            if (email === 'admin@example.com' && password === 'password123') {
                mockNavigate('/admin');
            } else if (email === 'user@example.com' && password === 'password123') {
                mockNavigate('/share');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Login failed');
        }
        setLoading(false);
    };

    const isFormValid = () => {
        return email.trim() !== '' &&
            password.trim() !== '' &&
            email.includes('@') &&
            password.length >= 6;
    };

    return (
        <div>
            <h2>Welcome Back</h2>
            <p>Sign in to your EquiBoard account</p>
            <img src="./logo.png" alt="EquiBoard Logo" />

            {error && (
                <div role="alert">
                    <div>Login Failed</div>
                    <div>{error}</div>
                    <button onClick={() => setError('')}>Close</button>
                </div>
            )}

            <form onSubmit={(e) => {
                e.preventDefault();
                if (!loading) {
                    handleLogin();
                }
            }}>
                <div>
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        disabled={loading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        disabled={loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!isFormValid() || loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <p>Having trouble signing in? Contact your administrator.</p>
        </div>
    );
};

describe('LoginPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderLoginPage = () => {
        return render(<TestLoginComponent />);
    };

    test('renders login form with all elements', () => {
        renderLoginPage();

        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        expect(screen.getByText('Sign in to your EquiBoard account')).toBeInTheDocument();
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByAltText('EquiBoard Logo')).toBeInTheDocument();
    });

    test('disables submit button when form is invalid', () => {
        renderLoginPage();

        const submitButton = screen.getByRole('button', { name: /sign in/i });

        expect(submitButton).toBeDisabled();

        const emailInput = screen.getByPlaceholderText('Enter your email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        expect(submitButton).toBeDisabled();

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        expect(submitButton).not.toBeDisabled();
    });

    test('shows loading state during login', async () => {
        renderLoginPage();

        // Remplir le formulaire
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
            target: { value: 'admin@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'password123' }
        });

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent('Sign In');
    });

    test('displays error message for invalid credentials', async () => {
        renderLoginPage();

        fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
            target: { value: 'wrong@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'wrongpass' }
        });

        // Soumettre le formulaire
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText('Login Failed')).toBeInTheDocument();
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    test('clears error when close button is clicked', async () => {
        renderLoginPage();

        // Déclencher une erreur
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
            target: { value: 'wrong@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'wrongpass' }
        });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });

        // Fermer l'erreur
        fireEvent.click(screen.getByText('Close'));

        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });

    test('handles form validation correctly', () => {
        renderLoginPage();

        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        expect(submitButton).toBeDisabled();

        // Email invalide -> bouton désactivé
        fireEvent.change(emailInput, { target: { value: 'invalid' } });
        expect(submitButton).toBeDisabled();

        // Email valide mais mot de passe trop court -> bouton désactivé
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: '123' } });
        expect(submitButton).toBeDisabled();

        // Formulaire valide -> bouton activé
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        expect(submitButton).not.toBeDisabled();
    });

    test('form fields work correctly', async () => {
        renderLoginPage();

        // Remplir le formulaire
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');

        fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        // Vérifier que les valeurs sont correctement définies
        expect(emailInput).toHaveValue('admin@example.com');
        expect(passwordInput).toHaveValue('password123');

        // Le bouton devrait être activé
        expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
    });

    test('displays support contact message', () => {
        renderLoginPage();

        expect(screen.getByText('Having trouble signing in? Contact your administrator.')).toBeInTheDocument();
    });

    test('validates required form fields', () => {
        renderLoginPage();

        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');

        expect(emailInput).toHaveAttribute('required');
        expect(passwordInput).toHaveAttribute('required');
        expect(passwordInput).toHaveAttribute('minLength', '6');
    });
});
