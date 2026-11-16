const AbuseAIConfigModel = require('../models/abuseAIConfigModel');

class AbuseAIConfigController {

    // GET current AI configuration
    static async getConfig(req, res) {
        try {
            const config = await AbuseAIConfigModel.getConfig();

            return res.status(200).json({
                success: true,
                data: config
            });

        } catch (error) {
            console.error('Get AI Config Error:', error);

            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve AI configuration.'
            });
        }
    }

    // UPDATE AI configuration
    static async updateConfig(req, res) {
        try {
            const {
                report_frequency_weight,
                report_consistency_weight,
                food_safety_weight,
                evidence_strength_weight,
                confidence_threshold
            } = req.body;

            const weights = [
                report_frequency_weight,
                report_consistency_weight,
                food_safety_weight,
                evidence_strength_weight
            ];

            // Validate that all values are numbers
            const allValues = [
                ...weights,
                confidence_threshold
            ];

            if (!allValues.every(value =>
                typeof value === 'number' && Number.isFinite(value)
            )) {
                return res.status(400).json({
                    success: false,
                    message: 'All configuration values must be valid numbers.'
                });
            }

            // Validate weight ranges
            if (weights.some(weight => weight < 0 || weight > 100)) {
                return res.status(400).json({
                    success: false,
                    message: 'Each severity weight must be between 0 and 100.'
                });
            }

            // Severity weights must total exactly 100
            const totalWeight = weights.reduce(
                (total, weight) => total + weight,
                0
            );

            if (Math.abs(totalWeight - 100) > 0.001) {
                return res.status(400).json({
                    success: false,
                    message: 'Severity weights must total exactly 100%.'
                });
            }

            // Validate confidence threshold
            if (confidence_threshold < 0 || confidence_threshold > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Confidence threshold must be between 0 and 100.'
                });
            }

            const updatedConfig = await AbuseAIConfigModel.updateConfig({
                report_frequency_weight,
                report_consistency_weight,
                food_safety_weight,
                evidence_strength_weight,
                confidence_threshold
            });

            return res.status(200).json({
                success: true,
                message: 'AI configuration updated successfully.',
                data: updatedConfig
            });

        } catch (error) {
            console.error('Update AI Config Error:', error);

            return res.status(500).json({
                success: false,
                message: 'Failed to update AI configuration.'
            });
        }
    }
}

module.exports = AbuseAIConfigController;