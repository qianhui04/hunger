// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/reports', async (req, res) => {
    try {
        const { type = 'summary', startDate, endDate } = req.query;

        let data;

        switch (type) {
            case 'summary':
                data = await reportController.getOverallSummary({ startDate, endDate });
                break;

            case 'food-listings':
                data = await reportController.getFoodListingsReport({ startDate, endDate });
                break;

            case 'user-activity':
                data = await reportController.getUserActivityReport({ startDate, endDate });
                break;

            case 'location-activity':
                data = await reportController.getLocationActivityReport({ startDate, endDate });
                break;

            case 'waste-reduction':
                data = await reportController.getWasteReductionReport({ startDate, endDate });
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: `Invalid report type: ${type}`
                });
        }

        return res.status(200).json({
            success: true,
            reportType: type,
            data: data
        });

    } catch (error) {
        console.error('Error generating report:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching report data'
        });
    }
});

module.exports = router;