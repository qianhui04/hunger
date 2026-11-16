import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    CheckCircle,
    Clock,
    Loader2,
    Mail,
    Phone,
    GraduationCap,
} from 'lucide-react';
import { formatDateTime } from '../utils/dateFormatter';
import CardContainer from '@/components/CardContainer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Claim {
    id: string;
    user_uid: string;
    claimed_at: string | null;
    checked_in: boolean;
    checkin_at: string | null;
    status: string;
    users: {
        uid: string;
        name: string | null;
        email: string | null;
        student_id: string | null;
        phone_number: string | null;
    } | null;
}

interface ClaimsResponse {
    claims: Claim[];
    totalClaims: number;
}

interface FoodListing {
    id: string;
    event_name: string;
}

export function FoodListingClaims() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [claims, setClaims] = useState<Claim[]>([]);
    const [listing, setListing] = useState<FoodListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!id) {
                setErrorMessage('Food listing ID is missing.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setErrorMessage(null);

                const [claimsResponse, listingResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/food-listings/${id}/claims`),
                    fetch(`${API_BASE_URL}/food-listings/${id}`),
                ]);

                const claimsResult: ClaimsResponse =
                    await claimsResponse.json();

                const listingResult = await listingResponse.json();

                if (!claimsResponse.ok) {
                    throw new Error('Failed to retrieve claims.');
                }

                if (!listingResponse.ok) {
                    throw new Error('Failed to retrieve food listing.');
                }

                setClaims(claimsResult.claims || []);
                setListing(listingResult);

            } catch (error: any) {
                setErrorMessage(error.message || 'Something went wrong.');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center gap-3 text-gray-500">
                <Loader2 className="animate-spin" size={22} />
                Loading claims...
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="p-6">
                <button
                    onClick={() => navigate(`/food-listings/${id}`)}
                    className="mb-5 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={16} />
                    Back to Listing Details
                </button>

                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    {errorMessage}
                </div>
            </div>
        );
    }

    const totalClaims = claims.length;
    const checkedInCount = claims.filter(
        claim => claim.checked_in
    ).length;
    const notCheckedInCount = totalClaims - checkedInCount;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl">

                <button
                    onClick={() => navigate(`/food-listings/${id}`)}
                    className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
                >
                    <ArrowLeft size={17} />
                    Back to Listing Details
                </button>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Food Listing Claims
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        {listing?.event_name || 'Food Listing'}
                    </p>

                    <p className="mt-1 break-all text-xs text-gray-400">
                        Listing ID: {id}
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                                <Users size={22} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Total Claims
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalClaims}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-50 p-3 text-green-600">
                                <CheckCircle size={22} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Checked In
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {checkedInCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
                                <Clock size={22} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Not Checked In
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {notCheckedInCount}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Claims Table */}
                <CardContainer title="Claimed Receivers">

                    {claims.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Users size={40} className="mb-3 text-gray-300" />
                            <p className="font-medium text-gray-700">
                                No Claims Found
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                                No users have claimed this food listing yet.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-5 py-4">Receiver</th>
                                        <th className="px-5 py-4">Contact</th>
                                        <th className="px-5 py-4">Claimed At</th>
                                        <th className="px-5 py-4">Check-in</th>
                                        <th className="px-5 py-4">Claim Status</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {claims.map((claim) => (
                                        <tr key={claim.id} className="hover:bg-gray-50">

                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-900">
                                                    {claim.users?.name || 'Unknown User'}
                                                </p>

                                                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                                    <GraduationCap size={13} />
                                                    {claim.users?.student_id || 'N/A'}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="flex items-center gap-2 text-gray-700">
                                                    <Mail size={13} />
                                                    {claim.users?.email || 'N/A'}
                                                </p>

                                                <p className="mt-1 flex items-center gap-2 text-gray-500">
                                                    <Phone size={13} />
                                                    {claim.users?.phone_number || 'N/A'}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                {claim.claimed_at
                                                    ? formatDateTime(claim.claimed_at)
                                                    : 'N/A'}
                                            </td>

                                            <td className="px-5 py-4">
                                                {claim.checked_in ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                                            <CheckCircle size={13} />
                                                            Checked In
                                                        </span>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {claim.checkin_at
                                                                ? formatDateTime(claim.checkin_at)
                                                                : 'Time unavailable'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                                        <Clock size={13} />
                                                        Not Checked In
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                                                    {claim.status || 'Unknown'}
                                                </span>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </CardContainer>

            </div>
        </div>
    );
}