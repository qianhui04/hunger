import { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { Package, Users, TrendingUp, Calendar, AlertTriangle, RefreshCw, User, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#2E7D32', '#66BB6A', '#338A3E', '#98EE99', '#4CAF50'];

const statusStyles = {
  available: { bg: '#E8F5E9', text: '#2E7D32', label: 'Available' },
  not_available: { bg: '#F5F5F5', text: '#9E9E9E', label: 'Not Available' },
  inappropraite: { bg: '#FFEBEE', text: '#D32F2F', label: 'Banned' }
};

interface HeatmapRow {
  day: string;
  '08:00': number;
  '12:00': number;
  '17:00': number;
}

export function Dashboard() {
  const getMatrixCellColor = (value: number) => {
    if (value === 0) {
      return 'bg-slate-50 text-slate-300 border border-slate-200/60';
    }
    if (value >= 85) return 'bg-[#1B5E20] text-white font-extrabold';
    if (value >= 60) return 'bg-[#2E7D32] text-white';
    if (value >= 40) return 'bg-[#66BB6A] text-gray-900';
    return 'bg-[#E8F5E9] text-green-900 border border-green-200/40';
  };

  const [stats, setStats] = useState({
    total_listings: 0,
    pax_distributed: 0,
    food_saved: 0,
    total_users: 0,
    active_listings: 0,
    available_pax: 0,
    expiring_soon: 0,
    expiring_soon_listings: [],
  });

  const [chartData, setChartData] = useState<{
    foodTypeDistribution: any[];
    locationActivity: any[];
    weeklyActivity: any[];
  }>({
    foodTypeDistribution: [],
    locationActivity: [],
    weeklyActivity: []
  });

  const [todayListings, setTodayListings] = useState<any[]>([]);
  const [matrixData, setMatrixData] = useState<HeatmapRow[]>([]);
  const [showExpiringListings, setShowExpiringListings] = useState(false);
  const [expiringSoonListings, setExpiringSoonListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/dashboard-metrics');
      if (!response.ok) throw new Error(`Server status: ${response.status}`);

      const data = await response.json();
      setStats(data.stats);
      setChartData(data.chartData);
      setMatrixData(data.matrixData);
      setTodayListings(data.todayListings);
      setExpiringSoonListings(data.stats.expiring_soon_listings ?? []);
    } catch (err: any) {
      console.error('Frontend Sync Fetch Error:', err);
      setError(err.message || 'Failed to sync with central API metrics backend module.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/70">
      <div className="mx-auto w-full max-w-[1600px] space-y-8 p-4 sm:p-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Dashboard Overview</h1>
            <p className="text-sm leading-6 text-gray-500">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 mt-1 sm:mt-0">
            <Calendar size={14} className="sm:w-4 sm:h-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-medium text-sm sm:text-base">Error loading data</p>
                <p className="text-xs sm:text-sm opacity-90">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchDashboardMetrics}
              className="flex items-center justify-center gap-2 bg-white text-red-700 px-3 py-1.5 rounded-md border border-red-200 text-xs sm:text-sm font-medium hover:bg-red-100 transition-colors w-full sm:w-auto"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Food Listings"
            value={loading ? "..." : error ? "—" : stats.total_listings.toString()}
            icon={Package}
            trend={{ value: 'Total entries in system', isPositive: true }}
            color="#2E7D32"
          />
          <StatCard
            title="Pax Distributed"
            value={loading ? "..." : error ? "—" : stats.pax_distributed.toLocaleString()}
            icon={User}
            trend={{ value: 'Portions distributed', isPositive: true }}
            color="#2E7D32"
          />
          <StatCard
            title="Total Users"
            value={loading ? "..." : error ? "—" : stats.total_users.toString()}
            icon={Users}
            trend={{ value: 'Providers & Receivers', isPositive: true }}
            color="#2E7D32"
          />
          <StatCard
            title="Food Saved"
            value={loading ? "..." : error ? "—" : `${stats.food_saved.toLocaleString()} kg`}
            icon={TrendingUp}
            trend={{ value: 'Total weight rescued', isPositive: true }}
            color="#2E7D32"
          />
        </div>

        {loading ? (
          <div className='text-center py-20 text-sm text-[#9E9E9E] font-medium'>Calculating Cloud Database Metrics...</div>
        ) : (
          <>
            {/* TODAY */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                <h2 className="text-base font-semibold text-gray-500">Today's Overview</h2>
                <p className="mt-1 text-sm text-gray-500">
                  A quick summary of today's food-sharing activities.
                </p>
              </div>

              <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

                {/* Active Listings */}
                <div className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                      <Package size={18} className="text-[#2E7D32]" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-500">
                      Active Listings
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                      {loading ? "..." : error ? "—" : stats.active_listings}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Currently available
                    </p>
                  </div>
                </div>


                {/* Available Pax */}
                <div className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                      <Users size={18} className="text-[#2E7D32]" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-500">
                      Available Pax
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                      {loading ? "..." : error ? "—" : stats.available_pax}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Portions remaining
                    </p>
                  </div>
                </div>


                {/* Expiring Soon */}
                <div className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Clock size={18} className="text-orange-500" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-500">
                      Expiring Soon
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                      {loading ? "..." : error ? "—" : stats.expiring_soon}
                    </p>

                    <p className="text-xs text-orange-500 mt-1">
                      Ending within 30 minutes
                    </p>

                    {stats.expiring_soon > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowExpiringListings((prev) => !prev)}
                        aria-expanded={showExpiringListings}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-700 transition-colors hover:text-cyan-900 hover:underline"
                      >
                        {showExpiringListings
                          ? 'Hide expiring listings'
                          : 'View expiring listings'}

                        <span aria-hidden="true">
                          {showExpiringListings ? '↓' : '→'}
                        </span>
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">
                        No expiring listings
                      </p>
                    )}
                  </div>

                </div>

              </div>

              {/* Expiring Listings Table */}
              {showExpiringListings && stats.expiring_soon > 0 && (
                <div className="border-t border-gray-200 pt-2">
                  {/* Table Header */}
                  <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                    <h2 className="text-base font-semibold text-gray-900">
                      Expiring Listings ({expiringSoonListings.length})
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Food listings ending within the next 30 minutes.
                    </p>
                  </div>

                  {/* Empty State */}
                  {expiringSoonListings.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-500">
                      No expiring listings.
                    </div>
                  ) : (
                    /* Listings Table */
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Food Type
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Total Pax
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Remaining
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Location
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Pickup Ends
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 bg-white">
                          {expiringSoonListings.map((listing: any) => (
                            <tr key={listing.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate(`/food-listings/${listing.id}`)}>
                              <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                                {listing.food_type || 'Others'}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                {listing.pax_total ?? 0} portions
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                {listing.pax_remaining ?? 0} left
                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                {listing.pickup_location
                                  ? listing.pickup_location.split(',')[0]
                                  : 'Campus'}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                {listing.pickup_end
                                  ? new Date(listing.pickup_end).toLocaleTimeString(
                                    'en-MY',
                                    {
                                      timeZone: 'Asia/Kuala_Lumpur',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true,
                                    }
                                  )
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>


            {/* Today's Active Listings Table */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Today's Active Listings ({loading ? "..." : todayListings.length})
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review available food, ramaining portions and expiry status.
                </p>
              </div>

              <div className="overflow-x-auto">
                {todayListings.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-500">
                    No active food distributions posted yet today.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Event</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Food Type</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Total Pax</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Remaining</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Location</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pick Up Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {todayListings.map((listing, index) => {
                        const currentStatus = statusStyles[listing.status as keyof typeof statusStyles] || statusStyles.available;
                        const pickUpStart = new Date(listing.pickup_start).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        });
                        console.log('PICKUP DATE:', listing.pickup_start);

                        return (
                          <tr key={index} className="hover:bg-gray-50/80 transition-colors cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => { navigate(`/food-listings/${listing.id}`); }}>
                            <td title={listing.event_name} className="whitespace-nowrap px-5 py-4 text-sm text-gray-700 max-w-[140px] truncate">{listing.event_name}</td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">{listing.food_type || 'Others'}</td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">{listing.pax_total} portions</td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">{listing.pax_remaining || 0} left</td>
                            <td className="whitespace-nowrap px-5 py-4">
                              <span
                                className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                style={{ backgroundColor: currentStatus.bg, color: currentStatus.text }}
                              >
                                {currentStatus.label}
                              </span>
                            </td>
                            <td title={listing.pickup_location || 'Campus'}
                              className="py-3.5 px-3 text-xs sm:text-sm text-[#9E9E9E] max-w-[140px] truncate">
                              {listing.pickup_location ? listing.pickup_location.split(',')[0] : 'Campus'}
                            </td>
                            <td className="py-3.5 px-5 text-xs sm:text-sm text-[#9E9E9E] whitespace-nowrap">{pickUpStart}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {/* Weekly Distribution */}
              <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-base sm:text-lg font-semibold text-[#212121] mb-4">Weekly Food Distribution</h2>
                  <div className="w-full h-[260px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.weeklyActivity} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F8E9" />
                        <XAxis dataKey="name" stroke="#9E9E9E" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#9E9E9E" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="value" fill="#2E7D32" radius={[6, 6, 0, 0]} name="Listing Events" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Food Type Distribution */}
              <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-[#212121] mb-4">Food Type Proportions</h2>
                <div className="w-full h-[260px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartData.foodTypeDistribution.length === 0 ? (
                      <div className='flex items-center justify-center h-full text-sm text-gray-400'>No category entries tracked this week</div>
                    ) : (
                      <PieChart>
                        <Pie
                          data={chartData.foodTypeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                          style={{ fontSize: '11px', fontWeight: '500' }}
                        >
                          {chartData.foodTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Location Activity */}
            <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-base sm:text-lg font-semibold text-[#212121]">Most Active Locations</h2>

              <div className="w-full h-[300px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartData.locationActivity.length === 0 ? (
                    <div className='flex items-center justify-center h-full text-sm text-gray-400'>No listings positions tracked this week</div>
                  ) : (
                    <BarChart data={chartData.locationActivity} layout="vertical" margin={{ left: -50, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F8E9" />
                      <XAxis type="number" stroke="#9E9E9E" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" stroke="#9E9E9E" width={200} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#66BB6A" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Food Pickup Success Heatmap Component */}
            <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div>
                <div className="flex items-center gap-2 text-[#2E7D32] mb-1.5">
                  <Clock size={22} />
                  <h2 className="text-base sm:text-lg font-bold text-[#212121]">Collection Success by Day and Time</h2>
                </div>
                <p className="text-xs sm:text-sm text-[#9E9E9E]">
                  Shows the percentage of listed food that successfully gets claimed during different times of the day.
                </p>
              </div>

              {/* RESPONSIVE SCROLL-BOX: Safely prevents horizontal breakage on mobile formats */}
              <div className="mt-6 overflow-x-auto min-w-full inline-block align-middle">
                <div className="space-y-3 min-w-[460px] pb-1">

                  {/* HEADERS: Fixed layout tracking with responsive text additions */}
                  <div className="grid grid-cols-[75px_1fr_1fr_1fr] sm:grid-cols-[90px_1fr_1fr_1fr] gap-1.5 sm:gap-2 items-center text-xs sm:text-sm font-semibold text-gray-400 mb-2">
                    <div className="text-left pl-1">Day</div>
                    <div className="text-center w-full truncate">
                      Morning <span className="hidden md:inline text-[11px] font-normal opacity-75">(Before 11AM)</span>
                    </div>
                    <div className="text-center w-full truncate">
                      Afternoon <span className="hidden md:inline text-[11px] font-normal opacity-75">(11AM - 3PM)</span>
                    </div>
                    <div className="text-center w-full truncate">
                      Evening <span className="hidden md:inline text-[11px] font-normal opacity-75">(After 3PM)</span>
                    </div>
                  </div>

                  {/* DATA GRID BLOCK */}
                  <div className="space-y-2">
                    {matrixData.map((row) => (
                      <div key={row.day} className="grid grid-cols-[75px_1fr_1fr_1fr] sm:grid-cols-[90px_1fr_1fr_1fr] gap-1.5 sm:gap-2 items-center">
                        <div className="text-xs sm:text-sm font-bold text-gray-600 text-left pl-1 truncate">{row.day}</div>

                        <div className={`py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold tracking-wide text-center transition-all ${getMatrixCellColor(row['08:00'])}`}>
                          {row['08:00']}%
                        </div>
                        <div className={`py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold tracking-wide text-center transition-all ${getMatrixCellColor(row['12:00'])}`}>
                          {row['12:00']}%
                        </div>
                        <div className={`py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold tracking-wide text-center transition-all ${getMatrixCellColor(row['17:00'])}`}>
                          {row['17:00']}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* LEGEND ROW: Wrap badges fluidly */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-100 text-[11px] sm:text-xs text-gray-500 font-medium justify-center">
                {/* 0% Box */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded border border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-300" />
                  <span>0% (No Food)</span>
                </div>

                {/* 1%-39% Box */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#E8F5E9]/40 rounded border border-green-100">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#E8F5E9] border border-green-300" />
                  <span>1%-39% (Low)</span>
                </div>

                {/* 40%-59% Box */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#66BB6A]/10 rounded border border-[#66BB6A]/30">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#66BB6A] border border-[#66BB6A]/40" />
                  <span>40%-59%</span>
                </div>

                {/* 60%-84% Box */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#2E7D32]/10 rounded border border-[#2E7D32]/30">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#2E7D32] border border-[#2E7D32]/40" />
                  <span>60%-84%</span>
                </div>

                {/* 85%+ Box */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#1B5E20]/10 rounded border border-[#1B5E20]/30">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#1B5E20] border border-[#1B5E20]/40" />
                  <span>85%+: High</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}