import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { FoodListings } from '../pages/FoodListings';

// Mock navigation
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock date formatter
vi.mock('../utils/dateFormatter', () => ({
  formatDateTime: () => '15 Nov 2026, 10:00 AM',
}));

const mockListings = [
  {
    id: 'listing-1',
    event_name: 'Annual Meeting',
    food_type: 'Vegetarian',
    pax_total: 20,
    pax_remaining: 10,
    status: 'available',
    pickup_location: 'FSKTM',
    created_at: '2026-11-15T10:00:00Z',
    pickup_end: '2099-12-31T23:59:59Z',
    users: { name: 'Abigail' },
  },
  {
    id: 'listing-2',
    event_name: 'Club Gathering',
    food_type: 'Rice Meal',
    pax_total: 15,
    pax_remaining: 5,
    status: 'not_available',
    pickup_location: 'KK12',
    created_at: '2026-11-14T10:00:00Z',
    pickup_end: '2099-12-31T23:59:59Z',
    users: { name: 'John' },
  },
  {
    id: 'listing-3',
    event_name: 'Sports Day',
    food_type: 'Snacks',
    pax_total: 30,
    pax_remaining: 0,
    status: 'inappropriate',
    pickup_location: 'Sports Centre',
    created_at: '2026-11-13T10:00:00Z',
    pickup_end: '2099-12-31T23:59:59Z',
    users: { name: 'Mary' },
  },
  {
    id: 'listing-4',
    event_name: 'Faculty Event',
    food_type: 'Vegetarian',
    pax_total: 10,
    pax_remaining: 4,
    status: 'available',
    pickup_location: 'FSKTM',
    created_at: '2026-11-12T10:00:00Z',
    pickup_end: '2099-12-31T23:59:59Z',
    users: { name: 'David' },
  },
  {
    id: 'listing-5',
    event_name: 'Workshop',
    food_type: 'Rice Meal',
    pax_total: 12,
    pax_remaining: 8,
    status: 'not_available',
    pickup_location: 'Library',
    created_at: '2026-11-11T10:00:00Z',
    pickup_end: '2099-12-31T23:59:59Z',
    users: { name: 'Sarah' },
  },
];

const mockResponse = (
  data: any,
  ok = true,
) => ({
  ok,
  json: async () => data,
});

const getFetchMock = () => global.fetch as ReturnType<typeof vi.fn>;

const loadListings = () => {
  getFetchMock().mockResolvedValueOnce(mockResponse(mockListings));
  render(<FoodListings />);
};

