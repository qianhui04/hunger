const supabase = require('../config/supabase');

class userActivityModel {

    static async getAllUsers() {
        const { data, error } = await supabase
            .from('users')
            .select(`uid, sub_roles, name, email, app_role, is_restricted`);

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

    static async updateUserRestriction(uid, is_restricted) {
        const { data, error } = await supabase
            .from('users')
            .update({ is_restricted })
            .eq('uid', uid);

        if (error) throw error;

        return data;
    }

    // Get one user's profile
    static async getUserById(uid) {
        const { data, error } = await supabase
            .from('users')
            .select(`
                uid,
                name,
                email,
                app_role,
                sub_roles,
                student_id,
                avatar_url,
                phone_number,
                created_at,
                is_restricted
            `)
            .eq('uid', uid)
            .maybeSingle();

        if (error) throw error;

        return data;
    }

    // Get claims made by this user, including the related food listing
    static async getUserClaims(uid) {
        const { data, error } = await supabase
            .from('claims')
            .select(`
                id,
                claimed_at,
                checked_in,
                checkin_at,
                status,
                food_listings (
                    event_name,
                    pickup_location,
                    pickup_start
                )
            `)
            .eq('user_uid', uid)
            .order('claimed_at', { ascending: false });

        if (error) throw error;

        return data || [];
    }

    static async getUserListings(uid) {
        const { data, error } = await supabase
            .from('food_listings')
            .select(`
            id,
            event_name,
            pickup_location,
            created_at,
            pickup_start,
            pickup_end,
            status,
            pax_total,
            pax_remaining
        `)
            .eq('host_uid', uid)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    }

}

module.exports = userActivityModel;