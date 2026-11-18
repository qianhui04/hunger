
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { LocationActivity } from '../pages/LocationActivity';

// Mock Leaflet map methods
const { mockMap } = vi.hoisted(() => ({
    mockMap: {
        invalidateSize: vi.fn(),
        fitBounds: vi.fn(),
        setView: vi.fn(),
    },
}));

// Mock Leaflet
vi.mock('leaflet', () => ({
    default: {
        Icon: {
            Default: {
                prototype: {},
                mergeOptions: vi.fn(),
            },
        },
        latLngBounds: vi.fn((coordinates) => ({ coordinates })),
    },
}));

// Mock React Leaflet components
vi.mock('react-leaflet', async () => {
    const React = await import('react');

    return {
        MapContainer: ({ children }: any) =>
            React.createElement('div', { 'data-testid': 'map-container' }, children),

        TileLayer: () => null,

        Marker: ({ children }: any) =>
            React.createElement('div', { 'data-testid': 'map-marker' }, children),

        CircleMarker: ({ radius, pathOptions }: any) =>
            React.createElement('div', {
                'data-testid': 'circle-marker',
                'data-radius': radius,
                'data-color': pathOptions.color,
            }),

        Tooltip: ({ children }: any) =>
            React.createElement('div', { 'data-testid': 'map-tooltip' }, children),

        useMap: () => mockMap,
    };
});

interface MockLocation {
    id: string;
    event_name: string;
    location: string;
    pax_total: number;
    pax_remaining: number;
    pax_reserved: number;
    pax_collected: number;
    reservation_rate: number;
    fulfillment_rate: number;
    lat: number | null;
    lng: number | null;
    color: string;
    status: string;
}

const mockLocations: MockLocation[] = [
    {
        id: '1',
        event_name: 'Food Sharing Event A',
        location: 'FSKTM',
        pax_total: 40,
        pax_remaining: 10,
        pax_reserved: 30,
        pax_collected: 32,
        reservation_rate: 75,
        fulfillment_rate: 80,
        lat: 3.1300,
        lng: 101.6500,
        color: '',
        status: 'available',
    },
    {
        id: '2',
        event_name: 'Food Sharing Event B',
        location: 'KK12',
        pax_total: 20,
        pax_remaining: 15,
        pax_reserved: 10,
        pax_collected: 10,
        reservation_rate: 50,
        fulfillment_rate: 50,
        lat: 3.1200,
        lng: 101.6600,
        color: '',
        status: 'not_available',
    },
    {
        id: '3',
        event_name: 'Food Sharing Event C',
        location: 'Library',
        pax_total: 80,
        pax_remaining: 5,
        pax_reserved: 70,
        pax_collected: 20,
        reservation_rate: 87.5,
        fulfillment_rate: 25,
        lat: 3.1400,
        lng: 101.6700,
        color: '',
        status: 'suspended',
    },
];

const mockMetrics = {
    availableEvent: 3,
    totalPaxDistributed: 62,
    avgFulfillmentRate: 51.67,
    avgReservationRate: 70.83,
};

const mockApiResponse = {
    locations: mockLocations,
    metrics: mockMetrics,
};

function mockFetch(data = mockApiResponse) {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
            ok: true,
            json: async () => data,
        })
    );
}

async function renderLoadedPage() {
    mockFetch();

    render(<LocationActivity />);

    await screen.findAllByText('Food Sharing Event A');

    return true;
}

