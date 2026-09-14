// routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Map incoming GET endpoint to our controller execution block
router.get('/locations/analytics', locationController.getLocationAnalytics);

module.exports = router;