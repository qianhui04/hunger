const express = require('express');
const router = express.Router();
const abuseSafetyController = require('../controllers/AbuseSafetyController');
const {
    validateTicketId,
    validateTicketStatus
} = require('../middleware/abuseValidation');

router.get('/tickets', abuseSafetyController.getAllTickets);
router.get('/tickets/statistics', abuseSafetyController.getTicketStatistics);
router.get('/tickets/:id', validateTicketId, abuseSafetyController.getTicketDetails);
router.get('/tickets/reports/:id', validateTicketId, abuseSafetyController.getReportsByMasterTicketId);

router.put(
    '/tickets/:id/status',
    validateTicketId,
    validateTicketStatus,
    abuseSafetyController.updateTicketStatus
);

module.exports = router;