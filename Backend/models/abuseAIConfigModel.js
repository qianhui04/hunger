const supabase = require('../config/supabase');

class AbuseAIConfigModel {

    // Get the current global AI configuration
    static async getConfig() {
        const { data, error } = await supabase
            .from('abuse_ai_config')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    // Update the global AI configuration
    static async updateConfig(config) {
        const {
            report_frequency_weight,
            report_consistency_weight,
            food_safety_weight,
            evidence_strength_weight,
            confidence_threshold
        } = config;

        const { data, error } = await supabase
            .from('abuse_ai_config')
            .update({
                report_frequency_weight,
                report_consistency_weight,
                food_safety_weight,
                evidence_strength_weight,
                confidence_threshold,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}

module.exports = AbuseAIConfigModel;