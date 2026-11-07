const supabase = require('../config/supabase');

class AIModel {

    // Get Master Ticket
    static async getMasterTicketById(ticketId) {
        const { data, error } = await supabase
            .from('abuse_master_tickets')
            .select('*')
            .eq('id', ticketId)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    // Get ALL reports belonging to the Master Ticket
    static async getReportsByMasterTicketId(ticketId) {
        const { data, error } = await supabase
            .from('abuse_reports')
            .select(`
                id,
                reasons,
                notes,
                created_at
            `)
            .eq('master_ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return data || [];
    }

    // Get Food Listing details
    static async getListingById(listingId) {
        const { data, error } = await supabase
            .from('food_listings')
            .select(`
                id,
                event_name,
                short_description,
                food_type,
                food_tags,
                pickup_location,
                pickup_start,
                pickup_end
            `)
            .eq('id', listingId)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    // Save AI analysis results to Master Ticket
    static async saveAIAnalysis(ticketId, expectedReportCount, result) {
        const { data, error } = await supabase
            .from('abuse_master_tickets')
            .update({
                calculated_severity_score: result.severityScore,
                ai_behavioral_tag: result.behavioralTag,
                ai_insights_summary: result.insightsSummary,
                ai_suggested_action: result.suggestedAction,
                ai_flagged_snippets: result.flaggedSnippets,

                ai_analysis_status: 'completed',
                ai_analysis_version: expectedReportCount,
                ai_analysis_error: null,

                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId)
            .eq('report_count', expectedReportCount)
            .select()
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        // No row updated means new reports arrived during AI analysis.
        if (!data) {
            return false;
        }

        return true;
    }

    // Update AI analysis status
    static async updateAIAnalysisStatus(ticketId, expectedReportCount, status, errorMessage = null) {
        const { data, error } = await supabase
            .from('abuse_master_tickets')
            .update({
                ai_analysis_status: status,
                ai_analysis_error: errorMessage
            })
            .eq('id', ticketId)
            .eq('report_count', expectedReportCount)
            .select()
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        return !!data;
    }
}

module.exports = AIModel;