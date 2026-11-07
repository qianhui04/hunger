const AIService = require('../services/aiService');

exports.handleNewAbuseReport = async (req, res) => {
    try {
        // 1. Verify webhook secret
        const webhookSecret = req.headers['x-webhook-secret'];

        if (webhookSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
            return res.status(401).json({
                message: 'Unauthorized webhook request.'
            });
        }

        // 2. Get webhook payload
        const { type, table, record } = req.body;

        // 3. Validate webhook event
        if (type !== 'INSERT' || table !== 'abuse_reports') {
            return res.status(400).json({
                message: 'Invalid webhook event.'
            });
        }

        // 4. Get Master Ticket ID
        const masterTicketId = record?.master_ticket_id;

        if (!masterTicketId) {
            return res.status(400).json({
                message: 'Master Ticket ID is missing.'
            });
        }

        // 5. Trigger AI analysis
        const result = await AIService.analyzeMasterTicket(masterTicketId);

        return res.status(200).json({
            message: 'AI analysis completed successfully.',
            masterTicketId,
            result
        });

    } catch (error) {
        console.error('AI Analysis Error:', error.message);

        return res.status(500).json({
            message: 'AI analysis failed.',
            error: error.message
        });
    }
};