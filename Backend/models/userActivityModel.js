const supabase = require('../config/supabase');

class userActivityModel {

    static async getAllUsers() {
        const { data, error } = await supabase
            .from('users')
            .select(`uid, sub_roles, name, email, app_role`);

        if (error) throw error;

        return data || [];
    }

    static async getProviderListingUsers() {
        const { data, error } = await supabase
            .from('food_listings')
            .select(`id, host_uid, created_at`);

        if (error) throw error;

        return data || [];
    }

    static async getClaimListingUsers() {
        const { data, error } = await supabase
            .from('claims')
            .select(`id, user_uid, claimed_at, checked_in, status, checkin_at`);

        if (error) throw error;

        return data || [];
    }
}

module.exports = userActivityModel;