describe('Food Listings Unit Testing', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => { });
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // UT-02-001
  describe('UT-02-001: Display Food Listings', () => {
    it('should display all food listing records in a responsive table', async () => {
      loadListings();

      expect(
        await screen.findByText('Annual Meeting'),
      ).toBeInTheDocument();

      expect(await screen.findAllByText('Club Gathering')).not.toHaveLength(0);
      expect(screen.getByText('Sports Day')).toBeInTheDocument();

      expect(screen.getByText('Abigail')).toBeInTheDocument();

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const scrollWrapper = table.parentElement;
      expect(scrollWrapper).toHaveClass('overflow-x-auto');
    });

    it('should display a loading indicator while retrieving records', async () => {
      let resolveFetch: (value: any) => void = () => { };

      getFetchMock().mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      );

      render(<FoodListings />);

      expect(
        screen.getByText('Refreshing listings...'),
      ).toBeInTheDocument();

      resolveFetch(mockResponse(mockListings));

      expect(
        await screen.findByText('Annual Meeting'),
      ).toBeInTheDocument();
    });

    it('should display an error message when the API request fails', async () => {
      getFetchMock().mockResolvedValueOnce(
        mockResponse({}, false),
      );

      render(<FoodListings />);

      await waitFor(() => {
        expect(getFetchMock()).toHaveBeenCalled();
      });

      console.log(getFetchMock().mock.calls);
      console.log(getFetchMock().mock.results);

      expect(
        await screen.findByText(/Backend pipeline connection error/i),
      ).toBeInTheDocument();
    });

    it('should display an empty state when no records are available', async () => {
      getFetchMock().mockResolvedValueOnce(
        mockResponse([]),
      );

      render(<FoodListings />);

      expect(
        await screen.findByText('No listings found'),
      ).toBeInTheDocument();

      expect(
        screen.getByText('Showing 0 of 0 entries'),
      ).toBeInTheDocument();
    });
  });

  // UT-02-002
  describe('UT-02-002: Verify Data Table Columns', () => {
    it('should display exactly nine specified table columns', async () => {
      loadListings();

      await screen.findByText('Annual Meeting');

      const expectedHeaders = [
        'Event Name',
        'Provider',
        'Food Type',
        'Total Pax',
        'Remaining Pax',
        'Status',
        'Pickup Location',
        'Posted Time',
        'Actions',
      ];

      const headers = screen.getAllByRole('columnheader');

      expect(headers).toHaveLength(9);

      expectedHeaders.forEach((header) => {
        expect(
          screen.getByRole('columnheader', { name: header }),
        ).toBeInTheDocument();
      });
    });
  });

  // UT-02-003
  describe('UT-02-003: Display Filtered and Total Entry Counts', () => {
    it('should display the correct filtered count against the total records', async () => {
      loadListings();

      await screen.findByText('Annual Meeting');

      const searchInput = screen.getByPlaceholderText(
        'Search by event name, food type, or location',
      );

      fireEvent.change(searchInput, {
        target: { value: 'Vegetarian' },
      });

      expect(
        screen.getByText('Showing 2 of 5 entries'),
      ).toBeInTheDocument();
    });
  });

  // UT-02-004
  // UT-02-004
  describe('UT-02-004: Search Food Listings', () => {
    it.each([
      ['Annual Meeting', 'Annual Meeting', 1],
      ['Vegetarian', 'Annual Meeting', 2],
      ['FSKTM', 'Annual Meeting', 2],
    ])(
      'should search food listings using the term "%s"',
      async (searchTerm, expectedResult, expectedCount) => {
        loadListings();

        await screen.findByText('Annual Meeting');

        const searchInput = screen.getByPlaceholderText(
          'Search by event name, food type, or location',
        );

        fireEvent.change(searchInput, {
          target: { value: searchTerm },
        });

        expect(
          screen.getByText(expectedResult),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            `Showing ${expectedCount} of 5 entries`,
          ),
        ).toBeInTheDocument();
      },
    );
  });

  // UT-02-005
  describe('UT-02-005: Filter Food Listings by Status', () => {
    it.each([
      ['available', 2],
      ['not_available', 2],
      ['inappropriate', 1],
      ['all', 5],
    ])(
      'should display the correct records for status "%s"',
      async (status, expectedCount) => {
        loadListings();

        await screen.findByText('Annual Meeting');

        const statusFilter = screen.getByRole('combobox');

        fireEvent.change(statusFilter, {
          target: { value: status },
        });

        const rows = screen.getAllByRole('row');

        // One row is the table header.
        expect(rows).toHaveLength(expectedCount + 1);
      },
    );
  });

  // UT-02-006
  describe('UT-02-006: Display Dynamic Status Counts', () => {
    it('should display the correct count beside each status option', async () => {
      loadListings();

      await screen.findByText('Annual Meeting');

      const statusFilter = screen.getByRole('combobox') as HTMLSelectElement;

      expect(statusFilter.options[0].text).toBe('All Status (5)');
      expect(statusFilter.options[1].text).toBe('Available (2)');
      expect(statusFilter.options[2].text).toBe('Unavailable (2)');
      expect(statusFilter.options[3].text).toBe('Inappropriate (1)');
    });
  });

  // UT-02-007
  describe('UT-02-007: Modify Food Listing Visibility', () => {
    it('should hide an available listing after confirmation', async () => {
      getFetchMock()
        .mockResolvedValueOnce(mockResponse(mockListings))
        .mockResolvedValueOnce(mockResponse({ status: 'not_available' }));

      render(<FoodListings />);

      const annualMeeting = await screen.findByText('Annual Meeting');
      const listingRow = annualMeeting.closest('tr');

      expect(listingRow).not.toBeNull();

      vi.mocked(window.confirm).mockReturnValue(true);

      fireEvent.click(
        within(listingRow!).getByTitle('Hide')
      );

      await waitFor(() => {
        expect(getFetchMock()).toHaveBeenCalledWith(
          expect.stringContaining('/food-listings/listing-1/status'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({
              status: 'not_available',
            }),
          }),
        );
      });

      await waitFor(() => {
        expect(
          within(listingRow!).getByTitle('Unhide'),
        ).toBeInTheDocument();
      });
    });

    it('should not hide a listing when the admin cancels confirmation', async () => {
      loadListings();

      const annualMeeting = await screen.findByText('Annual Meeting');
      const listingRow = annualMeeting.closest('tr');

      expect(listingRow).not.toBeNull();

      vi.mocked(window.confirm).mockReturnValue(false);

      fireEvent.click(
        within(listingRow!).getByTitle('Hide')
      );

      expect(getFetchMock()).toHaveBeenCalledTimes(1);
    });

    it('should prevent unhide when the pickup period has ended', async () => {
      const expiredListings = mockListings.map((listing) =>
        listing.id === 'listing-2'
          ? {
            ...listing,
            pickup_end: '2020-01-01T00:00:00Z',
          }
          : listing,
      );

      getFetchMock().mockResolvedValueOnce(
        mockResponse(expiredListings),
      );

      render(<FoodListings />);

      const clubGathering = await screen.findAllByText('Club Gathering');
      const listingRow = clubGathering[0].closest('tr');

      expect(listingRow).not.toBeNull();

      fireEvent.click(
        within(listingRow!).getByTitle('Unhide'),
      );

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('pickup period has ended'),
      );

      expect(getFetchMock()).toHaveBeenCalledTimes(1);
    });

    it('should prevent unhide when all portions have been claimed', async () => {
      const noPortionsListings = mockListings.map((listing) =>
        listing.id === 'listing-2'
          ? { ...listing, pax_remaining: 0 }
          : listing,
      );

      getFetchMock().mockResolvedValueOnce(
        mockResponse(noPortionsListings),
      );

      render(<FoodListings />);

      const clubGathering = await screen.findAllByText('Club Gathering');
      const listingRow = clubGathering[0].closest('tr');

      expect(listingRow).not.toBeNull();

      fireEvent.click(
        within(listingRow!).getByTitle('Unhide'),
      );

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('all portions have been claimed'),
      );

      expect(getFetchMock()).toHaveBeenCalledTimes(1);
    });

    it('should display an error when the visibility update fails', async () => {
      getFetchMock()
        .mockResolvedValueOnce(mockResponse(mockListings))
        .mockResolvedValueOnce(
          mockResponse({ error: 'Update failed' }, false),
        );

      render(<FoodListings />);

      await waitFor(() => {
        expect(getFetchMock()).toHaveBeenCalledTimes(1);
      });

      const annualMeeting = await screen.findAllByText('Annual Meeting');
      const listingRow = annualMeeting[0].closest('tr');

      expect(listingRow).not.toBeNull();

      fireEvent.click(
        within(listingRow!).getByTitle('Hide'),
      );

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Update failed'),
        );
      });

      expect(
        within(listingRow!).getByTitle('Hide'),
      ).toBeInTheDocument();
    });

    it('should prevent unhide when all portions have been claimed', async () => {
      const noPortionsListings = mockListings.map((listing) =>
        listing.id === 'listing-2'
          ? { ...listing, pax_remaining: 0 }
          : listing,
      );

      getFetchMock().mockResolvedValueOnce(
        mockResponse(noPortionsListings),
      );

      render(<FoodListings />);

      const clubGathering = await screen.findAllByText('Club Gathering');
      const listingRow = clubGathering[0].closest('tr');

      expect(listingRow).not.toBeNull();

      fireEvent.click(
        within(listingRow!).getByTitle('Unhide'),
      );

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('all portions have been claimed'),
      );

      expect(getFetchMock()).toHaveBeenCalledTimes(1);
    });

    it('should display an error when the visibility update fails', async () => {
      getFetchMock()
        .mockResolvedValueOnce(mockResponse(mockListings))
        .mockResolvedValueOnce(
          mockResponse({ error: 'Update failed' }, false),
        );

      render(<FoodListings />);

      await waitFor(() => {
        expect(getFetchMock()).toHaveBeenCalledTimes(1);
      });

      expect(await screen.findAllByText('Annual Meeting')).not.toHaveLength(0);

      const listingRows = screen.getAllByText('Annual Meeting');
      const listingRow = listingRows[0].closest('tr');

      expect(listingRow).not.toBeNull();

      fireEvent.click(
        within(listingRow!).getByTitle('Hide')
      );

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Update failed'),
        );
      });

      expect(
        within(listingRow!).getByTitle('Hide'),
      ).toBeInTheDocument();
    });
  });

  // UT-02-008
  describe('UT-02-008: Permanently Delete Food Listing', () => {
    it('should delete a listing after confirmation', async () => {
      getFetchMock()
        .mockResolvedValueOnce(mockResponse(mockListings))
        .mockResolvedValueOnce(mockResponse({}));

      render(<FoodListings />);

      // Wait until all 5 listings are loaded
      await waitFor(() => {
        expect(screen.getAllByTitle('Delete Permanently')).toHaveLength(5);
      });

      // Click the first listing's Delete button (listing-1)
      fireEvent.click(screen.getAllByTitle('Delete Permanently')[0]);

      // Verify DELETE request
      await waitFor(() => {
        expect(getFetchMock()).toHaveBeenCalledWith(
          expect.stringContaining('/food-listings/listing-1'),
          expect.objectContaining({
            method: 'DELETE',
          }),
        );
      });

      // Verify one listing has been removed
      await waitFor(() => {
        expect(screen.getAllByTitle('Delete Permanently')).toHaveLength(4);
      });

      expect(window.alert).toHaveBeenCalledWith(
        'Listing successfully deleted from the database.',
      );
    });

    it('should not delete a listing when the admin cancels confirmation', async () => {
      loadListings();

      expect(await screen.findAllByText('Annual Meeting')).not.toHaveLength(0);
      vi.mocked(window.confirm).mockReturnValue(false);

      fireEvent.click(screen.getAllByTitle('Delete Permanently')[0]);

      // Only the initial GET request should be called.
      expect(getFetchMock()).toHaveBeenCalledTimes(1);

      // The listing should remain in the table.
      expect(
        screen.getAllByText('Annual Meeting').length,
      ).toBeGreaterThan(0);
    });

    it('should display an error when the deletion request fails', async () => {
      loadListings();

      await screen.findAllByText('Annual Meeting');

      vi.mocked(window.confirm).mockReturnValue(true);

      getFetchMock().mockResolvedValueOnce(
        mockResponse({ error: 'Deletion failed' }, false)
      );

      fireEvent.click(screen.getAllByTitle('Delete Permanently')[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Could not delete listing')
        );
      });

      // Listing should remain because deletion failed.
      expect(screen.getAllByText('Annual Meeting').length).toBeGreaterThan(0);
    });
  });
});
