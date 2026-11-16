
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
});
