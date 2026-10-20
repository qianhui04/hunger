import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { MapPin, Users, Calendar, Search, AlertTriangle, CheckCircle, BarChart3, Layers, Loader2, BookmarkCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LocationItem {
  id: string;
  event_name: string;
  location: string;
  pax_total: number;
  pax_remaining: number;
  pax_reserved: number;
  pax_collected: number;
  reservation_rate: number;
  fulfillment_rate: number;
  lat: number;
  lng: number;
  color: string;
}

interface MetricSet {
  availableEvent: number;
  totalPaxDistributed: number;
  avgFulfillmentRate: number;
  avgReservationRate: number;
  // topHub: string;
}

function MapResizeTrigger() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize(); }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export function AutoFitBounds({ locations, fallbackCenter }: { locations: LocationItem[], fallbackCenter: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!locations || locations.length === 0) {
      map.setView(fallbackCenter, 14);
      return;
    }
    const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true, duration: 1.0 });
  }, [locations, map, fallbackCenter]);
  return null;
}

export function LocationActivity() {
  const [locationData, setLocationData] = useState<LocationItem[]>([]);
  const [metrics, setMetrics] = useState<MetricSet>({
    availableEvent: 0,
    totalPaxDistributed: 0,
    avgFulfillmentRate: 0,
    avgReservationRate: 0,
    // topHub: 'N/A'
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'high' | 'low'>('all');

  const defaultMapCenter: [number, number] = [3.1254, 101.6542]; // Centered around UM Campus region base

  // Unified Server-Side Data Synchronizer
  useEffect(() => {
    async function fetchBackendAnalytics() {
      try {
        setIsLoadingData(true);
        const response = await fetch("http://localhost:5000/api/locations/analytics");
        if (!response.ok) throw new Error("API Channel error connection exception");

        const payload = await response.json();
        setLocationData(payload.locations);
        setMetrics({
          availableEvent: payload.metrics?.availableEvent.length || 0,
          totalPaxDistributed: payload.metrics?.totalPaxDistributed || 0,
          avgFulfillmentRate: payload.metrics?.avgFulfillmentRate || 0,
          avgReservationRate: payload.metrics?.avgReservationRate || 0,
        });

        // const queryParams = new URLSearchParams({
        //   search: searchTerm,
        //   filter: viewFilter
        // }).toString();

        // const response = await fetch(`http://localhost:5000/api/locations/analytics?${queryParams}`);
        // if (!response.ok) throw new Error("API Channel error connection exception");
      } catch (err) {
        console.error("Error connecting with backend runtime cluster engine:", err);
        setLocationData([]);
      } finally {
        setIsLoadingData(false);
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchBackendAnalytics();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const filteredLocations = locationData.filter((loc) => {
    // 1. Filter by fulfillment rate
    const matchesFulfillment =
      viewFilter === 'high'
        ? loc.fulfillment_rate >= 70
        : viewFilter === 'low'
          ? loc.fulfillment_rate < 70
          : true;

    // 2. Filter by event name or location
    const keyword = searchTerm.trim().toLowerCase();

    const matchesSearch =
      (loc.event_name ?? '').toLowerCase().includes(keyword) ||
      (loc.location ?? '').toLowerCase().includes(keyword);

    // 3. Both conditions must match
    return matchesFulfillment && matchesSearch;
  });

  const fallbackMapFocus = useMemo((): [number, number] => {
    if (locationData.length > 0) return [locationData[0].lat, locationData[0].lng];
    return defaultMapCenter;
  }, [locationData]);

  if (isLoadingData && locationData.length === 0) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#2E7D32]" size={36} />
        <p className="text-sm font-medium text-[#616161]">Compiling Live Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden p-1">
      <style>{`.leaflet-container { width: 100%; height: 100%; border-radius: 0.75rem; z-index: 1; }`}</style>

      <PageHeader
        title="Location Activity Monitor"
        description="Real-time event distribution and attendance tracking overview"
      />

      {/* UPGRADED: Scoreboard Cards showing separate tracking metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Active Listings', value: metrics.availableEvent, icon: MapPin, color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' },
          { title: 'Avg. Reservation Rate', value: `${metrics.avgReservationRate}%`, icon: BookmarkCheck, color: 'text-[#1565C0]', bg: 'bg-[#E3F2FD]' },
          { title: 'Avg. Pickup Rate', value: `${metrics.avgFulfillmentRate}%`, icon: Calendar, color: 'text-[#66BB6A]', bg: 'bg-[#E8F5E9]' },
          { title: 'Total Volume Distributed', value: (metrics.totalPaxDistributed || 0).toLocaleString(), icon: Users, color: 'text-[#338A3E]', bg: 'bg-[#E8F5E9]' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="truncate pr-2 w-full">
              <p className="text-sm text-[#9E9E9E] truncate">{card.title}</p>
              <p className="font-semibold text-[#212121] mt-1 text-3xl">
                {card.value}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon size={24} className={card.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Unified Workspace */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">

        {/* Navigation & Controls */}
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-[#F5FAF5] p-1 rounded-xl w-full md:w-auto border border-gray-100 overflow-x-auto">
            {[
              { id: 'all', label: 'All Listings', icon: BarChart3, color: 'text-[#2E7D32]' },
              { id: 'high', label: 'High Fulfillment (≥70%)', icon: CheckCircle, color: 'text-[#2E7D32]' },
              { id: 'low', label: 'Low Fulfillment (<70%)', icon: AlertTriangle, color: 'text-[#F57C00]' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewFilter(tab.id as any)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${viewFilter === tab.id ? 'bg-white text-[#2E7D32] shadow-sm' : 'text-[#616161] hover:text-[#212121]'}`}
              >
                <tab.icon size={16} className={viewFilter === tab.id ? tab.color : 'text-[#616161]'} />
                {tab.label}
              </button>
            ))}
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search event name or location text..."
            wrapperClassName="relative w-full md:w-80"
            inputClassName="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all"
            iconSize={18}
          />
        </div>

        {/* Map Workspace Section */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#212121]">Live Distribution Map</h2>
              <p className="text-xs text-[#9E9E9E] mt-0.5">Live overview of active donation spots across the campus</p>
            </div>
            <span className="p-2 bg-[#F5FAF5] rounded-lg text-[#2E7D32]"><Layers size={18} /></span>
          </div>

          <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-100 relative shadow-inner">
            <MapContainer center={fallbackMapFocus} zoom={14} minZoom={3} maxZoom={18} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapResizeTrigger />
              <AutoFitBounds locations={filteredLocations} fallbackCenter={defaultMapCenter} />

              {filteredLocations.map((loc) => {
                const LeafletTooltip = Tooltip as any;
                return (
                  <React.Fragment key={loc.id}>
                    <CircleMarker
                      center={[loc.lat, loc.lng]}
                      pathOptions={{ color: loc.color, fillColor: loc.color, fillOpacity: 0.15, weight: 1 }}
                      radius={Math.min(35, Math.max(15, loc.pax_total / 2))}
                    />
                    <Marker position={[loc.lat, loc.lng]}>
                      <LeafletTooltip sticky={true} direction="top" className="!p-0 !border-none !bg-transparent !shadow-none">
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 min-w-[240px] font-sans pointer-events-none">
                          <div className="flex items-center gap-1.5 border-b border-gray-50 pb-2 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: loc.color }} />
                            <p className="font-bold text-gray-900 text-sm tracking-tight truncate max-w-[180px]">{loc.event_name}</p>
                          </div>
                          <div className="space-y-1.5 text-xs text-gray-600">
                            <p><span className="text-gray-400 font-medium">Location:</span> <span className="font-semibold text-gray-700">{loc.location}</span></p>
                            <p><span className="text-gray-400 font-medium">Coordinates:</span> <span className="font-semibold text-gray-700">{loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)}</span></p>
                            <p><span className="text-gray-400 font-medium">Inventory Status:</span> <span className="font-semibold text-gray-800">{loc.pax_remaining} / {loc.pax_total} Packs Left</span></p>
                            <p><span className="text-blue-400 font-medium">Reservation Rate:</span> <span className="font-bold text-blue-700">{loc.reservation_rate}% ({loc.pax_reserved} Claimed)</span></p>
                            <p><span className="text-green-400 font-medium">Fulfillment Rate:</span> <span className="font-bold text-green-700">{loc.fulfillment_rate}% ({loc.pax_collected} Checked In)</span></p>
                          </div>
                        </div>
                      </LeafletTooltip>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Dynamic Ledger Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider">Event Information</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider">Geographic Address</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider">Total Pax</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider">Reservation Rate</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider">Fulfillment Rate</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider">Remaining Pax</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-[#F9FBF9] transition-colors duration-150">
                    {/* Event Info */}
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-[#212121]">{loc.event_name}</span>
                    </td>

                    {/* Location Address */}
                    <td className="py-4 px-6 text-sm font-medium text-gray-600">{loc.location}</td>

                    {/* Total Prepared Stock */}
                    <td className="py-4 px-6 text-sm font-bold text-gray-900">{loc.pax_total} Pax</td>

                    {/* Claimed App Reservations (Headcount + small percentage support badge) */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-blue-700">{loc.pax_reserved} Person/s</span>
                        <span className="text-xs text-blue-400 font-medium">{loc.reservation_rate}% of total stock</span>
                      </div>
                    </td>

                    {/* Collected Handovers (Headcount + visual progress tracking bar) */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 min-w-[140px]">
                        <span className="text-sm font-semibold text-green-700">{loc.pax_collected} Checked In</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${loc.fulfillment_rate}%`, backgroundColor: loc.color }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500">{loc.fulfillment_rate}%</span>
                        </div>
                      </div>
                    </td>

                    {/* Remaining Unclaimed Stock */}
                    <td className="py-4 px-6 text-sm font-medium">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${loc.pax_remaining === 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                        {loc.pax_remaining} Available
                      </span>
                    </td>

                    {/* Overall Yield Badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${loc.fulfillment_rate >= 70 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#D32F2F]'}`}>
                        {loc.fulfillment_rate >= 70 ? 'High Fulfillment' : 'Low Fulfillment'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9E9E9E] text-sm font-medium">
                    No listings found. Try adjusting your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}