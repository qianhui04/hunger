// controllers/locationController.js
const LocationModel = require('../models/locationModel');

exports.getLocationAnalytics = async (req, res) => {
    try {
        const locations = (await LocationModel.getAllLocations()).sort((a, b) => b.fulfillment_rate - a.fulfillment_rate);

        const availableEvent = locations.filter(event => event.status === 'available')
        const avgReservationRate = locations.length
            ? (
                locations.reduce((sum, event) => sum + (event.reservation_rate || 0), 0)
                / locations.length
            ).toFixed(2)
            : "0";

        const avgFulfillmentRate = locations.length
            ? (
                locations.reduce((sum, event) => sum + (event.fulfillment_rate || 0), 0)
                / locations.length
            ).toFixed(2)
            : "0";
        const totalPaxDistributed = locations.reduce((sum, event) => (sum + event.pax_collected), 0)

        return res.status(200).json({
            locations: locations,
            metrics: {
                availableEvent: availableEvent.length,
                avgReservationRate: avgReservationRate,
                avgFulfillmentRate: avgFulfillmentRate,
                totalPaxDistributed: totalPaxDistributed
            }
        });
    } catch (error) {
        console.error("Locations Controller Pipeline Failure:", error);
        return res.status(500).json({ error: "Internal operational metrics pipeline failure" });
    }
};