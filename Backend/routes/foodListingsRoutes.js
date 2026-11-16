// routes/foodListingsRoutes.js
const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');

router.get('/food-listings', foodController.getAllListings);
router.get('/food-listings/:id', foodController.getListingById);
router.patch('/food-listings/:id/status', foodController.updateStatus);
router.patch('/food-listings/:id/suspend', foodController.suspendListing);
router.delete('/food-listings/:id', foodController.deleteListing);

module.exports = router;