// models/reportModel.js
const supabase = require('../config/supabase');

class ReportModel {


    static async getOverallSummary(startDate, endDate) {
        // 1. Convert the selected dates to Malaysia local-day boundaries.
        const start = new Date(
            `${startDate}T00:00:00+08:00`
        ).toISOString();

        const end = new Date(
            new Date(`${endDate}T00:00:00+08:00`).getTime()
            + 24 * 60 * 60 * 1000
        ).toISOString();

        // 2. Get food listings created within the selected date range.
        const { data: listings, error: listingsError } = await supabase
            .from('food_listings')
            .select('id, pax_total, pax_remaining, status, pickup_end')
            .gte('created_at', start)
            .lt('created_at', end);

        if (listingsError) {
            throw listingsError;
        }

        const listingRows = listings || [];
        const listingIds = listingRows.map(listing => listing.id);

        // 3. Initialise claim data.
        let successfulClaims = [];
        let cancelledClaims = [];

        // 4. Get claims associated with these listings.
        if (listingIds.length > 0) {
            // Successful claims: completed and checked in.
            const {
                data: completedData,
                error: completedError
            } = await supabase
                .from('claims')
                .select('id, listing_id')
                .in('listing_id', listingIds)
                .eq('status', 'completed')
                .eq('checked_in', true);

            if (completedError) {
                throw completedError;
            }

            successfulClaims = completedData || [];

            // Cancelled claims.
            const {
                data: cancelledData,
                error: cancelledError
            } = await supabase
                .from('claims')
                .select('id, listing_id')
                .in('listing_id', listingIds)
                .eq('status', 'cancelled');

            if (cancelledError) {
                throw cancelledError;
            }

            cancelledClaims = cancelledData || [];
        }

        // 5. Count listings created in the selected date range.
        const totalFoodListings = listingRows.length;

        // 6. Count listings marked as not_available.
        const completedListings = listingRows.filter(
            listing => listing.status === 'not_available'
        ).length;

        // 7. Count successful distributions.
        // Assumption: one successful claim represents one portion.
        const totalPaxDistributed = successfulClaims.length;

        // 8. Calculate remaining portions.
        const totalPaxRemaining = listingRows.reduce(
            (total, listing) =>
                total + (Number(listing.pax_remaining) || 0),
            0
        );

        // 9. Estimate food saved (0.4 kg per distributed portion).
        const totalFoodSaved = Number(
            (totalPaxDistributed * 0.4).toFixed(2)
        );

        // 10. Collect listing IDs with cancelled claims.
        const cancelledListingIds = new Set(
            cancelledClaims.map(claim => claim.listing_id)
        );

        // 11. Collect listing IDs whose pickup period has ended.
        const now = new Date();

        const expiredListingIds = new Set(
            listingRows
                .filter(
                    listing =>
                        listing.pickup_end &&
                        new Date(listing.pickup_end) < now
                )
                .map(listing => listing.id)
        );

        // 12. Count unique listings that have cancelled claims
        // or whose pickup period has ended.
        const cancelledOrExpiredListings = new Set([
            ...cancelledListingIds,
            ...expiredListingIds
        ]).size;

        // 13. Return the summary report data.
        return {
            data_coverage: totalFoodListings,
            totalFoodListings,
            completedListings,
            cancelledOrExpiredListings,
            totalPaxDistributed,
            totalPaxRemaining,
            totalFoodSaved
        };
    }


