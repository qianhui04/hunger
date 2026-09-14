// controllers/locationController.js
const LocationModel = require('../models/locationModel');

exports.getLocationAnalytics = async (req, res) => {
    try {
        const { search, filter } = req.query;

        // 1. Fetch filtered logs directly from the Model
        const records = await LocationModel.getOperationalMetrics({ search, filter });

        // 2. Format UI mapping properties (Map Marker Colors)
        const formattedLocations = records.map(row => ({
            ...row,
            color: row.fulfillment_rate >= 75 ? '#2E7D32' : row.fulfillment_rate >= 50 ? '#4CAF50' : '#F44336'
        }));

        // 3. Compute structural analytics scoreboard aggregates
        const totalEvents = formattedLocations.length;
        const totalPaxDistributed = formattedLocations.reduce((sum, item) => sum + (item.pax_collected || 0), 0);

        const avgFulfillment = totalEvents
            ? Math.round(formattedLocations.reduce((sum, item) => sum + (item.fulfillment_rate || 0), 0) / totalPaxDistributed)
            : 0;

        const avgReservation = totalEvents
            ? Math.round(formattedLocations.reduce((sum, item) => sum + (item.reservation_rate || 0), 0) / totalPaxDistributed)
            : 0;

        // 4. Return formatted JSON response object
        return res.status(200).json({
            locations: formattedLocations,
            metrics: {
                totalEvents,
                totalPaxDistributed,
                avgFulfillment,
                avgReservation
            }
        });

    } catch (error) {
        console.error("Locations Controller Pipeline Failure:", error);
        return res.status(500).json({ error: "Internal operational metrics pipeline failure" });
    }
};