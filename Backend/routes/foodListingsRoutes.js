// routes/foodListingsRoutes.js
const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');

router.get('/food-listings', foodController.getAllListings);
router.patch('/food-listings/:id/status', foodController.updateStatus);
router.delete('/food-listings/:id', foodController.deleteListing);

module.exports = router;