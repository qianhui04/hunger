const express = require('express');
const router = express.Router();
const userActivityController = require('../controllers/userActivityController');

router.get('/user-activity', userActivityController.getUserActivity);

module.exports = router;