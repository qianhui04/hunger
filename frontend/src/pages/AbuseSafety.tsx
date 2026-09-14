import { useState, useMemo } from 'react';
import {
    AlertTriangle, MessageSquare, Settings, Sparkles,
    Sliders, Search, Eye, Filter, Info
} from 'lucide-react';

// ==========================================
// DATA STRUCTURAL INTERFACES
// ==========================================
interface AbuseTicket {
    id: string;
    targetObjectId: string;
    reportedUser: {
        name: string;
        email: string;
        violationCount: number;
        behavioralTag: 'Chronic Offender' | 'First Time Flag' | 'Suspicious Spike' | 'Clean Record';
    };
    category: 'Hate Speech' | 'Harassment' | 'Threat of Violence' | 'Spam / Scam';
    rawContent: string;
    flaggedPhrases: string[];
    reportCount: number;
    aiSeverityScore: number;
    aiSuggestedAction: 'Immediate Suspension' | 'Issue Content Warning' | 'Dismiss Report';
    timestamp: string;
}

const initialTickets: AbuseTicket[] = [
    {
        id: 'TKT-9012',
        targetObjectId: 'POST-4412',
        reportedUser: {
            name: 'Alex Rivera',
            email: 'arivera99@domain.com',
            violationCount: 4,
            behavioralTag: 'Chronic Offender',
        },
        category: 'Threat of Violence',
        rawContent: "I know where you live and I will personally come down there next Friday and make sure you pay for what you said.",
        flaggedPhrases: ["know where you live", "personally come down", "make sure you pay"],
        reportCount: 14,
        aiSeverityScore: 94,
        aiSuggestedAction: 'Immediate Suspension',
        timestamp: '10 mins ago',
    },
    {
        id: 'TKT-3341',
        targetObjectId: 'POST-8821',
        reportedUser: {
            name: 'Jordan Sparks',
            email: 'jsparks@domain.com',
            violationCount: 1,
            behavioralTag: 'First Time Flag',
        },
        category: 'Hate Speech',
        rawContent: "Get out of our community you absolute piece of trash, your kind is fundamentally inferior and shouldn't exist here.",
        flaggedPhrases: ["piece of trash", "fundamentally inferior", "shouldn't exist here"],
        reportCount: 6,
        aiSeverityScore: 82,
        aiSuggestedAction: 'Immediate Suspension',
        timestamp: '34 mins ago',
    },
    {
        id: 'TKT-1102',
        targetObjectId: 'USER-9941',
        reportedUser: {
            name: 'CryptoBot_v4',
            email: 'bot441@spammail.net',
            violationCount: 2,
            behavioralTag: 'Suspicious Spike',
        },
        category: 'Spam / Scam',
        rawContent: "CLICK HERE TO CLAIM YOUR $5000 AIRDROP IMMEDIATELY!! Safe coin guaranteed 100x gains overnight don't miss out links below!",
        flaggedPhrases: ["CLAIM YOUR $5000 AIRDROP", "100x gains overnight"],
        reportCount: 41,
        aiSeverityScore: 68,
        aiSuggestedAction: 'Issue Content Warning',
        timestamp: '1 hour ago',
    }
];

