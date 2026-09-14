// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Map clean route to the specific controller method
router.get('/dashboard-metrics', dashboardController.getMainOverviewMetrics);

module.exports = router;