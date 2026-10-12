// models/dashboardModel.js
const supabase = require('../config/supabase'); // Your initialized Supabase configuration

class DashboardModel {
    /**
     * Fetches raw active listings along with specific checked-in claims profiles
     */
    static async getDashboardData() {

        // 1. Food listing + checked-in claims
        const { data: listings, error: listingsError } = await supabase
            .from('food_listings')
            .select(`
                created_at,
                food_type,
                pax_total,
                pax_remaining,
                pickup_location,
                host_uid,
                pickup_end,
                status,
                claims (
                    id
                )
            `)
            .eq('claims.checked_in', true);

        if (listingsError) {
            throw new Error(listingsError.message);
        }

        // 2. Totle users registered 
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select(`
                uid,
                sub_roles
            `)

        if (usersError) {
            throw new Error(usersError.message);
        }

        return { listings: listings || [], users: users || [] };
    }
}

module.exports = DashboardModel;