
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Layout } from '../../components/Layout';

// Mock functions
const { mockNavigate, mockLogout } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockLogout: vi.fn(),
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: '/dashboard' }),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
    Outlet: () => <div>Page Content</div>,
}));

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 'test-admin-id',
            name: 'Test Admin',
            email: 'admin@um.edu.my',
            role: 'admin',
            status: 'approved',
        },
        logout: mockLogout,
    }),
}));

describe('Sign Out Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLogout.mockResolvedValue(undefined);
    });

    afterEach(() => {
        cleanup();
    });

    // UT-01-004: Verify Admin Sign Out
    it('UT-01-004: signs out the admin and redirects to login', async () => {
        const user = userEvent.setup();

        render(<Layout />);

        // Open confirmation modal
        await user.click(screen.getByRole('button', { name: 'Sign Out' }));

        // Confirm sign out
        const signOutButtons = screen.getAllByRole('button', { name: 'Sign Out' });
        await user.click(signOutButtons[1]);

        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
        });
    });

    // UT-01-029: Verify Sign-Out Confirmation Modal Display
    it('UT-01-029: displays the sign-out confirmation modal', async () => {
        const user = userEvent.setup();

        render(<Layout />);

        await user.click(screen.getByRole('button', { name: 'Sign Out' }));

        expect(screen.getByText('Are you sure you want to log out? Any unsaved changes on your active forms will be lost.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    // UT-01-030: Verify Modal Closes on Cancel
    it('UT-01-030: closes the confirmation modal when Cancel is clicked', async () => {
        const user = userEvent.setup();

        render(<Layout />);

        await user.click(screen.getByRole('button', { name: 'Sign Out' }));
        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByText(/Are you sure you want to log out/)).not.toBeInTheDocument();
    });

    // UT-01-031: Verify Logout Is Not Called on Cancel
    it('UT-01-031: does not execute logout when Cancel is clicked', async () => {
        const user = userEvent.setup();

        render(<Layout />);

        await user.click(screen.getByRole('button', { name: 'Sign Out' }));
        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(mockLogout).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // UT-01-032: Verify Sign-Out Buttons Are Disabled During Logout
    it('UT-01-032: disables confirmation buttons while logout is in progress', async () => {
        const user = userEvent.setup();

        let resolveLogout!: () => void;

        mockLogout.mockImplementation(
            () => new Promise<void>((resolve) => {
                resolveLogout = resolve;
            })
        );

        render(<Layout />);

        await user.click(screen.getByRole('button', { name: 'Sign Out' }));

        const signOutButtons = screen.getAllByRole('button', { name: 'Sign Out' });
        await user.click(signOutButtons[1]);

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Leaving/i })).toBeDisabled();

        resolveLogout();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
        });
    });

    // UT-01-033: Verify Loading Text During Logout
    it('UT-01-033: displays Leaving text while logout is in progress', async () => {
        const user = userEvent.setup();

        let resolveLogout!: () => void;

        mockLogout.mockImplementation(
            () => new Promise<void>((resolve) => {
                resolveLogout = resolve;
            })
        );

        render(<Layout />);

        await user.click(screen.getByRole('button', { name: 'Sign Out' }));

        const signOutButtons = screen.getAllByRole('button', { name: 'Sign Out' });
        await user.click(signOutButtons[1]);

        expect(screen.getByText('Leaving...')).toBeInTheDocument();

        resolveLogout();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });
});
