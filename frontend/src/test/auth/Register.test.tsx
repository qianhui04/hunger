
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Register } from '../../pages/Register';
import { supabase } from '../../lib/supabaseClient';

// Mock Supabase to prevent real account registration
vi.mock('../../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            signUp: vi.fn(),
        },
    },
}));

// Mock navigation
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

describe('Registration Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(supabase.auth.signUp).mockResolvedValue({
            data: {
                user: { id: 'test-user-id' },
                session: null,
            },
            error: null,
        } as any);

        vi.stubGlobal('alert', vi.fn());
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    // UT-01-001: Validate UM Email Domain
    it('UT-01-001: accepts valid UM email domains', async () => {
        const user = userEvent.setup();

        render(<Register />);

        await user.type(
            screen.getByPlaceholderText('Enter your full name'),
            'Test Admin'
        );

        await user.type(
            screen.getByPlaceholderText('your.name@um.edu.my'),
            'admin@um.edu.my'
        );

        await user.type(
            screen.getByPlaceholderText('e.g., S12345678'),
            'S12345678'
        );

        await user.type(
            screen.getByPlaceholderText('Create a strong password'),
            'Admin123'
        );

        await user.type(
            screen.getByPlaceholderText('Re-enter your password'),
            'Admin123'
        );

        await user.click(screen.getByRole('checkbox'));

        await user.click(
            screen.getByRole('button', { name: 'Create Account' })
        );

        expect(supabase.auth.signUp).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'admin@um.edu.my',
            })
        );

        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('UT-01-001: accepts @siswa.um.edu.my email domain', async () => {
        const user = userEvent.setup();

        render(<Register />);

        await user.type(
            screen.getByPlaceholderText('Enter your full name'),
            'Test Admin'
        );

        await user.type(
            screen.getByPlaceholderText('your.name@um.edu.my'),
            'admin@siswa.um.edu.my'
        );

        await user.type(
            screen.getByPlaceholderText('e.g., S12345678'),
            'S12345678'
        );

        await user.type(
            screen.getByPlaceholderText('Create a strong password'),
            'Admin123'
        );

        await user.type(
            screen.getByPlaceholderText('Re-enter your password'),
            'Admin123'
        );

        await user.click(screen.getByRole('checkbox'));

        await user.click(
            screen.getByRole('button', { name: 'Create Account' })
        );

        expect(supabase.auth.signUp).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'admin@siswa.um.edu.my',
            })
        );
    });

    it('UT-01-001: rejects email addresses outside UM domains', async () => {
        const user = userEvent.setup();

        render(<Register />);

        await user.type(
            screen.getByPlaceholderText('Enter your full name'),
            'Test Admin'
        );

        await user.type(
            screen.getByPlaceholderText('your.name@um.edu.my'),
            'admin@gmail.com'
        );

        await user.type(
            screen.getByPlaceholderText('e.g., S12345678'),
            'S12345678'
        );

        await user.type(
            screen.getByPlaceholderText('Create a strong password'),
            'Admin123'
        );

        await user.type(
            screen.getByPlaceholderText('Re-enter your password'),
            'Admin123'
        );

        await user.click(screen.getByRole('checkbox'));

        await user.click(
            screen.getByRole('button', { name: 'Create Account' })
        );

        expect(
            screen.getByText(
                'Please use your official UM email address (@um.edu.my OR @siswa.um.edu.my)'
            )
        ).toBeInTheDocument();

        expect(supabase.auth.signUp).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // UT-01-005: Validate Required Registration Fields
    it('UT-01-005: prevents registration when required fields are empty', async () => {
        const user = userEvent.setup();

        render(<Register />);

        // Fill in all fields except Full Name
        await user.type(
            screen.getByPlaceholderText('your.name@um.edu.my'),
            'admin@um.edu.my'
        );
        await user.type(
            screen.getByPlaceholderText('e.g., S12345678'),
            'S12345678'
        );
        await user.type(
            screen.getByPlaceholderText('Create a strong password'),
            'Admin123'
        );
        await user.type(
            screen.getByPlaceholderText('Re-enter your password'),
            'Admin123'
        );

        await user.click(screen.getByRole('checkbox'));

        // Attempt to submit
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        // Registration should not be submitted
        expect(supabase.auth.signUp).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('UT-01-006: rejects passwords that do not meet the required structure', async () => {
        const user = userEvent.setup();

        render(<Register />);

        await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test Admin');
        await user.type(screen.getByPlaceholderText('your.name@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('e.g., S12345678'), 'S12345678');

        // Password has no uppercase letter
        await user.type(screen.getByPlaceholderText('Create a strong password'), 'admin123');
        await user.type(screen.getByPlaceholderText('Re-enter your password'), 'admin123');

        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(
            screen.getByText(/Password must be at least 8 characters long/)
        ).toBeInTheDocument();

        expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('UT-01-007: rejects registration when passwords do not match', async () => {
        const user = userEvent.setup();

        render(<Register />);

        await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test Admin');
        await user.type(screen.getByPlaceholderText('your.name@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('e.g., S12345678'), 'S12345678');

        await user.type(screen.getByPlaceholderText('Create a strong password'), 'Admin123');
        await user.type(screen.getByPlaceholderText('Re-enter your password'), 'Admin456');

        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

        expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('UT-01-008: prevents registration when terms and conditions are not accepted', async () => {
        const user = userEvent.setup();

        render(<Register />);

        await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test Admin');
        await user.type(screen.getByPlaceholderText('your.name@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('e.g., S12345678'), 'S12345678');

        await user.type(screen.getByPlaceholderText('Create a strong password'), 'Admin123');
        await user.type(screen.getByPlaceholderText('Re-enter your password'), 'Admin123');

        // Do not click the agreement checkbox
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(
            screen.getByText('Please agree to the terms and conditions')
        ).toBeInTheDocument();

        expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('UT-01-009: submits valid registration details successfully', async () => {
        const user = userEvent.setup();

        render(<Register />);

        await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test Admin');
        await user.type(screen.getByPlaceholderText('your.name@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('e.g., S12345678'), 'S12345678');

        await user.type(screen.getByPlaceholderText('Create a strong password'), 'Admin123');
        await user.type(screen.getByPlaceholderText('Re-enter your password'), 'Admin123');

        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(supabase.auth.signUp).toHaveBeenCalledWith({
            email: 'admin@um.edu.my',
            password: 'Admin123',
            options: {
                data: {
                    name: 'Test Admin',
                    studentId: 'S12345678',
                },
            },
        });

        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    // UT-01-019: Verify Registration Password Visibility Toggle
    it('UT-01-019: toggles registration password visibility', async () => {
        const user = userEvent.setup();

        render(<Register />);

        const passwordInput = screen.getByPlaceholderText('Create a strong password');

        // Password should initially be hidden
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Click the visibility toggle
        await user.click(screen.getAllByRole('button', { name: 'Show password' })[0]);

        // Password should become visible
        expect(passwordInput).toHaveAttribute('type', 'text');

        // Hide the password again
        await user.click(screen.getByRole('button', { name: 'Hide password' }));

        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('UT-01-026: navigates to the login page', async () => {
        const user = userEvent.setup();
        render(<Register />);

        await user.click(screen.getByRole('button', { name: /sign in here/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    // UT-01-027: Verify Registration Error Handling
    it('UT-01-027: displays an error when Supabase registration fails', async () => {
        const user = userEvent.setup();

        vi.mocked(supabase.auth.signUp).mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'User already registered' },
        } as any);

        render(<Register />);

        await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test Admin');
        await user.type(screen.getByPlaceholderText('your.name@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('e.g., S12345678'), 'S12345678');
        await user.type(screen.getByPlaceholderText('Create a strong password'), 'Admin123');
        await user.type(screen.getByPlaceholderText('Re-enter your password'), 'Admin123');

        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(await screen.findByText('User already registered')).toBeInTheDocument();
        expect(supabase.auth.signUp).toHaveBeenCalledTimes(1);
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Create Account' })).toBeEnabled();
    });

    // UT-01-028: Verify Registration Response Without User Object
    it('UT-01-028: displays an error when Supabase returns no user object', async () => {
        const user = userEvent.setup();

        vi.mocked(supabase.auth.signUp).mockResolvedValue({
            data: { user: null, session: null },
            error: null,
        } as any);

        render(<Register />);

        await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test Admin');
        await user.type(screen.getByPlaceholderText('your.name@um.edu.my'), 'admin@um.edu.my');
        await user.type(screen.getByPlaceholderText('e.g., S12345678'), 'S12345678');
        await user.type(screen.getByPlaceholderText('Create a strong password'), 'Admin123');
        await user.type(screen.getByPlaceholderText('Re-enter your password'), 'Admin123');

        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(await screen.findByText('Unable to create user account.')).toBeInTheDocument();
        expect(supabase.auth.signUp).toHaveBeenCalledTimes(1);
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Create Account' })).toBeEnabled();
    });

});
