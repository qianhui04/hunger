const express = require('express');
const router = express.Router();

const abuseAIConfigController = require('../controllers/abuseAIConfigController');

const verifyApprovedAdmin = require('../middleware/verifyApprovedAdmin');
const verifySuperAdmin = require('../middleware/verifySuperAdmin');

// GET: Both approved Admin and Super Admin can view
router.get(
    '/ai-config',
    verifyApprovedAdmin,
    abuseAIConfigController.getConfig
);

// PUT: Only approved Super Admin can update
router.put(
    '/ai-config',
    verifySuperAdmin,
    abuseAIConfigController.updateConfig
);

module.exports = router;