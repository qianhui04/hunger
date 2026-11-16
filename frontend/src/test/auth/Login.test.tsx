
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../../pages/Login';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Mock navigation
const { mockNavigate, mockRefreshUser } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockRefreshUser: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        refreshUser: mockRefreshUser,
    }),
}));

// Mock Supabase
vi.mock('../../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            getSession: vi.fn(),
            resetPasswordForEmail: vi.fn(),
        },
    },
}));

describe('Login Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
            data: {
                user: { id: 'test-user-id' },
                session: null,
            },
            error: null,
        } as any);

        mockRefreshUser.mockResolvedValue(true);

        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: {
                session: null,
            },
            error: null,
        } as any);

        vi.stubGlobal('alert', vi.fn());

        vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
            data: {},
            error: null,
        } as any);
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    // UT-01-002: Validate UM Email Domain During Login
    it('UT-01-002: accepts valid UM email domains', async () => {
        const user = userEvent.setup();

        render(<Login />);

        await user.type(screen.getByPlaceholderText('admin@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Admin123');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('UT-01-002: accepts @siswa.um.edu.my email domain', async () => {
        const user = userEvent.setup();

        render(<Login />);

        await user.type(screen.getByPlaceholderText('admin@um.edu.my'), 'admin@siswa.um.edu.my');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Admin123');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('UT-01-002: rejects email addresses outside UM domains', async () => {
        const user = userEvent.setup();

        render(<Login />);

        await user.type(screen.getByPlaceholderText('admin@um.edu.my'), 'admin@gmail.com');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Admin123');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        expect(
            screen.getByText(/Access Denied/)
        ).toBeInTheDocument();

        expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    // UT-01-010: Verify Login Email Normalisation
    it('UT-01-010: trims spaces and converts email to lowercase', async () => {
        const user = userEvent.setup();

        render(<Login />);

        await user.type(screen.getByPlaceholderText('admin@um.edu.my'), ' ADMIN@UM.EDU.MY ');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Admin123');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'admin@um.edu.my',
            password: 'Admin123',
        });
    });

    // UT-01-011: Verify Login Authentication Submission
    it('UT-01-011: submits login credentials to Supabase', async () => {
        const user = userEvent.setup();

        render(<Login />);

        await user.type(screen.getByPlaceholderText('admin@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Admin123');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'admin@um.edu.my',
            password: 'Admin123',
        });
    });

    // UT-01-012: Verify Successful Login Navigation
    it('UT-01-012: navigates to dashboard after successful authentication and authorization', async () => {
        const user = userEvent.setup();

        render(<Login />);

        await user.type(screen.getByPlaceholderText('admin@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Admin123');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        expect(mockRefreshUser).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    // UT-01-013: Verify Login Error Handling
    it('UT-01-013: displays an error when Supabase authentication fails', async () => {
        const user = userEvent.setup();

        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
        } as any);

        render(<Login />);

        await user.type(screen.getByPlaceholderText('admin@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'WrongPassword');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        expect(
            await screen.findByText('Invalid login credentials')
        ).toBeInTheDocument();

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // UT-01-014: Verify Login User Information Handling
    it('UT-01-014: displays an error when user information is unavailable', async () => {
        const user = userEvent.setup();

        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
            data: { user: null, session: null },
            error: null,
        } as any);

        render(<Login />);

        await user.type(screen.getByPlaceholderText('admin@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Admin123');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        expect(
            await screen.findByText('Unable to retrieve user information.')
        ).toBeInTheDocument();

        expect(mockRefreshUser).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // UT-01-021: Verify Login Password Visibility Toggle
    it('UT-01-021: toggles login password visibility', async () => {
        const user = userEvent.setup();

        render(<Login />);

        const passwordInput = screen.getByPlaceholderText('Enter your password');

        expect(passwordInput).toHaveAttribute('type', 'password');

        await user.click(screen.getByRole('button', { name: 'Show password' }));

        expect(passwordInput).toHaveAttribute('type', 'text');

        await user.click(screen.getByRole('button', { name: 'Hide password' }));

        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    // UT-01-022: Verify Remember Me Checkbox
    it('UT-01-022: allows users to select and deselect Remember Me', async () => {
        const user = userEvent.setup();

        render(<Login />);

        const rememberMeCheckbox = screen.getByRole('checkbox', {
            name: /remember me/i,
        });

        expect(rememberMeCheckbox).not.toBeChecked();

        await user.click(rememberMeCheckbox);

        expect(rememberMeCheckbox).toBeChecked();

        await user.click(rememberMeCheckbox);

        expect(rememberMeCheckbox).not.toBeChecked();
    });

    it('UT-01-025: navigates to the registration page', async () => {
        const user = userEvent.setup();
        render(<Login />);

        await user.click(screen.getByRole('button', { name: /register here/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    // Helper: Open Forgot Password Modal
    const openForgotPasswordModal = async (user: ReturnType<typeof userEvent.setup>) => {
        await user.click(screen.getByText(/forgot password/i));
    };

    // UT-01-003: Validate UM Email Domain for Password Reset
    it('UT-01-003: rejects email addresses outside UM domains', async () => {
        const user = userEvent.setup();

        render(<Login />);

        await openForgotPasswordModal(user);

        await user.type(
            screen.getByPlaceholderText('username@um.edu.my'),
            'admin@gmail.com'
        );

        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    // UT-01-015: Verify Password Reset Email Normalisation
    it('UT-01-015: converts password reset email to lowercase', async () => {
        const user = userEvent.setup();

        render(<Login />);

        await openForgotPasswordModal(user);

        await user.type(
            screen.getByPlaceholderText('username@um.edu.my'),
            'ADMIN@UM.EDU.MY'
        );

        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
                'admin@um.edu.my',
                expect.objectContaining({
                    redirectTo: expect.stringContaining('/reset-password'),
                })
            );
        });
    });

    // UT-01-016: Verify Password Reset Request Submission
    it('UT-01-016: submits a valid password reset request', async () => {
        const user = userEvent.setup();

        render(<Login />);

        await openForgotPasswordModal(user);

        await user.type(
            screen.getByPlaceholderText('username@um.edu.my'),
            'admin@um.edu.my'
        );

        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
        });
    });

    // UT-01-017: Verify Password Reset Error Handling
    it('UT-01-017: handles password reset request errors', async () => {
        const user = userEvent.setup();

        vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
            data: {},
            error: { message: 'Password reset failed' },
        } as any);

        render(<Login />);

        await openForgotPasswordModal(user);

        await user.type(
            screen.getByPlaceholderText('username@um.edu.my'),
            'admin@um.edu.my'
        );

        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        expect(await screen.findByText(/error|failed|unable/i)).toBeInTheDocument();
    });
    it('UT-01-018: allows another password reset request', async () => {
        const user = userEvent.setup();
        render(<Login />);

        // Open Forgot Password modal
        await user.click(screen.getByRole('button', { name: /forgot password/i }));

        // Enter registered UM email
        await user.type(
            screen.getByPlaceholderText('username@um.edu.my'),
            'admin@um.edu.my'
        );

        // Submit first request
        await user.click(screen.getByRole('button', { name: /send reset link/i }));

        // Verify successful request
        await waitFor(() => {
            expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
        });

        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
            'admin@um.edu.my',
            expect.objectContaining({
                redirectTo: expect.stringContaining('/reset-password'),
            })
        );

        // Resend the reset link
        await user.click(screen.getByRole('button', { name: /resend link/i }));

        // Verify second request
        await waitFor(() => {
            expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledTimes(2);
        });
    });

    it('UT-01-023: opens the forgot password modal', async () => {
        const user = userEvent.setup();
        render(<Login />);

        await user.click(screen.getByRole('button', { name: /forgot password/i }));

        expect(screen.getByText('Account Recovery Gateway')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('admin@um.edu.my')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('UT-01-024: closes the forgot password modal', async () => {
        const user = userEvent.setup();
        render(<Login />);

        await user.click(screen.getByRole('button', { name: /forgot password/i }));

        expect(screen.getByText('Account Recovery Gateway')).toBeInTheDocument();

        // Find the actual close button by its accessible name
        screen.debug();

    });
});
