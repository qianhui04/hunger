// models/dashboardModel.js
const supabase = require('../config/supabase'); // Your initialized Supabase configuration

class DashboardModel {
    /**
     * Fetches raw active listings along with specific checked-in claims profiles
     */
    static async getRawAnalyticsData() {
        const { data: listings, error } = await supabase
            .from('food_listings')
            .select(`
                created_at, 
                food_type, 
                pax_total, 
                pax_remaining, 
                pickup_location, 
                status, 
                host_uid,
                claims(id)
            `)
            .eq('claims.checked_in', true)
            .eq('claims.status', 'completed');

        if (error) {
            throw new Error(error.message);
        }

        return listings || [];
    }
}

module.exports = DashboardModel;