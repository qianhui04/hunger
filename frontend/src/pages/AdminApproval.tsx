import React, { useState, useMemo } from 'react';
import {
    CheckCircle,
    XCircle,
    UserCheck,
    Clock,
    Search,
    Mail,
    Calendar,
    ShieldAlert,
    Loader2,
    AlertCircle,
    ThumbsUp,
    SlidersHorizontal
} from 'lucide-react';

// Define layout parameters for the mock entries
interface AdminRequest {
    id: string;
    full_name: string;
    email: string;
    requested_role: 'Admin' | 'Super Admin';
    created_at: string;
    reason: string;
}

// Hardcoded Mock Database Records matching UM academic profiles
const HARDCODED_REQUESTS: AdminRequest[] = [
    {
        id: 'req-001',
        full_name: 'Alex Mercer',
        email: 'alex.mercer@siswa.um.edu.my',
        requested_role: 'Admin',
        created_at: '2026-06-09T08:30:00Z',
        reason: 'Requesting dashboard access to oversee the GPS food drop-off telemetry streams and update spatial density mappings for our faculty cluster.'
    },
    {
        id: 'req-002',
        full_name: 'Dr. Siti Aminah',
        email: 'siti.aminah@um.edu.my',
        requested_role: 'Super Admin',
        created_at: '2026-06-08T14:15:00Z',
        reason: 'Faculty coordinator for Zero Hunger UM initiative. Need comprehensive configuration rights to approve lower-tier administrator registrations.'
    },
    {
        id: 'req-003',
        full_name: 'Khairul Anwar',
        email: 'khairul.anwar@siswa.um.edu.my',
        requested_role: 'Admin',
        created_at: '2026-06-07T11:05:00Z',
        reason: 'Volunteering as a logistics dispatcher. Need access to manage the food listing schedules and clear inactive system notifications.'
    }
];

export default function AdminApproval() {
    // State initialization utilizing our hardcoded array
    const [requests, setRequests] = useState<AdminRequest[]>(HARDCODED_REQUESTS);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // FR-68 & FR-70: Hardcoded Simulation Event Handler
    const handleDecision = (id: string, name: string, decision: 'approved' | 'rejected') => {
        if (processingId) return;

        // Simulate server processing network latency layout
        setProcessingId(id);
        setNotification(null);

        setTimeout(() => {
            // 1. Update UI state locally by filtering out the handled item
            setRequests(prev => prev.filter(req => req.id !== id));
            setProcessingId(null);

            // 2. FR-70 Simulate dispatching official outward notification alerts
            setNotification({
                type: decision === 'approved' ? 'success' : 'error',
                message: `FR-70 Notification Dispatched: Access request for ${name} has been ${decision}. An automated security transmission has been routed to their registered UM email.`
            });
        }, 900);
    };

    // Client Side Filter Utility Component
    const filteredRequests = useMemo(() => {
        return requests.filter(req =>
            req.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [requests, searchTerm]);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans antialiased text-gray-800">

            {/* Module Heading Header Context Block */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-6 gap-4">
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-md w-fit mb-2 border border-[#C8E6C9]">
                        <UserCheck size={14} /> SECURITY CLEARANCE WORKSPACE
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Registration Requests</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Evaluate, verify, and approve operational clearance profiles for Zero Hunger UM</p>
                </div>

                {/* Search Layout Controller Element */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search applicants by name/email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* FR-70 Notification Display Banner */}
            {notification && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm transition-all animate-fade-in ${notification.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="shrink-0 text-emerald-600 mt-0.5" size={18} />
                    ) : (
                        <AlertCircle className="shrink-0 text-rose-600 mt-0.5" size={18} />
                    )}
                    <div className="font-medium">{notification.message}</div>
                </div>
            )}

            {/* FR-69 Render Loop View Grid */}
            {filteredRequests.length === 0 ? (
                <div className="border border-dashed border-gray-200 bg-gray-50/50 rounded-2xl p-16 text-center max-w-md mx-auto mt-6">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-[#2E7D32] mx-auto mb-4">
                        <ThumbsUp size={22} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Manifest Clear</h3>
                    <p className="text-xs text-gray-500 mt-1">There are no pending administrator access authorizations matching the query.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredRequests.map((req) => (
                        <div
                            key={req.id}
                            className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between relative overflow-hidden"
                        >
                            <div>
                                {/* Upper Badge & Identity Rows */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-base tracking-tight">{req.full_name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 font-medium">
                                            <Mail size={13} className="text-gray-400" />
                                            <span>{req.email}</span>
                                        </div>
                                    </div>

                                    {/* Structural Privilege Badge */}
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1 ${req.requested_role === 'Super Admin'
                                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                                            : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        <ShieldAlert size={12} /> {req.requested_role}
                                    </span>
                                </div>

                                {/* Justification Text Context Layer */}
                                <div className="bg-gray-50 border-l-2 border-gray-300 rounded-r-lg p-3.5 text-xs text-gray-600 font-normal leading-relaxed my-4">
                                    <span className="font-semibold text-gray-500 block text-[10px] uppercase tracking-wider mb-1">Applicant Justification Statement:</span>
                                    "{req.reason}"
                                </div>
                            </div>

                            {/* Action Operations Line (FR-68 Handling Controls) */}
                            <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
                                <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                                    <Calendar size={13} />
                                    <span>{new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Reject Request Action Button Element */}
                                    <button
                                        disabled={processingId !== null}
                                        onClick={() => handleDecision(req.id, req.full_name, 'rejected')}
                                        className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-rose-100 active:scale-95"
                                    >
                                        <XCircle size={15} /> Reject
                                    </button>

                                    {/* Approve Request Action Button Element */}
                                    <button
                                        disabled={processingId !== null}
                                        onClick={() => handleDecision(req.id, req.full_name, 'approved')}
                                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-gray-400 px-4 py-2 rounded-xl transition-all shadow-sm shadow-emerald-700/10 cursor-pointer active:scale-95"
                                    >
                                        {processingId === req.id ? (
                                            <Loader2 className="animate-spin" size={15} />
                                        ) : (
                                            <CheckCircle size={15} />
                                        )}
                                        Approve
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}