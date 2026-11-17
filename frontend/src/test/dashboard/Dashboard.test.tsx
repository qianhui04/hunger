
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    render,
    screen,
    waitFor,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import { Dashboard } from '../../pages/Dashboard';
import { formatTime } from '@/utils/dateFormatter';

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ data, children }: any) => (
        <div data-testid="bar-chart">
            {JSON.stringify(data)}
            {children}
        </div>
    ),
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: ({ data, children }: any) => (
        <div data-testid="pie-chart">
            {JSON.stringify(data)}
            {children}
        </div>
    ),
    Cell: () => null,
    Legend: () => null,
    LabelList: () => null,
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

const mockDashboardData = {
    stats: {
        total_listings: 25,
        pax_distributed: 150,
        food_saved: 60,
        total_users: 80,
        active_listings: 5,
        available_pax: 20,
        expiring_soon: 0,
        expiring_soon_listings: [],
    },

    chartData: {
        weeklyActivity: [
            { name: 'Mon', value: 5 },
            { name: 'Tue', value: 8 },
        ],

        foodTypeDistribution: [
            { name: 'Rice', value: 60 },
            { name: 'Vegetables', value: 40 },
        ],

        locationActivity: [
            { name: 'FSKTM', value: 8 },
            { name: 'KK12', value: 5 },
        ],
    },

    matrixData: [
        {
            day: 'Monday',
            '08:00': 20,
            '12:00': 60,
            '17:00': 85,
        },
    ],

    todayListings: [
        {
            id: 'listing-001',
            event_name: 'Club Meeting',
            food_type: 'Rice',
            pax_total: 30,
            pax_remaining: 10,
            status: 'available',
            pickup_location: 'FSKTM, Universiti Malaya',
            pickup_start: '2026-11-15T10:00:00',
        },
    ],
};

beforeEach(() => {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockDashboardData,
        })
    );
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

// FR-10: Weekly Food Distribution Chart
describe('Dashboard - FR-10 Weekly Food Distribution', () => {
    it('UT-02-005: displays the weekly food distribution chart', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
        });

        const charts = screen.getAllByTestId('bar-chart');

        expect(charts[0]).toHaveTextContent('"name":"Mon"');
        expect(charts[0]).toHaveTextContent('"name":"Tue"');
    });
});

// FR-11: Weekly Chart Tooltip
describe('Dashboard - FR-11 Chart Tooltip', () => {
    it('UT-02-006: renders the weekly chart for displaying data details', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(
                screen.getByText('Weekly Food Distribution')
            ).toBeInTheDocument();
        });
        const charts = screen.getAllByTestId('bar-chart');

        expect(charts[0]).toHaveTextContent('"name":"Mon"');
    });
});

// FR-12: Food Type Distribution
// FR-12: Food Type Distribution
describe('Dashboard - FR-12 Food Type Distribution', () => {
    it('UT-02-007: displays the food type distribution chart', async () => {
        render(<Dashboard />);

        const chart = await screen.findByTestId('pie-chart');

        expect(chart).toHaveTextContent('"name":"Rice"');
        expect(chart).toHaveTextContent('"value":60');
        expect(chart).toHaveTextContent('"name":"Vegetables"');
        expect(chart).toHaveTextContent('"value":40');
    });

    it('UT-02-008: displays an empty message when no food categories are available', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    ...mockDashboardData,
                    chartData: {
                        ...mockDashboardData.chartData,
                        foodTypeDistribution: [],
                    },
                }),
            })
        );

        render(<Dashboard />);

        await waitFor(() => {
            expect(
                screen.getByText('No category entries tracked this week')
            ).toBeInTheDocument();
        });
    });
});

// FR-13: Most Active Locations
describe('Dashboard - FR-13 Location Activity', () => {
    it('UT-02-009: displays the most active locations chart', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(
                screen.getByText('Most Active Locations')
            ).toBeInTheDocument();
        });

        const charts = screen.getAllByTestId('bar-chart');

        expect(charts[1]).toHaveTextContent('"name":"KK12"');
        expect(charts[1]).toHaveTextContent('"value":5');
    });

    it('UT-02-010: displays an empty message when no location data is available', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    ...mockDashboardData,
                    chartData: {
                        ...mockDashboardData.chartData,
                        locationActivity: [],
                    },
                }),
            })
        );

        render(<Dashboard />);

        await waitFor(() => {
            expect(
                screen.getByText('No listings positions tracked this week')
            ).toBeInTheDocument();
        });
    });
});

// FR-14: Today's Active Listings
describe("Dashboard - FR-14 Today's Active Listings", () => {
    it('UT-02-011: displays today active food listings', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Club Meeting')).toBeInTheDocument();
        });

        expect(screen.getByText('Rice')).toBeInTheDocument();
        expect(screen.getByText('30 portions')).toBeInTheDocument();
        expect(screen.getByText('10 left')).toBeInTheDocument();
    });
});

// FR-15: Listing Table Information
describe('Dashboard - FR-15 Listing Table Information', () => {
    it('UT-02-012: displays the required listing table columns and pickup start', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Club Meeting')).toBeInTheDocument();
        });

        expect(screen.getByText('Event')).toBeInTheDocument();
        expect(screen.getByText('Food Type')).toBeInTheDocument();
        expect(screen.getByText('Total Pax')).toBeInTheDocument();
        expect(screen.getByText('Remaining')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Pickup Start')).toBeInTheDocument();

        expect(
            screen.getByText(formatTime('2026-11-15T10:00:00'))
        ).toBeInTheDocument();
    });
});

// FR-16: Listing Status Display
describe('Dashboard - FR-16 Listing Status', () => {
    it('UT-02-013: displays the correct status label for a food listing', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Available')).toBeInTheDocument();
        });
    });

    it('UT-02-014: displays the not available status correctly', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    ...mockDashboardData,
                    todayListings: [
                        {
                            ...mockDashboardData.todayListings[0],
                            status: 'not_available',
                        },
                    ],
                }),
            })
        );

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Not Available')).toBeInTheDocument();
        });
    });
});

// FR-17: Empty Today's Listings
describe('Dashboard - FR-17 Empty State', () => {
    it('UT-02-015: displays a message when there are no active food listings today', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    ...mockDashboardData,
                    todayListings: [],
                }),
            })
        );

        render(<Dashboard />);

        await waitFor(() => {
            expect(
                screen.getByText(
                    'No active food distributions posted yet today.'
                )
            ).toBeInTheDocument();
        });
    });
});