    static async getFoodListings(startDate, endDate) {
        const { data: food_listings, error: foodListingsError } = await supabase
            .from('food_listings')
            .select(`
                *,
                users (
                    name
                ),
                claims (
                    id,
                    checked_in,
                    status
                )
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: false });

        if (foodListingsError) throw foodListingsError;

        return { food_listings };
    }

    static async getUserActivity(startDate, endDate) {

        // total number of users
        const { count, error } = await supabase
            .from('users')
            .select('*', {
                count: 'exact',
                head: true
            });

        if (error) throw error;

        // date format to ISO string
        const start = new Date(
            `${startDate}T00:00:00+08:00`
        ).toISOString();

        const end = new Date(
            new Date(`${endDate}T00:00:00+08:00`).getTime()
            + 24 * 60 * 60 * 1000
        ).toISOString();

        // total number of active users within time range
        const { data: claims, error: claimsError } = await supabase
            .from('claims')
            .select('user_uid')
            .gte('claimed_at', start)
            .lt('claimed_at', end);

        const activeUsers = new Set(
            (claims || []).map(claim => claim.user_uid)
        ).size;

        if (claimsError) throw claimsError;

        // total number of provider within time range
        const { count: providerCount, error: providerError } = await supabase
            .from('users')
            .select('*', {
                count: 'exact',
                head: true
            })
            .contains('sub_roles', ['provider']);

        if (providerError) throw providerError;

        // total number of successful claims within time range
        const { data: successfulClaims, error: successfulClaimsError } = await supabase
            .from('claims')
            .select('*', {
                count: 'exact',
                head: true
            })
            .eq('status', 'completed')
            .gte('claimed_at', start)
            .lt('claimed_at', end);

        if (successfulClaimsError) throw successfulClaimsError;

        // total number of users that successfully claimed the food within time range
        const { data: usersClaimed, error: usersClaimedError } = await supabase
            .from('claims')
            .select('user_uid')
            .eq('status', 'completed')
            .gte('checkin_at', start)
            .lt('checkin_at', end);

        const usersClaimedCount = new Set(
            (usersClaimed || []).map(claim => claim.user_uid)
        ).size;

        if (usersClaimedError) throw usersClaimedError;

        // total number of cancelled claim
        const { data: cancelledClaims, error: cancelledClaimsError } = await supabase
            .from('claims')
            .select('*', {
                count: 'exact',
                head: true
            })
            .eq('status', 'cancelled')
            .gte('claimed_at', start)
            .lt('claimed_at', end);

        if (cancelledClaimsError) throw cancelledClaimsError;

        return {
            totalRegisteredUsers: count ?? 0,
            totalActiveUsers: activeUsers,
            totalProviders: providerCount ?? 0,
            totalSuccessfulClaims: successfulClaims ?? 0,
            totalUsersSuccessfullyClaimed: usersClaimedCount,
            totalCancelledClaims: cancelledClaims ?? 0
        };
    }

    static async getLocationActivity(startDate, endDate) {

        // most pickup location
        const { data: mostPickUpLocation, error: mostPickUpLocationError } = await supabase
            .from('food_listings')
            .select(`
                pax_remaining, 
                pax_total,
                pickup_location
                `)
            .gte('created_at', startDate)
            .lt('created_at', endDate)

        if (mostPickUpLocationError) throw mostPickUpLocationError;

        return {
            mostPickUpLocation,
        }



    }

    static async getWasteReduction(startDate, endDate) {
        const start = new Date(
            `${startDate}T00:00:00+08:00`
        ).toISOString();

        const end = new Date(
            new Date(`${endDate}T00:00:00+08:00`).getTime()
            + 24 * 60 * 60 * 1000
        ).toISOString();

        // 1. Get food listings offered during the period.
        const { data: listings, error: listingsError } =
            await supabase
                .from('food_listings')
                .select('id, pax_total, pax_remaining, created_at, pickup_end')
                .gte('created_at', start)
                .lt('created_at', end);

        if (listingsError) throw listingsError;

        // 2. Get successful food collections during the period.
        const { data: claims, error: claimsError } =
            await supabase
                .from('claims')
                .select('id, listing_id, checkin_at')
                .eq('status', 'completed')
                .eq('checked_in', true)
                .gte('checkin_at', start)
                .lt('checkin_at', end);

        if (claimsError) throw claimsError;

        const listingRows = listings || [];
        const claimRows = claims || [];

        // 3. Calculate total portions offered.
        const totalPaxOffered = listingRows.reduce(
            (total, listing) =>
                total + (Number(listing.pax_total) || 0),
            0
        );

        // 4. Count successfully collected portions.
        const totalPaxSuccessfullyServed = claimRows.length;

        // 5. Estimate food saved.
        const KG_PER_PORTION = 0.4;

        const estimatedFoodSavedKg = Number(
            (totalPaxSuccessfullyServed * KG_PER_PORTION).toFixed(2)
        );

        // 6. Calculate collection rate.
        const foodCollectionRate = totalPaxOffered > 0
            ? Number((
                totalPaxSuccessfullyServed / totalPaxOffered * 100
            ).toFixed(2))
            : 0;

        // 7. Count unclaimed portions only after pickup has ended.
        const now = new Date();

        const unclaimedPortions = listingRows.reduce(
            (total, listing) => {
                const pickupEnded =
                    listing.pickup_end &&
                    new Date(listing.pickup_end) < now;

                return total + (
                    pickupEnded
                        ? Number(listing.pax_remaining) || 0
                        : 0
                );
            },
            0
        );

        // 8. Group estimated food saved by collection date.
        const trendMap = {};

        claimRows.forEach(claim => {
            if (!claim.checkin_at) return;

            const date = new Date(claim.checkin_at)
                .toLocaleDateString('en-CA', {
                    timeZone: 'Asia/Kuala_Lumpur'
                });

            trendMap[date] = (trendMap[date] || 0) + KG_PER_PORTION;
        });

        const foodSavedTrend = Object.entries(trendMap)
            .sort(([dateA], [dateB]) =>
                dateA.localeCompare(dateB)
            )
            .map(([date, foodSavedKg]) => ({
                date,
                foodSavedKg: Number(foodSavedKg.toFixed(2))
            }));

        return {
            data_coverage: listingRows.length,
            totalPaxSuccessfullyServed,
            estimatedFoodSavedKg,

            foodOfferedVsCollected: {
                offered: totalPaxOffered,
                collected: totalPaxSuccessfullyServed
            },

            foodCollectionRate,
            unclaimedPortions,
            estimatedWasteReductionImpactKg: estimatedFoodSavedKg,
            foodSavedTrend,
        };
    }

}

module.exports = ReportModel;