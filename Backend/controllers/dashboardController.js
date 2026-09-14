// controllers/dashboardController.js
const DashboardModel = require('../models/dashboardModel');

// Shared Global App Settings Constants 
const MEAL_PORTION_WEIGHT_KG = 0.4;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONDAY_FIRST_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

exports.getMainOverviewMetrics = async (req, res) => {
    try {
        // 1. Invoke Model layer to execute database selection operation
        const listings = await DashboardModel.getRawAnalyticsData();

        // Fallback initialization block if listings are blank
        if (listings.length === 0) {
            return res.status(200).json({
                stats: { total_listings: 0, pax_distributed: 0, food_saved: 0, active_users: 0 },
                chartData: { foodTypeDistribution: [], locationActivity: [], weeklyActivity: [] },
                matrixData: MONDAY_FIRST_ORDER.map(day => ({ day, '08:00': 0, '12:00': 0, '17:00': 0 })),
                todayListings: []
            });
        }

        // 2. Perform algorithmic conversions & data mapping
        const total_listings = listings.length;
        let pax_distributed = 0;
        const uniqueHosts = new Set();

        listings.forEach(item => {
            const physicallyClaimedCount = item.claims ? item.claims.length : 0;
            pax_distributed += physicallyClaimedCount;
            if (item.host_uid) uniqueHosts.add(item.host_uid);
        });

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyDistribution = listings.filter(item => {
            const date = new Date(item.created_at);
            return date >= startOfWeek && date <= endOfWeek;
        });

        const foodTypeCount = weeklyDistribution.reduce((acc, item) => {
            const type = item.food_type || 'Others';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const locationCount = weeklyDistribution.reduce((acc, item) => {
            if (item.pickup_location) {
                const location = item.pickup_location.split(',')[0].substring(0, 15);
                acc[location] = (acc[location] || 0) + 1;
            }
            return acc;
        }, {});

        const dailyBreakdown = weeklyDistribution.reduce((acc, item) => {
            const dayName = DAYS[new Date(item.created_at).getDay()];
            acc[dayName] = (acc[dayName] || 0) + 1;
            return acc;
        }, {});

        const matrixTracker = DAYS.reduce((acc, day) => {
            acc[day] = {
                '08:00': { totalPax: 0, distributedPax: 0 },
                '12:00': { totalPax: 0, distributedPax: 0 },
                '17:00': { totalPax: 0, distributedPax: 0 }
            };
            return acc;
        }, {});

        listings.forEach(item => {
            const dateObj = new Date(item.created_at);
            const dayName = DAYS[dateObj.getDay()];
            const hour = dateObj.getHours();

            let chosenSlot = '12:00';
            if (hour < 11) chosenSlot = '08:00';
            else if (hour >= 15) chosenSlot = '17:00';

            const physicallyClaimedCount = item.claims ? item.claims.length : 0;
            matrixTracker[dayName][chosenSlot].totalPax += item.pax_total || 0;
            matrixTracker[dayName][chosenSlot].distributedPax += physicallyClaimedCount;
        });

        const matrixData = MONDAY_FIRST_ORDER.map(day => ({
            day,
            '08:00': matrixTracker[day]['08:00'].totalPax === 0 ? 0 : Math.round((matrixTracker[day]['08:00'].distributedPax / matrixTracker[day]['08:00'].totalPax) * 100),
            '12:00': matrixTracker[day]['12:00'].totalPax === 0 ? 0 : Math.round((matrixTracker[day]['12:00'].distributedPax / matrixTracker[day]['12:00'].totalPax) * 100),
            '17:00': matrixTracker[day]['17:00'].totalPax === 0 ? 0 : Math.round((matrixTracker[day]['17:00'].distributedPax / matrixTracker[day]['17:00'].totalPax) * 100)
        }));

        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

        const todayListings = listings.filter(item => {
            const date = new Date(item.created_at);
            return date >= startOfToday && date <= endOfToday;
        });

        // 3. Render clean JSON response
        return res.status(200).json({
            stats: {
                total_listings,
                pax_distributed,
                food_saved: pax_distributed * MEAL_PORTION_WEIGHT_KG,
                active_users: uniqueHosts.size
            },
            chartData: {
                foodTypeDistribution: Object.entries(foodTypeCount).map(([name, value]) => ({ name, value })),
                locationActivity: Object.entries(locationCount).map(([name, value]) => ({ name, value })),
                weeklyActivity: DAYS.map(day => ({ name: day, value: dailyBreakdown[day] || 0 }))
            },
            matrixData,
            todayListings
        });

    } catch (error) {
        console.error("SDK Dashboard Controller Processing Error:", error);
        return res.status(500).json({ error: "Internal Server Processing Error" });
    }
};