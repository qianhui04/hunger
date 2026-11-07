const ReportModel = require('../models/reportModel');
const FoodListingModel = require('../models/foodListingsModel');


exports.getOverallSummary = async ({ startDate, endDate }) => {
    if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required');
    }

    if (
        Number.isNaN(Date.parse(startDate)) ||
        Number.isNaN(Date.parse(endDate)) ||
        startDate > endDate
    ) {
        throw new Error('Invalid reporting date range');
    }

    return await ReportModel.getOverallSummary(
        startDate,
        endDate
    );
};


exports.getFoodListingsReport = async ({ startDate, endDate }) => {
    try {
        const { food_listings } = await ReportModel.getFoodListings(startDate, endDate);

        const data_coverage = food_listings.length;

        if (!food_listings || food_listings.length === 0) {
            return {
                data_coverage,
                totalPaxDistributed: 0,
                totalPaxRemaining: 0,
                totalFoodSaved: 0,
                totalDistributionDuration: 0,
                averagePickUpDuration: 0,
                dietary_preferences: []
            };
        }

        const totalPaxDistributed = food_listings.reduce(
            (total, listing) => {
                const physicallyClaimedCount = (listing.claims || []).filter(
                    claim =>
                        claim.checked_in === true &&
                        claim.status === 'completed'
                );

                return total + physicallyClaimedCount.length;
            }, 0);

        const totalPaxRemaining = food_listings.reduce((total, listing) => total + (listing.pax_remaining), 0);
        const totalFoodSaved = totalPaxDistributed * 0.4;

        // Calculate total duration safely in milliseconds/minutes
        const totalDistributionDuration = food_listings.reduce((total, listing) => {
            const start = new Date(listing.pickup_start).getTime();
            const end = new Date(listing.pickup_end).getTime();
            const duration = end - start;
            return total + (isNaN(duration) ? 0 : duration);
        }, 0);

        const totalDistributionDurationHours = totalDistributionDuration / (1000 * 60 * 60);

        // Calculate average duration per listing (divided by total number of listings)
        const averagePickUpDuration = food_listings.length > 0
            ? totalDistributionDurationHours / food_listings.length
            : 0;

        const dietary_preferences_count = {};

        food_listings.forEach(item => {
            const preferences = item.dietary_preferences || []

            if (preferences.length == 0) {
                dietary_preferences_count['Others'] =
                    (dietary_preferences_count['Others'] || 0) + 1
            }
            else {
                preferences.forEach(preference => {
                    dietary_preferences_count[preference] =
                        (dietary_preferences_count[preference] || 0) + 1
                })
            }
        });

        const dietary_preferences = Object.entries(dietary_preferences_count).map(([name, value]) => ({ name, value }));

        return {
            data_coverage,
            totalPaxDistributed,
            totalPaxRemaining,
            totalFoodSaved,
            // totalDistributionDurationHours,
            averagePickUpDuration,
            dietary_preferences
        };
    } catch (error) {
        console.error("Error in getFoodListingsReport:", error);
        throw error;
    }
};

exports.getUserActivityReport = async ({ startDate, endDate }) => {
    try {
        const user_activity = await ReportModel.getUserActivity(startDate, endDate);

        return {
            data_coverage: user_activity.totalActiveUsers,
            totalRegisteredUsers: user_activity.totalRegisteredUsers,
            totalActiveUsers: user_activity.totalActiveUsers,
            totalProviders: user_activity.totalProviders,
            totalSuccessfulClaims: user_activity.totalSuccessfulClaims,
            totalUsersSuccessfullyClaimed: user_activity.totalUsersSuccessfullyClaimed,
            totalCancelledClaims: user_activity.totalCancelledClaims
        };

    } catch (error) {
        console.error("Error in getUserActivityReport:", error);
        throw error;
    }
};

exports.getLocationActivityReport = async ({ startDate, endDate }) => {
    try {
        const location_activity = await ReportModel.getLocationActivity(startDate, endDate);

        const mostPickUpLocation = (location_activity.mostPickUpLocation || []).map(location => ({
            pickup_location: location.pickup_location,
            pax_distributed: location.pax_total
                - location.pax_remaining,
        })).sort((a, b) => b.pax_distributed - a.pax_distributed);

        return {
            data_coverage: location_activity.mostPickUpLocation.length,
            mostPickUpLocation,
        };

    } catch (error) {
        console.error("Error in getLocationActivityReport:", error);
        throw error;
    }
};


exports.getWasteReductionReport = async ({ startDate, endDate }) => {
    if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required');
    }

    if (
        Number.isNaN(Date.parse(startDate)) ||
        Number.isNaN(Date.parse(endDate)) ||
        startDate > endDate
    ) {
        throw new Error('Invalid reporting date range');
    }

    const data = await ReportModel.getWasteReduction(
        startDate,
        endDate
    );

    return data;
};
