const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/dashboard-metrics', dashboardController.getMainOverviewMetrics);

module.exports = router;