export function AbuseSafety() {
    // Core Operational States
    const [tickets, setTickets] = useState<AbuseTicket[]>(initialTickets);
    const [selectedTicketId, setSelectedTicketId] = useState<string>(initialTickets[0].id);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // AI Parameter Weights Control States (FR: Global Triage Adjustments)
    const [aiSensitivity, setAiSensitivity] = useState(75);
    const [confidenceThreshold, setConfidenceThreshold] = useState(80);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Active Target Context Resolution
    const currentTicket = useMemo(() => {
        return tickets.find(t => t.id === selectedTicketId) || tickets[0];
    }, [tickets, selectedTicketId]);

    // Automated Severity Sort Engine (FR: Escalated Triage Ranking Placement)
    const processedQueue = useMemo(() => {
        return tickets
            .filter(t => t.reportedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(t => categoryFilter === 'All' || t.category === categoryFilter)
            .sort((a, b) => b.aiSeverityScore - a.aiSeverityScore);
    }, [tickets, searchTerm, categoryFilter]);

    const handleApplyAiSuggestion = (ticketId: string, action: string) => {
        alert(`AI Recommendation Executed:\nProcessing target action [${action}] for ticket reference ${ticketId}.`);
        setTickets(prev => prev.filter(t => t.id !== ticketId));
    };

    const handleDismissTicket = (ticketId: string) => {
        alert(`Ticket ${ticketId} cleared.`);
        setTickets(prev => prev.filter(t => t.id !== ticketId));
    };

    // Automated Behavior Tag Layout Mapper (FR: Activity Telemetry Labels)
    const getBehaviorTagStyles = (tag: string) => {
        switch (tag) {
            case 'Chronic Offender': return 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]';
            case 'Suspicious Spike': return 'bg-[#FFF3E0] text-[#EF6C00] border-[#FFE0B2]';
            case 'First Time Flag': return 'bg-[#FFFDE7] text-[#F57F17] border-[#FFF9C4]';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

            {/* Primary Global Insight Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] rounded-xl p-6 border border-[#2E7D32]/20">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquare size={20} className="text-[#2E7D32]" />
                        <h3 className="text-sm font-medium text-[#1B5E20]">Queue Compression</h3>
                    </div>
                    <p className="text-2xl font-semibold text-[#1B5E20]">{tickets.reduce((acc, t) => acc + t.reportCount, 0)} Reports Packed</p>
                    <p className="text-xs text-[#558B2F] mt-1">Aggregated logs under active object signatures</p>
                </div>

                <div className="bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] rounded-xl p-6 border border-[#2E7D32]/20">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle size={20} className="text-[#2E7D32]" />
                        <h3 className="text-sm font-medium text-[#1B5E20]">Peak Threat Outbreak</h3>
                    </div>
                    <p className="text-2xl font-semibold text-[#1B5E20]">Threat of Violence</p>
                    <p className="text-xs text-[#558B2F] mt-1">Highest escalation priority tier</p>
                </div>

                <div className="bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] rounded-xl p-6 border border-[#2E7D32]/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Sliders size={20} className="text-[#2E7D32]" />
                        <h3 className="text-sm font-medium text-[#1B5E20]">Triage Confidence</h3>
                    </div>
                    <p className="text-2xl font-semibold text-[#1B5E20]">{confidenceThreshold}% Floor</p>
                    <p className="text-xs text-[#558B2F] mt-1">Minimum system classification certainty</p>
                </div>
            </div>

            {/* Global AI Weights Calibration Form Block */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                        <Settings size={24} className="text-[#2E7D32]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[#212121]">AI Sensitivity Configuration</h2>
                        <p className="text-sm text-[#9E9E9E]">Adjust algorithmic sensitivity weights and confidence flags below</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[#212121] mb-2">
                            Toxic Content Sensitivity Trigger ({aiSensitivity}%)
                        </label>
                        <input
                            type="range" min="50" max="100" value={aiSensitivity}
                            onChange={(e) => setAiSensitivity(Number(e.target.value))}
                            className="w-full accent-[#2E7D32] bg-[#F5FAF5] h-2 rounded-lg appearance-none cursor-pointer border border-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#212121] mb-2">
                            Escalation Match Confidence Floor ({confidenceThreshold}%)
                        </label>
                        <input
                            type="range" min="60" max="100" value={confidenceThreshold}
                            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                            className="w-full accent-[#2E7D32] bg-[#F5FAF5] h-2 rounded-lg appearance-none cursor-pointer border border-gray-100"
                        />
                    </div>
                </div>
            </div>

            {/* Primary Workspace Dual Columns Split (FR: Review Submitted Abuse Reports View) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Pane: Priority Sorted Incident Feed Column */}
                <div className="lg:col-span-5 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">

                    <div className="p-4 border-b border-gray-100 bg-[#F9FBF9] space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={16} />
                            <input
                                type="text"
                                placeholder="Search ticket hash reference or identifiers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#9E9E9E] flex items-center gap-1">
                                <Filter size={12} /> Categories
                            </span>
                            <div className="flex gap-1 overflow-x-auto">
                                {['All', 'Hate Speech', 'Threat of Violence', 'Spam / Scam'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${categoryFilter === cat
                                            ? 'bg-[#2E7D32] text-white shadow-sm'
                                            : 'bg-white text-[#9E9E9E] border border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {cat === 'All' ? 'All' : cat.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Feed Execution Mapping Area */}
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {processedQueue.length > 0 ? (
                            processedQueue.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={`p-4 cursor-pointer transition-all flex flex-col gap-2 ${selectedTicketId === ticket.id
                                        ? 'bg-[#E8F5E9]/30 border-l-4 border-[#2E7D32]'
                                        : 'hover:bg-[#F9FBF9]'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold text-[#212121]">{ticket.id}</span>
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-[#9E9E9E]">
                                                Obj: {ticket.targetObjectId}
                                            </span>
                                        </div>
                                        <div className="bg-gray-900 text-white font-mono font-semibold text-[10px] px-1.5 py-0.5 rounded">
                                            Risk: {ticket.aiSeverityScore}%
                                        </div>
                                    </div>

                                    <p className="text-xs text-[#212121] line-clamp-2 italic">"{ticket.rawContent}"</p>

                                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-50 text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-[#212121]">{ticket.reportedUser.name}</span>
                                            <span className="bg-[#F1F8E9] text-[#2E7D32] border border-[#2E7D32]/20 rounded px-1 text-[10px] font-bold">
                                                Count: {ticket.reportCount}
                                            </span>
                                        </div>
                                        <span className="text-[#9E9E9E]">{ticket.timestamp}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-[#9E9E9E] text-sm">
                                No active records match parameters
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Pane: Incident Inspection Workspace Details Frame */}
                {currentTicket && (
                    <div className="lg:col-span-7 bg-white border border-gray-100 rounded-xl shadow-sm p-6 h-[600px] flex flex-col justify-between">

                        <div className="space-y-5 overflow-y-auto pr-1">
                            {/* Workspace Context Top Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20">
                                        {currentTicket.category}
                                    </span>
                                    <h2 className="text-base font-semibold text-[#212121] mt-2 flex items-center gap-1">
                                        Evidence File Evaluation
                                        <span className="text-xs font-mono font-normal text-[#9E9E9E]">({currentTicket.id})</span>
                                    </h2>
                                </div>
                            </div>

                            {/* Target Entity Parameters Sub-Grid */}
                            <div className="bg-[#F9FBF9] border border-gray-100 rounded-xl p-4 space-y-3">
                                <h3 className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider">Account Telemetry Context</h3>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-[#212121]">
                                            {currentTicket.reportedUser.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-[#212121]">{currentTicket.reportedUser.name}</span>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getBehaviorTagStyles(currentTicket.reportedUser.behavioralTag)}`}>
                                                    {currentTicket.reportedUser.behavioralTag}
                                                </span>
                                            </div>
                                            <span className="text-xs text-[#9E9E9E]">{currentTicket.reportedUser.email}</span>
                                        </div>
                                    </div>

                                    <div className="text-xs flex gap-4 bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
                                        <div>
                                            <span className="text-[#9E9E9E] block text-[10px]">Identical Clusters</span>
                                            <span className="text-xs font-bold text-[#212121]">{currentTicket.reportCount} Packed</span>
                                        </div>
                                        <div className="border-l border-gray-100 pl-4">
                                            <span className="text-[#9E9E9E] block text-[10px]">Prior Flags</span>
                                            <span className="text-xs font-bold text-[#212121]">{currentTicket.reportedUser.violationCount} History</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Incident Document Viewer Container */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider flex items-center gap-1">
                                    <Eye size={12} /> Content Analysis Highlight System
                                </label>
                                <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-[100px] shadow-sm">
                                    {renderHighlightedContent(currentTicket.rawContent, currentTicket.flaggedPhrases)}
                                </div>
                            </div>

                            {/* Automation Core Reasoning Rationale Box */}
                            <div className="bg-[#F5FAF5] border border-[#2E7D32]/10 rounded-xl p-4 flex gap-3 items-start">
                                <Info size={16} className="text-[#2E7D32] shrink-0 mt-0.5" />
                                <p className="text-xs text-[#1B5E20] leading-relaxed">
                                    <strong>Triage Note:</strong> Content string match targets resource object <strong>{currentTicket.targetObjectId}</strong>. Multi-user duplicates are consolidated automatically into this review node profile.
                                </p>
                            </div>
                        </div>

                        {/* Bottom Panel: Dedicated AI Suggested Action Workspace */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 bg-white">
                            <button
                                onClick={() => handleDismissTicket(currentTicket.id)}
                                className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-[#9E9E9E] hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors text-center"
                            >
                                Dismiss Report
                            </button>

                            {/* AI Suggested Action Dispatch Action Button */}
                            <button
                                onClick={() => handleApplyAiSuggestion(currentTicket.id, currentTicket.aiSuggestedAction)}
                                className="w-full sm:w-auto bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                            >
                                <Sparkles size={14} />
                                <span>Execute AI Suggested Action: <strong>{currentTicket.aiSuggestedAction}</strong></span>
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}