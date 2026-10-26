
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    UserRound,
    Mail,
    GraduationCap,
    ShieldCheck,
    PackageCheck,
    HandPlatter,
    CircleCheck,
    Clock,
    XCircle,
    CalendarDays,
    MapPin,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type UserActivityDetails = {
    user: {
        id: string;
        name: string;
        email: string;
        app_role: string;
        sub_roles: string;
        studentId: string;
        accountStatus: string;
        isRestricted: boolean;
    };
    stats: {
        foodShared: number | null;
        foodClaimed: number | null;
        successfulPickups: number | null;
        pendingClaims: number | null;
    };
    claims: Array<{
        id: string;
        eventName: string;
        location: string;
        claimedAt: string;
        pickupStart: string | null;
        checkinAt: string | null;
        checkedIn: boolean;
        status: string;
    }>;
    listings: {
        id: string;
        eventName: string;
        location: string;
        createdAt: string;
        pickupStart: string;
        pickupEnd: string;
        status: string;
        paxTotal: number;
        paxRemaining: number;
    }[];
};

function StatCard({
    title,
    value,
    description,
    icon: Icon,
}: {
    title: string;
    value: number;
    description: string;
    icon: React.ElementType;
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-[#212121]">
                        {value}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">{description}</p>
                </div>

                <div className="rounded-lg bg-[#E8F5E9] p-3 text-[#2E7D32]">
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

function ClaimStatus({ status }: { status: string }) {
    const styles: Record<string, string> = {
        completed: 'bg-green-100 text-green-700',
        pending: 'bg-amber-100 text-amber-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'
                }`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

export function UserActivityDetails() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [userActivity, setUserActivity] = useState<UserActivityDetails | null>(null);

    useEffect(() => {
        const fetchUserActivity = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/user-activity/${userId}`);
                if (!response.ok) {
                    throw new Error(`Server status: ${response.status}`);
                }

                const data: UserActivityDetails = await response.json();
                console.log('USER ACTIVITY DETAILS:', data);
                setUserActivity(data);
            } catch (error) {
                console.error('Failed to fetch user activity:', error);
            }
        };

        fetchUserActivity();
    }, []);

    const subRoles = userActivity?.user?.sub_roles || "";

    const isProvider = subRoles.includes("provider");
    const isReceiver = subRoles.includes("receiver");

    return (
        <div className="min-h-screen bg-[#F8FAF8] p-4 md:p-8">
            {/* Page heading */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/user-activity')}
                    className="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-[#2E7D32]"
                >
                    <ArrowLeft size={18} />
                    Back to User Activity
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-[#212121]">
                        User Activity Details
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Review user information and food-sharing activity.
                    </p>
                </div>
            </div>

            {/* User profile */}
            <section className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                        <UserRound size={32} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-semibold text-[#212121]">
                                {userActivity?.user.name}
                            </h2>

                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                {userActivity?.user.accountStatus}
                            </span>
                        </div>

                        <p className="mt-1 break-all text-sm text-gray-500">
                            {userActivity?.user.email}
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                            User ID: {userId}
                        </p>
                    </div>

                    <span className="w-fit rounded-lg bg-[#F1F8F2] px-4 py-2 text-sm font-medium capitalize text-[#2E7D32]">
                        {userActivity?.user.app_role}
                    </span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                        <Mail size={19} className="text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="break-all text-sm font-medium text-gray-700">
                                {userActivity?.user.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <GraduationCap size={20} className="text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-400">Student ID</p>
                            <p className="text-sm font-medium text-gray-700">
                                {userActivity?.user.studentId}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Activity summary */}
            <section className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-[#212121]">
                    Activity Overview
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {isProvider && (
                        <StatCard
                            title="Food Shared"
                            value={userActivity?.stats.foodShared ?? 0}
                            description="Food listings created"
                            icon={PackageCheck}
                        />
                    )}

                    {isReceiver && (
                        <>
                            <StatCard
                                title="Food Claimed"
                                value={userActivity?.stats.foodClaimed ?? 0}
                                description="Total claims made"
                                icon={HandPlatter}
                            />

                            <StatCard
                                title="Successful Pickups"
                                value={userActivity?.stats.successfulPickups ?? 0}
                                description="Claims completed"
                                icon={CircleCheck}
                            />

                            <StatCard
                                title="Pending Claims"
                                value={userActivity?.stats.pendingClaims ?? 0}
                                description="Awaiting completion"
                                icon={Clock}
                            />
                        </>
                    )}
                </div>

                {!isProvider && !isReceiver && (
                    <p className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-gray-500">
                        This user has no registered food-sharing roles.
                    </p>
                )}
            </section>

            {/* Listing History */}
            {isProvider && (
                <section className="mb-8 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-5">
                        <h2 className="text-lg font-semibold text-[#212121]">
                            Listing History
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Food listings created by this user.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px]">
                            <thead className="bg-[#F9FBF9]">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500">
                                        Food Event
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500">
                                        Pickup Location
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500">
                                        Created At
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {userActivity?.listings?.map((listing) => (
                                    <tr
                                        key={listing.id}
                                        className="border-b border-gray-100 last:border-0 hover:bg-[#F9FBF9]"
                                    >
                                        <td className="px-5 py-4 text-sm font-medium text-gray-800">
                                            {listing.eventName}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-2">
                                                <MapPin size={15} />
                                                {listing.location}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            {listing.createdAt
                                                ? new Date(listing.createdAt).toLocaleDateString(
                                                    "en-MY",
                                                    {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    }
                                                )
                                                : "—"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${listing.status === "available"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {listing.status === "available"
                                                    ? "Available"
                                                    : "Not Available"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {userActivity?.listings?.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-10 text-center text-sm text-gray-400"
                                        >
                                            No food listings created by this user yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Claim history */}
            {isReceiver && (
                <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-5">
                        <h2 className="text-lg font-semibold text-[#212121]">
                            Claim History
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Food listings claimed by this user.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead className="bg-[#F9FBF9]">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500">
                                        Food Event
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500">
                                        Pickup Location
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500">
                                        Claimed At
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {userActivity?.claims.map((claim) => (
                                    <tr
                                        key={claim.id}
                                        className="border-b border-gray-100 last:border-0 hover:bg-[#F9FBF9]"
                                    >
                                        <td className="px-5 py-4 text-sm font-medium text-gray-800">
                                            {claim.eventName}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-2">
                                                <MapPin size={15} />
                                                {claim.location}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-2">
                                                <CalendarDays size={15} />
                                                {claim.claimedAt}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <ClaimStatus status={claim.status} />
                                        </td>
                                    </tr>
                                ))}

                                {userActivity?.claims.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-10 text-center text-sm text-gray-400"
                                        >
                                            No claim history available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
