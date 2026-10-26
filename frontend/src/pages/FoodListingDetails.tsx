import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, MapPin, ExternalLink, Calendar, Clock, Users, Pencil, Ban, Flag, Loader2, Utensils, Image as ImageIcon, UserRound, Mail, Phone, GraduationCap, ShieldCheck, CalendarPlus, FileText,
    IdCard,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatDate, formatDateTime, formatTime } from '../utils/dateFormatter';
import { StatusBadge, type StatusVariant } from '../components/StatusBadge';
import Button from '@/components/ui/button';
import CardContainer from '@/components/CardContainer';

interface FoodListing {
    id: string;
    host_uid: string;
    event_name: string;
    food_type: string;
    pax_total: number;
    pax_remaining: number;
    pickup_location: string;
    lat: number;
    lng: number;
    pickup_start: string;
    pickup_end: string;
    image_url: string | null;
    status: string;
    created_at: string;
    short_description: string | null;
    dietary_preferences: string[];
    users?: {
        uid: string;
        name: string | '';
        email: string | null;
        app_role: string | null;
        sub_roles: string[] | null;
        student_id: string | null;
        avatar_url: string | null;
        phone_number: string | null;
        created_at: string | null;
        is_restricted: boolean | null;
    } | null;
}

function InfoRow({
    icon: Icon,
    label,
    children,
}: {
    icon: typeof MapPin;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                <Icon size={18} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500">{label}</p>
                <div className="mt-1 break-words text-sm font-medium text-gray-900">
                    {children}
                </div>
            </div>
        </div>
    );
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function FoodListingDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [listing, setListing] = useState<FoodListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        async function fetchListings() {
            if (!id) {
                setErrorMessage('Food listing ID is missing.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setErrorMessage(null);

            try {
                const response = await fetch(`${API_BASE_URL}/food-listings/${id}`);

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Visibility update rejected by server.');
                }

                if (!result) {
                    setErrorMessage('Food listing not found.');
                    return;
                }

                setListing(result as FoodListing);
                setLoading(false);

            } catch (error: any) {
                setErrorMessage(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();

    }, [id]);

    const mapsUrl = listing
        ? `https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`
        : '';

    async function handleCloseListing() {
        if (!listing) return;

        const confirmed = window.confirm(
            `Are you sure you want to close "${listing.event_name}"?`
        );

        if (!confirmed) return;

        setClosing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/food-listings/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'not_available' }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Visibility update rejected by server.');
            }

            setListing({ ...listing, status: 'not_available' });

            alert(`Listing successfully marked as ${'not_available'}!`);

        } catch (error: any) {
            alert(`Could not update database: ${error.message}`);
        }

        setClosing(false);
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center gap-3 text-gray-500">
                <Loader2 className="animate-spin" size={22} />
                Loading food listing...
            </div>
        );
    }

    if (errorMessage || !listing) {
        return (
            <div className="p-6">
                <button
                    onClick={() => navigate('/food-listings')}
                    className="mb-5 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={16} />
                    Back to Food Listings
                </button>

                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    {errorMessage || 'Food listing not found.'}
                </div>
            </div>
        );
    }

    const isAvailable = listing.status.toLowerCase() === 'available';

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Page header */}
                <button
                    onClick={() => navigate('/food-listings')}
                    className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
                >
                    <ArrowLeft size={17} />
                    Back to Food Listings
                </button>

                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Food Listing Details
                            </h1>

                            <StatusBadge
                                status={listing.status.toLowerCase().replace(/\s+/g, '_') as StatusVariant}
                                label={listing.status} />
                        </div>

                        <p className="break-all text-sm text-gray-500">
                            Listing ID: {listing.id}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            // Connect this to your Edit Listing page or modal later.
                            window.alert('Connect this button to your Edit Listing form.');
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                        <Pencil size={16} />
                        Edit Listing
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Food information */}
                        <CardContainer title="Food Information">
                            <div className="p-5 sm:p-6 grid gap-5 sm:grid-cols-[220px_1fr]">
                                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:aspect-square">
                                    {listing.image_url ? (
                                        <img
                                            src={listing.image_url}
                                            alt={listing.event_name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <ImageIcon size={36} />
                                            <span className="text-sm">No food image available</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Event Name</p>
                                        <h2 className="mt-1 text-xl font-bold text-gray-900">
                                            {listing.event_name}
                                        </h2>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">Food Type</p>
                                        <div className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <Utensils size={16} className="text-gray-500" />
                                            {listing.food_type}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-gray-50 p-4">
                                            <p className="text-sm text-gray-500">Total Portions</p>
                                            <p className="mt-1 text-2xl font-bold text-gray-900">
                                                {listing.pax_total}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-gray-50 p-4">
                                            <p className="text-sm text-gray-500">Remaining</p>
                                            <p className="mt-1 text-2xl font-bold text-gray-900">
                                                {listing.pax_remaining}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {listing.short_description && (
                                <div className="p-5 sm:p-6 border-t border-gray-100 pt-5">
                                    <div className="mb-2 flex items-center gap-2">
                                        <FileText size={17} className="text-gray-500" />
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            Description
                                        </h3>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                                        {listing.short_description}
                                    </p>
                                </div>
                            )}

                            <div className='px-5 sm:px-6 mb-5'>
                                <p className="mb-2 text-sm font-semibold text-gray-800">
                                    Dietary Preferences
                                </p>

                                {listing.dietary_preferences.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {listing.dietary_preferences.map((preference) => (
                                            <span
                                                key={preference}
                                                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
                                            >
                                                {preference}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">
                                        No dietary preferences specified.
                                    </p>
                                )}
                            </div>
                        </CardContainer>

                        {/* Pickup details */}
                        <CardContainer title="Pickup Details">
                            <div className="space-y-5 p-5 sm:p-6">
                                <InfoRow icon={MapPin} label="Pickup Location">
                                    <div className="group relative inline-block max-w-full">
                                        <a
                                            href={mapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-left text-blue-700 underline decoration-dotted underline-offset-4 hover:text-blue-900"
                                        >
                                            <span>{listing.pickup_location}</span>
                                            <ExternalLink
                                                size={14}
                                                className="shrink-0"
                                            />
                                        </a>

                                        {/* Hover preview */}
                                        <div className="invisible absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                                            <p className="mb-2 text-sm font-semibold text-gray-900">
                                                Location Coordinates
                                            </p>

                                            <p className="text-xs text-gray-600">
                                                Latitude: {listing.lat}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-600">
                                                Longitude: {listing.lng}
                                            </p>

                                            <a
                                                href={mapsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                                            >
                                                Open in Google Maps
                                                <ExternalLink size={13} />
                                            </a>
                                        </div>
                                    </div>
                                </InfoRow>

                                <InfoRow icon={Calendar} label="Pickup Starts">
                                    {formatDateTime(listing.pickup_start)}
                                </InfoRow>

                                <InfoRow icon={Clock} label="Pickup Ends">
                                    {formatDateTime(listing.pickup_end)}
                                </InfoRow>

                                <InfoRow icon={CalendarPlus} label="Listing Created">
                                    {formatDateTime(listing.created_at)}
                                </InfoRow>
                            </div>
                        </CardContainer>

                        {/* Host information */}
                        <CardContainer title="Host Information">
                            <div className="p-5 sm:p-6 flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                                {listing.users?.avatar_url ? (
                                    <img
                                        src={listing.users?.avatar_url}
                                        alt={listing.users?.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="rounded-full bg-white p-3 text-gray-500">
                                        <UserRound size={24} />
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900">Host Profile</p>
                                    <p className="mt-1 mb-3 text-sm text-gray-500">
                                        Host UID: {listing.host_uid}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InfoRow icon={Users} label="Name">
                                            {listing.users?.name || 'N/A'}
                                        </InfoRow>
                                        <InfoRow icon={IdCard} label="Student ID">
                                            {listing.users?.student_id || 'N/A'}
                                        </InfoRow>
                                        <InfoRow icon={Mail} label="Email">
                                            <a href={`mailto:${listing.users?.email}`}
                                                className='text-blue-600 hover:underline'
                                            >
                                                {listing.users?.email || 'N/A'}
                                            </a>
                                        </InfoRow>
                                        <InfoRow icon={Phone} label="Phone">
                                            <a href={`tel:${listing.users?.phone_number}`}>
                                                {listing.users?.phone_number || 'N/A'}
                                            </a>
                                        </InfoRow>
                                        <InfoRow icon={CalendarPlus} label="Created At">
                                            {formatDateTime(listing.users?.created_at ?? '')}
                                        </InfoRow>
                                        <InfoRow icon={ShieldCheck} label="Restricted">
                                            {listing.users?.is_restricted ? 'Yes' : 'No'}
                                        </InfoRow>
                                    </div>

                                </div>
                            </div>
                        </CardContainer>
                    </div>

                    {/* Admin sidebar */}
                    <aside className="space-y-6">
                        <CardContainer title="Listing Summary">
                            <div className="p-5 sm:p-6 space-y-4">
                                <InfoRow icon={Utensils} label="Food Type">
                                    {listing.food_type}
                                </InfoRow>

                                <InfoRow icon={Users} label="Portions">
                                    {listing.pax_remaining} of {listing.pax_total} remaining
                                </InfoRow>

                                <InfoRow icon={Calendar} label="Pickup Starts">
                                    {formatDateTime(listing.pickup_start)}
                                </InfoRow>

                                <InfoRow icon={Clock} label="Pickup Ends">
                                    {formatDateTime(listing.pickup_end)}
                                </InfoRow>
                            </div>
                        </CardContainer>

                        <CardContainer title="Admin Actions">
                            <div className="p-5 sm:p-6 space-y-3">
                                <Button
                                    variant='primary'
                                    onClick={() => {
                                        // Replace with food claim listing.
                                        navigate(`/food-listings/${listing.id}/claims`);
                                    }}
                                // className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                >
                                    <Users size={17} />
                                    View Claims
                                </Button>

                                <Button
                                    onClick={handleCloseListing}
                                    disabled={!isAvailable || closing}
                                    variant='destructive'
                                >
                                    {closing ? (
                                        <Loader2 size={17} className="animate-spin" />
                                    ) : (
                                        <Ban size={17} />
                                    )}
                                    {closing ? 'Closing...' : 'Close Listing'}
                                </Button>

                                <Button
                                    onClick={() => {
                                        // Connect to your reporting/flagging workflow.
                                        window.alert('Connect this button to your flagging workflow.');
                                    }}
                                    variant='secondary'
                                >
                                    <Flag size={17} />
                                    Flag Listing
                                </Button>
                            </div>

                            <p className="px-5 sm:px-6 mb-5 text-xs leading-5 text-gray-500">
                                Closing a listing changes its status to closed. Other actions
                                must be connected to their respective workflows.
                            </p>
                        </CardContainer>
                    </aside>
                </div>
            </div>
        </div>
    );
}