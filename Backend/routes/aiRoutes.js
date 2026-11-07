const express = require('express');
const router = express.Router();

const aiController = require('../controllers/aiController');

router.post(
    '/ai/analyze-report',
    aiController.handleNewAbuseReport
);

module.exports = router;