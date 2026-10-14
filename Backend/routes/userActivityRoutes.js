const express = require('express');
const router = express.Router();
const userActivityController = require('../controllers/userActivityController');

/**
 * @swagger
 * /api/user-activity:
 *   get:
 *     summary: Get user activity
 *     description: Retrieve user records, activity statistics, and monthly activity.
 *     tags:
 *       - User Activity
 *     responses:
 *       200:
 *         description: User activity retrieved successfully
 *       500:
 *         description: Failed to retrieve user activity
 */
router.get('/user-activity', userActivityController.getUserActivity);

/**
 * @swagger
 * /api/restrict-user:
 *   patch:
 *     summary: Restrict user
 *     description: Restrict or unrestrict user access.
 *     tags:
 *       - User Activity
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             status:
 *               type: string
 *               enum: ["restrict", "unrestrict"]
 *           example:
 *             id: "123"
 *             status: "restrict"
 *     responses:
 *       200:
 *         description: User restriction status updated successfully
 *       500:
 *         description: Failed to update user restriction status
 */
router.patch('/restrict-user', userActivityController.handleRestriction);

module.exports = router;