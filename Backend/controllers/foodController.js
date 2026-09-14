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
            return res.status(400).json({ error: "Missing updated status field in request body" });
        }

        const targetStatus = status.trim();

        // Food Safety Lifecycle Guard Condition
        if (targetStatus === 'available') {
            const listing = await FoodListingModel.getCreationTime(id);

            if (!listing) {
                return res.status(404).json({ error: "Target listing verification metadata look-up failed." });
            }

            const createdTime = new Date(listing.created_at).getTime();
            const currentTime = new Date().getTime();
            const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;

            if (currentTime - createdTime > TWO_HOURS_IN_MS) {
                return res.status(403).json({
                    error: "Operation Denied: Food safety metrics strictly forbid unhiding records past a 2-hour active lifecycle threshold."
                });
            }
        }

        // Apply changes securely through the Model
        const data = await FoodListingModel.updateStatus(id, targetStatus);
        return res.status(200).json({ message: "Listing visibility updated successfully.", data });

    } catch (error) {
        console.error("Failed to alter visibility flag safely:", error);
        return res.status(500).json({ error: "Database visibility mutation pipeline disrupted." });
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