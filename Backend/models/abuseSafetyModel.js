const supabase = require('../config/supabase');

class AbuseSafetyModel {
    static async getAllTickets() {
        // Step 1: Get all Master Tickets, Reported Users and Abuse Reports
        const { data, error } = await supabase
            .from('abuse_master_tickets')
            .select(`
            *,
            reportedUser:users!abuse_master_tickets_reported_user_uid_fkey (
                uid,
                name,
                email
            ),
            abuse_reports (*)
        `);

        if (error) throw new Error(error.message);

        if (!data || data.length === 0) {
            return [];
        }

        // Step 2: Get all Listing IDs from Master Tickets
        const listingIds = data.map(ticket => ticket.target_object_id);

        // Step 3: Fetch the corresponding Food Listings
        const { data: listings, error: listingError } = await supabase
            .from('food_listings')
            .select(`
            id,
            event_name,
            food_type,
            short_description,
            image_url,
            pickup_location
        `)
            .in('id', listingIds);

        if (listingError) throw new Error(listingError.message);

        // Step 4: Match each Ticket with its Listing
        const listingMap = {};

        (listings || []).forEach(listing => {
            listingMap[listing.id] = listing;
        });

        // Step 5: Return Tickets with Listing Details
        return data.map(ticket => ({
            ...ticket,
            listing: listingMap[ticket.target_object_id] || null
        }));
    }

    static async getTicketById(id) {
        const { data, error } = await supabase
            .from('abuse_master_tickets')
            .select(`
                *,
                abuse_reports (
                    *,
                    reporter:users!abuse_reports_reporter_uid_fkey (
                        uid,
                        name,
                        email
                    )
                ),
                reportedUser:users!abuse_master_tickets_reported_user_uid_fkey (
                    uid,
                    name,
                    email
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    static async getTicketsByStatus(status) {
        const { data, error } = await supabase
            .from('abuse_master_tickets')
            .select(`
                *,
                abuse_reports (*)
            `)
            .eq('ticket_status', status);

        if (error) throw new Error(error.message);
        return data || [];
    }

    static async updateTicketStatus(id, status) {
        const { data, error } = await supabase
            .from('abuse_master_tickets')
            .update({ ticket_status: status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    static async getTicketStatistics() {
        const { data, error } = await supabase
            .from('abuse_master_tickets')
            .select('id, ticket_status, target_type');

        if (error) throw new Error(error.message);

        return {
            totalTickets: data.length,
            unresolvedTickets: data.filter(
                ticket => ticket.ticket_status === 'unresolved'
            ).length,
            resolvedTickets: data.filter(
                ticket => ticket.ticket_status === 'resolved'
            ).length
        };
    }

    static async updateAIInsights(id, data) {
        const { data: updatedTicket, error } = await supabase
            .from('abuse_master_tickets')
            .update({
                ai_insights_summary: data.ai_insights_summary,
                ai_suggested_action: data.ai_suggested_action,
                ai_behavioral_tag: data.ai_behavioral_tag,
                ai_flagged_snippets: data.ai_flagged_snippets
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        return updatedTicket;
    }

    static async getReportsByMasterTicketId(masterTicketId) {
        const { data, error } = await supabase
            .from('abuse_reports')
            .select(`
            *,
            reporter:users!abuse_reports_reporter_uid_fkey (
                uid,
                name,
                email
            )
        `)
            .eq('master_ticket_id', masterTicketId);

        if (error) throw new Error(error.message);

        return data || [];
    }
}

module.exports = AbuseSafetyModel;