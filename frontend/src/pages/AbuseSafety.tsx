import { useState, useMemo, useEffect } from 'react';
import {
    AlertTriangle, MessageSquare, Settings, Sparkles,
    Sliders, Search, Eye, Filter, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface AbuseTicket {
    id: string;
    target_object_id: string;
    target_type: 'listing';
    reported_user_uid: string;

    report_count: number;
    calculated_severity_score: number;

    ticket_status: 'unresolved' | 'resolved';

    ai_analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
    ai_analysis_version: number;
    ai_analysis_error: string | null;
    ai_insights_summary: string | null;
    ai_suggested_action: string | null;
    ai_behavioral_tag: string | null;
    ai_flagged_snippets: string[] | null;

    ai_report_frequency_score: number | null;
    ai_report_consistency_score: number | null;
    ai_food_safety_score: number | null;
    ai_evidence_strength_score: number | null;

    ai_confidence_score: number | null;
    ai_confidence_explanation: string | null;
    ai_confidence_level: 'High' | 'Low' | null;

    created_at: string;
    updated_at: string;
    resolved_at: string | null;

    reportedUser: {
        uid: string;
        name: string | null;
        email: string | null;
    } | null;

    listing: {
        id: string;
        event_name: string | null;
        food_type: string | null;
        short_description: string | null;
        image_url: string | null;
        pickup_location: string | null;
    } | null;

    abuse_reports: AbuseReport[];
}

interface AbuseReport {
    id: string;
    listing_id: string | null;
    claim_id: string | null;
    reporter: {
        uid: string;
        name: string | null;
        email: string | null;
    } | null;
    reported_user_uid: string | null;
    report_type: 'listing' | null;
    reasons: string[];
    notes: string | null;
    created_at: string;
}

interface TicketStatistics {
    totalTickets: number;
    unresolvedTickets: number;
    resolvedTickets: number;
    listingReports: number;
    claimReports: number;
    userReports: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function AbuseSafety() {
    // Core Operational States
    const [tickets, setTickets] = useState<AbuseTicket[]>([]);
    const [ticketStatistics, setTicketStatistics] = useState<TicketStatistics>({
        totalTickets: 0,
        unresolvedTickets: 0,
        resolvedTickets: 0,
        listingReports: 0,
        claimReports: 0,
        userReports: 0
    });
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Tickets');
    const [aiConfig, setAiConfig] = useState({
        report_frequency_weight: 20,
        report_consistency_weight: 25,
        food_safety_weight: 35,
        evidence_strength_weight: 20,
        confidence_threshold: 80
    });

    const [isConfigLoading, setIsConfigLoading] = useState(true);
    const [isConfigSaving, setIsConfigSaving] = useState(false);
    const [configError, setConfigError] = useState('');
    const [configSuccess, setConfigSuccess] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';

    const processedQueue = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();

        return tickets
            .filter(ticket => {
                const userName = ticket.reportedUser?.name || '';
                const ticketId = ticket.id || '';
                const objectId = ticket.target_object_id || '';
                const eventName = ticket.listing?.event_name || '';
                const foodType = ticket.listing?.food_type || '';
                const pickupLocation = ticket.listing?.pickup_location || '';

                const reportContent = ticket.abuse_reports
                    ?.map(report => {
                        const reasons = (report.reasons || []).join(' ');
                        const notes = report.notes || '';
                        return `${reasons} ${notes}`;
                    })
                    .join(' ') || '';

                const matchesSearch =
                    !query ||
                    userName.toLowerCase().includes(query) ||
                    ticketId.toLowerCase().includes(query) ||
                    objectId.toLowerCase().includes(query) ||
                    eventName.toLowerCase().includes(query) ||
                    foodType.toLowerCase().includes(query) ||
                    pickupLocation.toLowerCase().includes(query) ||
                    reportContent.toLowerCase().includes(query);

                const matchesStatus =
                    statusFilter === 'All Tickets' ||
                    ticket.ticket_status === (
                        statusFilter === 'Unresolved' ? 'unresolved' : 'resolved'
                    );

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) =>
                b.calculated_severity_score - a.calculated_severity_score
            );
    }, [tickets, searchTerm, statusFilter]);

    const currentTicket = useMemo(() => {
        return tickets.find(t => t.id === selectedTicketId) || tickets[0];
    }, [tickets, selectedTicketId]);

    const getBehaviorTagStyles = (tag: string) => {
        switch (tag) {
            case 'Chronic Offender': return 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]';
            case 'Suspicious Spike': return 'bg-[#FFF3E0] text-[#EF6C00] border-[#FFE0B2]';
            case 'First Time Flag': return 'bg-[#FFFDE7] text-[#F57F17] border-[#FFF9C4]';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/tickets`);
            if (!response.ok) throw new Error('Error when fetching tickets');

            const data = await response.json();
            setTickets(data);
        } catch (error: any) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTicketStatistics = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/tickets/statistics`);
            if (!response.ok) throw new Error('Error fetching ticket statistics');

            const data = await response.json();
            console.log(data);
            setTicketStatistics(data);
        } catch (error: any) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleApplyAiSuggestion = (ticketId: string, action: string) => {
        alert(`AI Recommendation Executed:\nProcessing target action [${action}] for ticket reference ${ticketId}.`);
        setTickets(prev => prev.filter(t => t.id !== ticketId));
    };

    const handleDismissTicket = async (ticketId: string) => {
        alert(`Ticket ${ticketId} cleared.`);
        try {
            setLoading(true);
            setErrorMessage(null);

            const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'resolved'
                })
            });

            if (!response.ok) throw new Error('Error fetching ticket statistics');

            const data = await response.json();

            setTickets(prev =>
                prev.map(ticket =>
                    ticket.id === ticketId ? data : ticket
                )
            );

            alert('Ticket successfully resolved.');
        } catch (error: any) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        handleTicketStatistics();
    }, []);

    useEffect(() => {
        const fetchAIConfig = async () => {
            try {
                setIsConfigLoading(true);
                setConfigError('');

                // Get current Supabase access token
                const { data: { session }, error: sessionError } =
                    await supabase.auth.getSession();

                if (sessionError || !session?.access_token) {
                    throw new Error('Authentication session not found.');
                }

                // Fetch configuration from backend
                const response = await fetch(`${API_BASE_URL}/ai-config`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || 'Failed to load AI configuration.'
                    );
                }

                // Update frontend state using database values
                setAiConfig({
                    report_frequency_weight: Number(result.data.report_frequency_weight),
                    report_consistency_weight: Number(result.data.report_consistency_weight),
                    food_safety_weight: Number(result.data.food_safety_weight),
                    evidence_strength_weight: Number(result.data.evidence_strength_weight),
                    confidence_threshold: Number(result.data.confidence_threshold)
                });

            } catch (error) {
                console.error('Fetch AI Configuration Error:', error);

                setConfigError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load AI configuration.'
                );

            } finally {
                setIsConfigLoading(false);
            }
        };

        if (user?.id) {
            fetchAIConfig();
        }
    }, [user?.id]);

    // FR-67: Save Global AI Configuration
    const handleSaveAIConfig = async () => {
        try {
            setIsConfigSaving(true);
            setConfigError('');
            setConfigSuccess('');

            const { data: { session }, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError || !session?.access_token) {
                throw new Error('Authentication session not found.');
            }

            const response = await fetch(`${API_BASE_URL}/ai-config`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(aiConfig)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Failed to save AI configuration.'
                );
            }

            // Sync frontend state with saved database values
            setAiConfig({
                report_frequency_weight: Number(result.data.report_frequency_weight),
                report_consistency_weight: Number(result.data.report_consistency_weight),
                food_safety_weight: Number(result.data.food_safety_weight),
                evidence_strength_weight: Number(result.data.evidence_strength_weight),
                confidence_threshold: Number(result.data.confidence_threshold)
            });

            setConfigSuccess('AI configuration saved successfully.');

        } catch (error) {
            console.error('Save AI Configuration Error:', error);

            setConfigError(
                error instanceof Error
                    ? error.message
                    : 'Failed to save AI configuration.'
            );

        } finally {
            setIsConfigSaving(false);
        }
    };

    // Content NLP Substring Highlight System (FR: Highlight Toxic Phrases Instantly)
    const renderHighlightedContent = (content: string, phrases: string[]) => {
        if (!phrases || phrases.length === 0) return <p className="text-[#212121]">{content}</p>;
        const escaped = phrases.map(p => p.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
        const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
        const parts = content.split(regex);

        return (
            <p className="text-sm leading-relaxed text-[#212121] font-medium">
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <span key={i} className="bg-[#FFEBEE] text-[#C62828] border-b-2 border-[#C62828] font-semibold px-0.5 rounded-sm">
                            {part}
                        </span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </p>
        );
    };

    return (
        <div className="space-y-6">

            {/* Module Title Section */}
            <div>
                <h1 className="text-2xl font-semibold text-[#212121]">Abuse Management Workspace</h1>
                <p className="text-[#9E9E9E] mt-1">Review AI evaluations, verify aggregated content anomalies, and confirm recommendations</p>
            </div>

            {/* Overview Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Total Tickets */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">
                            Total Tickets
                        </p>
                        <MessageSquare size={20} className="text-gray-400" />
                    </div>

                    <p className="text-3xl font-semibold text-gray-900 mt-3">
                        {ticketStatistics.totalTickets}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                        All aggregated abuse tickets
                    </p>
                </div>

                {/* Unresolved Tickets */}
                <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-amber-700">
                            Unresolved Tickets
                        </p>
                        <AlertTriangle size={20} className="text-amber-500" />
                    </div>

                    <p className="text-3xl font-semibold text-amber-700 mt-3">
                        {ticketStatistics.unresolvedTickets}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                        Waiting for admin review
                    </p>
                </div>

                {/* Resolved Tickets */}
                <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-green-700">
                            Resolved Tickets
                        </p>
                        <Eye size={20} className="text-green-600" />
                    </div>

                    <p className="text-3xl font-semibold text-green-700 mt-3">
                        {ticketStatistics.resolvedTickets}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                        Tickets reviewed and resolved
                    </p>
                </div>

            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">

                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                            <Settings size={20} className="text-[#2E7D32]" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                AI Sensitivity Configuration
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Global parameters for AI abuse triage
                            </p>
                        </div>
                    </div>

                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isSuperAdmin
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        {isSuperAdmin ? 'Manager Access' : 'View Only'}
                    </span>
                </div>

                {isConfigLoading ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                        Loading AI configuration...
                    </div>
                ) : (
                    <div className="space-y-5">

                        {/* Severity Weights */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Abuse Severity Sensitivity
                                </h3>
                                <span className={`text-xs font-semibold ${aiConfig.report_frequency_weight +
                                    aiConfig.report_consistency_weight +
                                    aiConfig.food_safety_weight +
                                    aiConfig.evidence_strength_weight === 100
                                    ? 'text-green-700'
                                    : 'text-red-600'
                                    }`}>
                                    Total: {
                                        aiConfig.report_frequency_weight +
                                        aiConfig.report_consistency_weight +
                                        aiConfig.food_safety_weight +
                                        aiConfig.evidence_strength_weight
                                    }%
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                                {([
                                    {
                                        key: 'report_frequency_weight',
                                        label: 'Report Frequency',
                                        description: 'Number of reports received'
                                    },
                                    {
                                        key: 'report_consistency_weight',
                                        label: 'Report Consistency',
                                        description: 'Consistency across reports'
                                    },
                                    {
                                        key: 'food_safety_weight',
                                        label: 'Food Safety Concern',
                                        description: 'Potential food safety impact'
                                    },
                                    {
                                        key: 'evidence_strength_weight',
                                        label: 'Evidence Strength',
                                        description: 'Specificity and quality of evidence'
                                    }
                                ] as const).map((item) => (
                                    <div key={item.key}>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-medium text-gray-700">
                                                {item.label}
                                            </label>
                                            <span className="text-xs font-semibold text-[#2E7D32]">
                                                {aiConfig[item.key]}%
                                            </span>
                                        </div>

                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={aiConfig[item.key]}
                                            disabled={!isSuperAdmin}
                                            onChange={(e) => {
                                                setAiConfig(prev => ({
                                                    ...prev,
                                                    [item.key]: Number(e.target.value)
                                                }));
                                            }}
                                            className="w-full accent-[#2E7D32] h-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        />

                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}

                            </div>
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Confidence Threshold */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800">
                                        AI Confidence Threshold
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Minimum confidence level for a high-confidence AI assessment
                                    </p>
                                </div>
                                <span className="text-sm font-bold text-[#2E7D32]">
                                    {aiConfig.confidence_threshold}%
                                </span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={aiConfig.confidence_threshold}
                                disabled={!isSuperAdmin}
                                onChange={(e) => {
                                    setAiConfig(prev => ({
                                        ...prev,
                                        confidence_threshold: Number(e.target.value)
                                    }));
                                }}
                                className="w-full accent-[#2E7D32] h-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Feedback Messages */}
                        {configError && (
                            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                {configError}
                            </p>
                        )}

                        {configSuccess && (
                            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                                {configSuccess}
                            </p>
                        )}

                        {/* Save Button */}
                        {isSuperAdmin && (
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSaveAIConfig}
                                    disabled={
                                        isConfigSaving ||
                                        aiConfig.report_frequency_weight +
                                        aiConfig.report_consistency_weight +
                                        aiConfig.food_safety_weight +
                                        aiConfig.evidence_strength_weight !== 100
                                    }
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#256628] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isConfigSaving ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        )}

                    </div>
                )}
            </div>

            {/* Primary Workspace Dual Columns Split (FR: Review Submitted Abuse Reports View) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Pane: Ticket Queue */}
                <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[650px]">

                    {/* Header */}
                    <div className="p-5 border-b border-gray-100 space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Ticket Queue
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Review and manage submitted abuse reports
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search user, listing, food type, location or report..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-sm pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-wrap gap-2">
                            {['All Tickets', 'Unresolved', 'Resolved'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                                        ? 'bg-[#2E7D32] text-white'
                                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {processedQueue.length > 0 ? (
                            processedQueue.map((ticket) => {
                                const firstReport = ticket.abuse_reports?.[0];

                                const reportReasons = [
                                    ...new Set(
                                        ticket.abuse_reports?.flatMap(report => report.reasons || []) || []
                                    )
                                ];

                                const reportNotes = ticket.abuse_reports
                                    ?.map(report => report.notes)
                                    .filter(Boolean) || [];

                                const isSelected = selectedTicketId === ticket.id;

                                return (
                                    <div
                                        key={ticket.id}
                                        onClick={() => setSelectedTicketId(ticket.id)}
                                        className={`px-4 py-4 cursor-pointer transition-all border-l-[3px] ${isSelected
                                            ? 'bg-[#F1F8E9] border-l-[#2E7D32]'
                                            : 'border-l-transparent hover:bg-gray-50'
                                            }`}
                                    >
                                        {/* User + Risk Score */}
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                    {ticket.reportedUser?.name || 'Unknown User'}
                                                </h3>

                                                <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                                                    #{ticket.id.slice(0, 8)}
                                                </p>
                                            </div>

                                            <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${ticket.calculated_severity_score >= 70
                                                ? 'bg-red-50 text-red-700'
                                                : ticket.calculated_severity_score >= 40
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-green-50 text-green-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${ticket.calculated_severity_score >= 70
                                                    ? 'bg-red-500'
                                                    : ticket.calculated_severity_score >= 40
                                                        ? 'bg-amber-500'
                                                        : 'bg-green-500'
                                                    }`} />
                                                {ticket.calculated_severity_score}/100
                                            </div>
                                        </div>

                                        {/* Report Reasons */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                            {reportReasons.length > 0 ? (
                                                reportReasons.map(reason => {
                                                    const reasonStyle =
                                                        reason === 'unfresh_food'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                            : reason === 'irrelevant_image'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                                : 'bg-gray-50 text-gray-600 border-gray-200';

                                                    const reasonLabel = {
                                                        unfresh_food: 'Unfresh Food',
                                                        irrelevant_image: 'Irrelevant Image',
                                                        other: 'Other'
                                                    }[reason] || reason.replace(/_/g, ' ');

                                                    return (
                                                        <span
                                                            key={reason}
                                                            className={`px-2 py-1 rounded-md border text-[11px] font-medium ${reasonStyle}`}
                                                        >
                                                            {reasonLabel}
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-[11px] text-gray-400">
                                                    No report reason available
                                                </span>
                                            )}
                                        </div>

                                        {/* Report Note Preview */}
                                        {reportNotes.length > 0 && (
                                            <div className="mt-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <MessageSquare
                                                        size={12}
                                                        className="text-gray-400"
                                                    />
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                        Additional Notes
                                                    </span>
                                                </div>

                                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                                    {reportNotes[0]}
                                                </p>

                                                {reportNotes.length > 1 && (
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        +{reportNotes.length - 1} more notes
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <MessageSquare size={12} />
                                                    <span className="text-[11px] font-medium">
                                                        {ticket.report_count} Reports
                                                    </span>
                                                </div>

                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold ${ticket.ticket_status === 'resolved'
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${ticket.ticket_status === 'resolved'
                                                        ? 'bg-green-500'
                                                        : 'bg-amber-500'
                                                        }`} />
                                                    {ticket.ticket_status === 'resolved' ? 'Resolved' : 'Unresolved'}
                                                </span>
                                            </div>

                                            <span className="text-[10px] text-gray-400">
                                                {new Date(ticket.created_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-16 text-center px-4">
                                <MessageSquare
                                    size={32}
                                    className="mx-auto text-gray-300 mb-3"
                                />
                                <p className="text-sm font-medium text-gray-600">
                                    No tickets found
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Try changing your search or filter.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Compact Incident Review Workspace */}
                {currentTicket && (
                    <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl shadow-sm h-[600px] flex flex-col overflow-hidden">

                        {/* Scrollable Content */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">

                            {/* 1. Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Incident Review
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-1 font-mono">
                                        #{currentTicket.id}
                                    </p>
                                </div>

                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${currentTicket.ticket_status === 'unresolved'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-green-50 text-green-700'
                                    }`}>
                                    {currentTicket.ticket_status === 'unresolved'
                                        ? 'Unresolved'
                                        : 'Resolved'}
                                </span>
                            </div>

                            {/* 2. Quick Statistics */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-500">
                                        Severity Score
                                    </p>
                                    <div className="flex items-end gap-1 mt-1">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {currentTicket.calculated_severity_score}
                                        </span>
                                        <span className="text-xs text-gray-400 mb-1">
                                            / 100
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-500">
                                        Total Reports
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {currentTicket.report_count}
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 col-span-2 sm:col-span-1">
                                    <p className="text-xs text-gray-500">
                                        AI Analysis
                                    </p>
                                    <p className={`text-sm font-semibold mt-2 ${currentTicket.ai_analysis_status === 'completed'
                                        ? 'text-green-700'
                                        : currentTicket.ai_analysis_status === 'failed'
                                            ? 'text-red-600'
                                            : 'text-amber-600'
                                        }`}>
                                        {currentTicket.ai_analysis_status === 'completed'
                                            ? 'Completed'
                                            : currentTicket.ai_analysis_status === 'failed'
                                                ? 'Failed'
                                                : currentTicket.ai_analysis_status === 'processing'
                                                    ? 'Processing'
                                                    : 'Pending'}
                                    </p>
                                </div>
                            </div>

                            {/* 3. Listing and Reported User */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {/* Reported Listing */}
                                <div className="border border-gray-100 rounded-xl p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                        Reported Listing
                                    </p>

                                    <div className="flex gap-3 items-center">
                                        {currentTicket.listing?.image_url ? (
                                            <img
                                                src={currentTicket.listing.image_url}
                                                alt="Food listing"
                                                className="w-16 h-16 rounded-lg object-cover shrink-0"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                <Eye size={20} className="text-gray-400" />
                                            </div>
                                        )}

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {currentTicket.listing?.event_name || 'Unknown Listing'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {currentTicket.listing?.food_type || 'Unknown Food Type'}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                                        {currentTicket.listing?.short_description || 'No description available.'}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-2">
                                        {currentTicket.listing?.pickup_location || 'No location available'}
                                    </p>
                                </div>

                                {/* Reported User */}
                                <div className="border border-gray-100 rounded-xl p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                        Reported User
                                    </p>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold shrink-0">
                                            {(currentTicket.reportedUser?.name || 'U').charAt(0)}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {currentTicket.reportedUser?.name || 'Unknown User'}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {currentTicket.reportedUser?.email || 'No Email'}
                                            </p>
                                        </div>
                                    </div>

                                    {currentTicket.ai_behavioral_tag && (
                                        <div className="mt-3">
                                            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${getBehaviorTagStyles(currentTicket.ai_behavioral_tag)}`}>
                                                {currentTicket.ai_behavioral_tag}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 4. Report Evidence */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gray-900">
                                        Report Evidence
                                    </h3>
                                    <span className="text-xs text-gray-400">
                                        {currentTicket.abuse_reports?.length || 0} records
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {currentTicket.abuse_reports?.length ? (
                                        currentTicket.abuse_reports.map((report, index) => (
                                            <div
                                                key={report.id}
                                                className="bg-gray-50 rounded-xl p-3"
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {report.reasons?.length ? (
                                                            report.reasons.map(reason => (
                                                                <span
                                                                    key={reason}
                                                                    className="text-xs font-medium bg-red-50 text-red-700 px-2 py-1 rounded-md"
                                                                >
                                                                    {reason.replace(/_/g, ' ')}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                No reason provided
                                                            </span>
                                                        )}
                                                    </div>

                                                    <span className="text-[11px] text-gray-400 shrink-0">
                                                        {new Date(report.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {report.notes || 'No additional notes provided.'}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400">
                                            No report records available.
                                        </p>
                                    )}
                                </div>
                            </section>

                            {/* 5. AI Assessment */}
                            <section className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-900">
                                    AI Assessment
                                </h3>

                                {/* Severity Progress */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-gray-500">
                                            Risk Level
                                        </span>
                                        <span className="font-semibold text-gray-700">
                                            {Math.min(100, Math.max(0, currentTicket.calculated_severity_score))} / 100
                                        </span>
                                    </div>

                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, currentTicket.calculated_severity_score))}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* AI Insights */}
                                <div className="border border-gray-100 rounded-xl p-3">
                                    <p className="text-xs font-semibold text-gray-500 mb-1.5">
                                        AI Insights
                                    </p>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {currentTicket.ai_insights_summary || 'AI insights are not available yet.'}
                                    </p>
                                </div>

                                {/* AI Confidence Assessment */}
                                <div className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-gray-500">
                                            AI Confidence Assessment
                                        </p>

                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${currentTicket.ai_confidence_level === 'High'
                                            ? 'bg-green-50 text-green-700'
                                            : currentTicket.ai_confidence_level === 'Low'
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {currentTicket.ai_confidence_level || 'Not Available'}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-gray-500">Confidence Score</span>
                                            <span className="font-semibold text-gray-700">
                                                {currentTicket.ai_confidence_score !== null
                                                    ? `${currentTicket.ai_confidence_score}%`
                                                    : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, currentTicket.ai_confidence_score ?? 0))}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-xs font-medium text-gray-500 mb-1">
                                            Confidence Explanation
                                        </p>
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                            {currentTicket.ai_confidence_explanation ||
                                                'Confidence explanation is not available yet.'}
                                        </p>
                                    </div>

                                    <p className="text-[11px] text-gray-400">
                                        Confidence indicates the reliability of the AI assessment, not the final moderation decision.
                                        All reports require administrator review.
                                    </p>
                                </div>

                                {/* AI Severity Factor Breakdown */}
                                <div className="border border-gray-100 rounded-xl p-3 space-y-3">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500">
                                            AI Severity Factor Breakdown
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            Individual factor scores contributing to the overall severity score
                                        </p>
                                    </div>

                                    {[
                                        {
                                            label: 'Report Frequency',
                                            score: currentTicket.ai_report_frequency_score
                                        },
                                        {
                                            label: 'Report Consistency',
                                            score: currentTicket.ai_report_consistency_score
                                        },
                                        {
                                            label: 'Food Safety Concern',
                                            score: currentTicket.ai_food_safety_score
                                        },
                                        {
                                            label: 'Evidence Strength',
                                            score: currentTicket.ai_evidence_strength_score
                                        }
                                    ].map((factor) => (
                                        <div key={factor.label}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs text-gray-600">
                                                    {factor.label}
                                                </span>
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {factor.score !== null ? `${factor.score}/100` : 'N/A'}
                                                </span>
                                            </div>

                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0, factor.score ?? 0))}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Suggested Action */}
                                <div className="bg-green-50/70 border border-green-100 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={15} className="text-green-700" />
                                        <p className="text-sm font-semibold text-green-800">
                                            Suggested Action
                                        </p>
                                    </div>

                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {currentTicket.ai_suggested_action || 'No AI suggestion available yet.'}
                                    </p>

                                    <p className="text-[11px] text-gray-400 mt-2">
                                        AI-generated recommendation. Administrator review is required.
                                    </p>
                                </div>
                            </section>

                        </div>

                        {/* Fixed Bottom Actions */}
                        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-3 flex items-center justify-between gap-3">

                            <p className="hidden sm:block text-xs text-gray-400">
                                Review the evidence before making a decision.
                            </p>

                            <button
                                onClick={() => handleDismissTicket(currentTicket.id)}
                                disabled={currentTicket.ticket_status === 'resolved'}
                                className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                Dismiss Report
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}