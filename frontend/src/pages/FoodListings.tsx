import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Eye, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type StatusKey = 'available' | 'not_available' | 'inappropriate';

const statusStyles: Record<StatusKey, { bg: string; text: string; label: string }> = {
  available: { bg: '#E8F5E9', text: '#2E7D32', label: 'Available' },
  not_available: { bg: '#F5F5F5', text: '#9E9E9E', label: 'Unavailable' },
  inappropriate: { bg: '#FFEBEE', text: '#D32F2F', label: 'Banned' },
};

const fallbackStatusStyle = { bg: '#FFF3E0', text: '#E65100', label: 'Unknown' };

export function FoodListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch(`${API_BASE_URL}/food-listings`);
        if (!response.ok) throw new Error('Could not pull items from dashboard backend pipeline');

        const data = await response.json();
        setListings(data);
      } catch (error: any) {
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleRemoveListing = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this food listing? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/food-listings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server rejected operational purge request');
      }

      setListings((prevListings) => prevListings.filter((listing) => listing.id !== id));
      alert("Listing successfully deleted from the database.");
    } catch (err: any) {
      console.error("Critical failure during listing deletion routine:", err);
      alert(`Could not delete listing: ${err.message || "Database execution failure."}`);
    }
  };

  const handleHideListing = async (id: string, currentStatus: string, pickup_end: string, pax_remaining: number) => {
    const cleanStatus = currentStatus?.trim();
    const newStatus = cleanStatus === 'not_available' ? 'available' : 'not_available';
    const actionWord = newStatus === 'not_available' ? 'hide' : 'unhide';

    if (newStatus === 'available') {
      const paxRemaining = pax_remaining;
      const pickup_end_timestamp = new Date(pickup_end).getTime();

      if (Date.now() >= pickup_end_timestamp) {
        alert("⚠️ This listing cannot be unhidden because the pickup period has ended.");
        return;
      }

      if (paxRemaining <= 0) {
        alert("⚠️ This listing cannot be unhidden because all portions have been claimed.");
        return;
      }
    }

    if (window.confirm(`Are you absolutely sure you want to ${actionWord} this listing?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/food-listings/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Visibility update rejected by server.');
        }

        setListings(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        alert(`Listing successfully marked as ${newStatus}!`);
      } catch (error: any) {
        alert(`Could not update database: ${error.message}`);
      }
    }
  };

  const statusCounts = {
    all: listings.length,
    available: listings.filter(l => l.status === 'available').length,
    'not_available': listings.filter(l => l.status === 'not_available').length,
    'inappropriate': listings.filter(l => l.status === 'inappropriate').length,
  };

  const filteredListings = listings.filter((listing) => {
    const matchesStatus = selectedStatus === 'all' || listing.status === selectedStatus;
    const targetSearch = searchTerm.toLowerCase();
    const matchesSearch =
      (listing.event_name || '').toLowerCase().includes(targetSearch) ||
      (listing.food_type || '').toLowerCase().includes(targetSearch) ||
      (listing.pickup_location || '').toLowerCase().includes(targetSearch);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#212121]">Food Listings Monitor</h1>
        <p className="text-[#9E9E9E] mt-1">Monitor and manage all food sharing records in real-time</p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>Backend pipeline connection error: {errorMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
            <input
              type="text"
              placeholder="Search by event name, food type, or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-[#9E9E9E]" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
            >
              <option value="all">All Status ({statusCounts.all})</option>
              <option value="available">Available ({statusCounts.available})</option>
              <option value="not_available">Unavailable ({statusCounts.not_available})</option>
              <option value="inappropriate">Inappropriate ({statusCounts.inappropriate})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9E9E9E]">
          {loading ? "Refreshing listings..." : `Showing ${filteredListings.length} of ${listings.length} entries`}
        </p>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9FBF9]">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Event Name</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Provider</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Food Type</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Total Pax</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Remaining Pax</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Pickup Location</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Posted Time</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <AlertCircle className="mx-auto mb-2 text-[#9E9E9E]" size={48} />
                    <p className="text-[#9E9E9E]">No listings found</p>
                  </td>
                </tr>
              ) : (
                filteredListings.map((listing) => {
                  const status = statusStyles[listing.status as StatusKey] || fallbackStatusStyle;

                  const formattedDateTime = new Date(listing.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  return (
                    <tr key={listing.id} className="border-b border-gray-100 hover:bg-[#F9FBF9] transition-colors cursor-pointer transition-colors" onClick={() => navigate(`/food-listings/${listing.id}`)}>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-[#212121]">{listing.event_name}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#9E9E9E]">{listing.users?.name || 'Anonymous'}</td>
                      <td className="py-4 px-6 text-sm text-[#9E9E9E]">{listing.food_type}</td>
                      <td className="py-4 px-6 text-sm text-[#212121] font-medium">{listing.pax_total}</td>
                      <td className="py-4 px-6 text-sm text-[#212121]">{listing.pax_remaining}</td>
                      <td className="py-4 px-6">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium inline-block"
                          style={{ backgroundColor: status.bg, color: status.text }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#9E9E9E]">{listing.pickup_location}</td>
                      <td className="py-4 px-6 text-sm text-[#9E9E9E]">{formattedDateTime}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            title={listing.status === 'not_available' ? 'Unhide' : 'Hide'}
                            onClick={() => handleHideListing(listing.id, listing.status, listing.created_at, listing.pax_remaining)}
                            className={`p-2 rounded-lg transition-colors ${listing.status === 'not_available'
                              ? 'text-[#9E9E9E] bg-gray-100 hover:bg-gray-200'
                              : 'text-[#2E7D32] hover:bg-[#E8F5E9]'
                              }`}
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            title='Delete Permanently'
                            onClick={() => handleRemoveListing(listing.id)}
                            className="p-2 text-[#D32F2F] hover:bg-[#FFEBEE] rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}