describe('Location Activity Monitoring Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    // UT-04-001: Display Overview Cards
    it('UT-04-001 - should display location monitoring overview cards', async () => {
        await renderLoadedPage();

        expect(screen.getByText('Active Listings')).toBeInTheDocument();
        expect(screen.getByText('Avg. Reservation Rate')).toBeInTheDocument();
        expect(screen.getByText('Avg. Pickup Rate')).toBeInTheDocument();
        expect(screen.getByText('Total Pax Distributed')).toBeInTheDocument();

        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('70.83%')).toBeInTheDocument();
        expect(screen.getByText('51.67%')).toBeInTheDocument();
        expect(screen.getByText('62')).toBeInTheDocument();
    });

    // UT-04-002: Search by Event Name or Location
    it('UT-04-002 - should search locations by event name or location', async () => {
        await renderLoadedPage();

        const searchInputs = screen.getAllByPlaceholderText(
            /search event name or location/i
        );

        const searchInput = searchInputs[0];

        // Search by location
        fireEvent.change(searchInput, {
            target: { value: 'FSKTM' },
        });

        expect(
            screen.getAllByText('Food Sharing Event A').length
        ).toBeGreaterThan(0);

        expect(
            screen.queryByText('Food Sharing Event B')
        ).not.toBeInTheDocument();

        // Search by event name
        fireEvent.change(searchInput, {
            target: { value: 'event b' },
        });

        expect(
            screen.getAllByText('Food Sharing Event B').length
        ).toBeGreaterThan(0);

        expect(
            screen.queryByText('Food Sharing Event A')
        ).not.toBeInTheDocument();
    });

    // UT-04-004: Display Location Tracking Table
    it('UT-04-004 - should display all six location table columns', async () => {
        await renderLoadedPage();

        expect(screen.getByText('Event Information')).toBeInTheDocument();
        expect(screen.getByText('Distribution Location')).toBeInTheDocument();
        expect(screen.getByText('Total Pax')).toBeInTheDocument();
        expect(screen.getByText('Remaining Pax')).toBeInTheDocument();
        expect(screen.getByText('Reservation Rate')).toBeInTheDocument();
        expect(screen.getByText('Fulfillment Rate')).toBeInTheDocument();

        expect(screen.getByText('30 Claims')).toBeInTheDocument();
        expect(screen.getByText('32 Checked In')).toBeInTheDocument();
    });

    // UT-04-005: High Fulfillment Filter
    it('UT-04-005 - should display only locations with fulfillment rate of 70% or above', async () => {
        await renderLoadedPage();

        fireEvent.click(
            screen.getByRole('button', { name: /high fulfillment/i })
        );

        expect(screen.getAllByText('Food Sharing Event A').length).toBeGreaterThan(0);
        expect(screen.queryByText('Food Sharing Event B')).not.toBeInTheDocument();
        expect(screen.queryByText('Food Sharing Event C')).not.toBeInTheDocument();
    });

    // UT-04-005: Low Fulfillment Filter
    it('UT-04-005 - should display only locations with fulfillment rate below 70%', async () => {
        await renderLoadedPage();

        fireEvent.click(
            screen.getByRole('button', { name: /low fulfillment/i })
        );

        expect(screen.queryByText('Food Sharing Event A')).not.toBeInTheDocument();
        expect(screen.getAllByText('Food Sharing Event B').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Food Sharing Event C').length).toBeGreaterThan(0);
    });

    // UT-04-006: Automatically Adjust GIS Map View
    it('UT-04-006 - should automatically fit the map to valid location coordinates', async () => {
        await renderLoadedPage();

        await waitFor(() => {
            expect(mockMap.fitBounds).toHaveBeenCalled();
        });
    });

    // UT-04-007: Proportional Circle Markers
    it('UT-04-007 - should display circle markers with proportional radius', async () => {
        const { getAllByTestId } = render(<LocationActivity />);
        mockFetch();

        await screen.findAllByText('Food Sharing Event A');

        const markers = getAllByTestId('circle-marker');

        expect(markers).toHaveLength(3);

        // pax_total = 40 => radius = 20
        expect(markers[0]).toHaveAttribute('data-radius', '20');

        // pax_total = 20 => radius = 15 (minimum)
        expect(markers[1]).toHaveAttribute('data-radius', '15');

        // pax_total = 80 => radius = 35 (maximum)
        expect(markers[2]).toHaveAttribute('data-radius', '35');
    });

    // UT-04-008: Dynamic Marker Colours
    it('UT-04-008 - should assign marker colours according to fulfillment rate', async () => {
        mockFetch();

        const { getAllByTestId } = render(<LocationActivity />);

        await screen.findAllByText('Food Sharing Event A');

        const markers = getAllByTestId('circle-marker');

        expect(markers[0]).toHaveAttribute('data-color', '#16A34A');
        expect(markers[1]).toHaveAttribute('data-color', '#EAB308');
        expect(markers[2]).toHaveAttribute('data-color', '#DC2626');
    });

    // UT-04-009: Display Location Information on Map Hover
    it('UT-04-009 - should display location information in map tooltips', async () => {
        await renderLoadedPage();

        expect(screen.getAllByTestId('map-tooltip').length).toBeGreaterThan(0);

        expect(screen.getAllByText('Food Sharing Event A').length).toBeGreaterThan(0);
        expect(screen.getAllByText('FSKTM').length).toBeGreaterThan(0);
        expect(screen.getAllByText('3.1300, 101.6500').length).toBeGreaterThan(0);
    });

    // UT-04-010: Loading Indicator
    it('UT-04-010 - should display a loading indicator while retrieving analytics', () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => new Promise(() => { }))
        );

        render(<LocationActivity />);

        expect(
            screen.getByText('Compiling Live Metrics...')
        ).toBeInTheDocument();
    });

    // UT-04-011: Empty Search Results
    it('UT-04-011 - should display an empty state when no locations match the search', async () => {
        await renderLoadedPage();

        const searchInputs = screen.getAllByPlaceholderText(
            /search event name or location/i
        );

        fireEvent.change(searchInputs[0], {
            target: { value: 'NoMatchingLocation' },
        });

        expect(
            await screen.findByText(/no listings found/i)
        ).toBeInTheDocument();
    });

    it('UT-04-012 - should display reservation and fulfillment details in map tooltips', async () => {
        await renderLoadedPage();

        expect(
            screen.getAllByText(/30 Claimed/).length
        ).toBeGreaterThan(0);

        expect(
            screen.getAllByText(/32 Checked In/).length
        ).toBeGreaterThan(0);

        expect(
            screen.getAllByText(/10 \/ 40 Packs Left/).length
        ).toBeGreaterThan(0);
    });

    // UT-04-013: Responsive Layout
    it('UT-04-013 - should apply responsive layout classes to overview cards', async () => {
        await renderLoadedPage();

        const activeListings = screen.getByText('Active Listings');

        const responsiveGrid = activeListings.parentElement?.parentElement
            ?.parentElement;

        expect(responsiveGrid).toBeTruthy();

        expect(responsiveGrid).toHaveClass(
            'grid',
            'grid-cols-1',
            'sm:grid-cols-2',
            'lg:grid-cols-4',
            'gap-4'
        );
    });

    // UT-04-014: Default Map View
    it('UT-04-014 - should use the default UM map center when no valid coordinates exist', async () => {
        const invalidLocationData = {
            locations: [
                {
                    ...mockLocations[0],
                    lat: null,
                    lng: null,
                },
            ],
            metrics: mockMetrics,
        };

        mockFetch(invalidLocationData);

        render(<LocationActivity />);

        await screen.findAllByText('Food Sharing Event A');

        await waitFor(() => {
            expect(mockMap.setView).toHaveBeenCalledWith(
                [3.1254, 101.6542],
                14
            );
        });
    });
});
