// controllers/foodController.js
const FoodListingModel = require('../models/foodListingsModel');

exports.getAllListings = async (req, res) => {
    try {
        const listings = await FoodListingModel.getAll();
        return res.status(200).json(listings);
    } catch (error) {
        console.error("Error fetching listings:", error);
        return res.status(500).json({ error: "Failed to retrieve food listings records." });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                error: "Missing updated status field in request body."
            });
        }

        const targetStatus = status.trim();

        if (!['available', 'not_available'].includes(targetStatus)) {
            return res.status(400).json({
                error: "Invalid listing status."
            });
        }

        // Unhide validation
        if (targetStatus === 'available') {
            const listing =
                await FoodListingModel.getListingForStatusUpdate(id);

            if (!listing) {
                return res.status(404).json({
                    error: "Food listing not found."
                });
            }

            const pickupEndTime =
                new Date(listing.pickup_end).getTime();

            const currentTime = Date.now();

            const paxRemaining = listing.pax_remaining;

            if (pickupEndTime <= currentTime) {
                return res.status(403).json({
                    error: "This listing cannot be unhidden because the pickup period has ended."
                });
            }

            if (paxRemaining <= 0) {
                return res.status(403).json({
                    error: "This listing cannot be unhidden because all portions have been claimed."
                });
            }
        }

        // Apply status change
        const data =
            await FoodListingModel.updateStatus(
                id,
                targetStatus
            );

        return res.status(200).json({
            message: "Listing visibility updated successfully.",
            data
        });

    } catch (error) {
        console.error(
            "Failed to update listing status:",
            error
        );

        return res.status(500).json({
            error: "Failed to update listing status."
        });
    }
};

exports.deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        await FoodListingModel.delete(id);

        return res.status(200).json({ message: "Listing permanently expunged from the system database." });
    } catch (error) {
        console.error("Critical failure during deletion routine:", error);
        return res.status(500).json({ error: "Could not safely process deletion event." });
    }
};