// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Root & Webhook Redirect Entrypoints
router.get('/', authController.getRootStatus);
router.get('/auth/action', authController.handleAuthActionRedirect);

// API Secure Identity Operations
router.post('/api/auth/register', authController.register);
router.post('/api/auth/login', authController.login);
router.post('/api/auth/forgot-password', authController.forgotPassword);
router.post('/api/auth/reset-password', authController.resetPassword);

module.exports = router;