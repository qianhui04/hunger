import { useEffect, useState } from 'react';
import {
    Settings,
    Sliders,
    Save,
    ShieldCheck,
    Loader2,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AIConfig {
    report_frequency_weight: number;
    report_consistency_weight: number;
    food_safety_weight: number;
    evidence_strength_weight: number;
    confidence_threshold: number;
}

export function AIConfiguration() {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';

    const [aiConfig, setAiConfig] = useState<AIConfig>({
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

    const totalWeight =
        aiConfig.report_frequency_weight +
        aiConfig.report_consistency_weight +
        aiConfig.food_safety_weight +
        aiConfig.evidence_strength_weight;

    useEffect(() => {
        const fetchAIConfig = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.access_token) {
                    throw new Error('Authentication session not found.');
                }

                const response = await fetch(`${API_BASE_URL}/ai-config`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || 'Failed to load AI configuration.'
                    );
                }

                setAiConfig({
                    report_frequency_weight: Number(result.data.report_frequency_weight),
                    report_consistency_weight: Number(result.data.report_consistency_weight),
                    food_safety_weight: Number(result.data.food_safety_weight),
                    evidence_strength_weight: Number(result.data.evidence_strength_weight),
                    confidence_threshold: Number(result.data.confidence_threshold)
                });

            } catch (error) {
                setConfigError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load AI configuration.'
                );
            } finally {
                setIsConfigLoading(false);
            }
        };

        if (user?.id) {
            fetchAIConfig();
        }
    }, [user?.id]);

    const handleSaveAIConfig = async () => {
        if (totalWeight !== 100) {
            setConfigError('Severity weights must add up to exactly 100%.');
            return;
        }

        setIsConfigSaving(true);
        setConfigError('');
        setConfigSuccess('');

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error('Authentication session not found.');
            }

            const response = await fetch(`${API_BASE_URL}/ai-config`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
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

            setAiConfig({
                report_frequency_weight: Number(result.data.report_frequency_weight),
                report_consistency_weight: Number(result.data.report_consistency_weight),
                food_safety_weight: Number(result.data.food_safety_weight),
                evidence_strength_weight: Number(result.data.evidence_strength_weight),
                confidence_threshold: Number(result.data.confidence_threshold)
            });

            setConfigSuccess('AI configuration saved successfully.');

        } catch (error) {
            setConfigError(
                error instanceof Error
                    ? error.message
                    : 'Unable to save AI configuration.'
            );
        } finally {
            setIsConfigSaving(false);
        }
    };

    const weightSettings = [
        {
            key: 'report_frequency_weight' as const,
            label: 'Report Frequency',
            description: 'Considers how frequently an object or user is reported.'
        },
        {
            key: 'report_consistency_weight' as const,
            label: 'Report Consistency',
            description: 'Evaluates whether multiple reports describe similar issues.'
        },
        {
            key: 'food_safety_weight' as const,
            label: 'Food Safety',
            description: 'Prioritises food quality and potential safety concerns.'
        },
        {
            key: 'evidence_strength_weight' as const,
            label: 'Evidence Strength',
            description: 'Considers the quality and detail of submitted evidence.'
        }
    ];

    if (isConfigLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                    <p className="text-sm text-gray-500">
                        Loading AI configuration...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 lg:p-8">

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
                        <Settings size={16} />
                        Abuse & Safety
                    </div>

                    <h1 className="admin-page-title text-2xl">
                        AI Configuration
                    </h1>

                    <p className="admin-page-description mt-1 text-sm">
                        Manage global parameters for AI-assisted abuse triage.
                    </p>
                </div>

                <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${isSuperAdmin
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    <ShieldCheck size={15} />
                    {isSuperAdmin ? 'Super Admin Access' : 'View Only'}
                </div>
            </div>

            {/* Configuration Overview */}
            <div className="admin-card p-5">
                <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                        <Sliders size={22} />
                    </div>

                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Global Triage Parameters
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-gray-500">
                            These parameters influence how the AI evaluates incoming
                            abuse reports and calculates ticket severity. Changes
                            apply globally to subsequent AI analyses.
                        </p>
                    </div>
                </div>
            </div>

            {/* Severity Weights */}
            <section className="admin-card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Severity Assessment Weights
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Adjust the contribution of each assessment factor.
                        </p>
                    </div>

                    <div className={`rounded-lg px-3 py-2 text-sm font-semibold ${totalWeight === 100
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                        }`}>
                        Total Weight: {totalWeight}%
                    </div>
                </div>

                <div className="space-y-7 p-5">
                    {weightSettings.map((setting) => (
                        <div key={setting.key}>
                            <div className="mb-3 flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800">
                                        {setting.label}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {setting.description}
                                    </p>
                                </div>

                                <span className="shrink-0 text-lg font-bold tabular-nums text-emerald-800">
                                    {aiConfig[setting.key]}%
                                </span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={aiConfig[setting.key]}
                                disabled={!isSuperAdmin}
                                onChange={(e) => {
                                    setAiConfig(prev => ({
                                        ...prev,
                                        [setting.key]: Number(e.target.value)
                                    }));
                                    setConfigSuccess('');
                                    setConfigError('');
                                }}
                                className="h-2 w-full cursor-pointer accent-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3">
                    <p className="text-xs text-gray-500">
                        The four severity weights must add up to exactly 100%.
                    </p>
                </div>
            </section>

            {/* Confidence Threshold */}
            <section className="admin-card p-5">
                <div className="mb-5">
                    <h2 className="font-semibold text-gray-900">
                        AI Confidence Threshold
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        Defines the confidence level used to classify AI assessment
                        results. This does not replace human review.
                    </p>
                </div>

                <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                        Confidence Threshold
                    </span>

                    <span className="text-xl font-bold tabular-nums text-emerald-800">
                        {aiConfig.confidence_threshold}%
                    </span>
                </div>

                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={aiConfig.confidence_threshold}
                    disabled={!isSuperAdmin}
                    onChange={(e) => {
                        setAiConfig(prev => ({
                            ...prev,
                            confidence_threshold: Number(e.target.value)
                        }));
                        setConfigSuccess('');
                        setConfigError('');
                    }}
                    className="h-2 w-full cursor-pointer accent-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <div className="mt-2 flex justify-between text-xs text-gray-400">
                    <span>0% · Lower threshold</span>
                    <span>100% · Higher threshold</span>
                </div>
            </section>

            {/* Feedback Messages */}
            {configError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{configError}</span>
                </div>
            )}

            {configSuccess && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span>{configSuccess}</span>
                </div>
            )}

            {/* Save Configuration */}
            {isSuperAdmin && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSaveAIConfig}
                        disabled={isConfigSaving || totalWeight !== 100}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#245B49] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#194638] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isConfigSaving ? (
                            <Loader2 size={17} className="animate-spin" />
                        ) : (
                            <Save size={17} />
                        )}

                        {isConfigSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            )}

        </div>
    );
}
