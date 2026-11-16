// models/foodListingModel.js
const supabase = require('../config/supabase');

class FoodListingModel {
    /**
     * Fetches all food listings with joined user profile details
     */
    static async getAll() {
        const { data, error } = await supabase
            .from('food_listings')
            .select(`
                *,
                users (
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async getById(id) {
        const { data, error } = await supabase
            .from('food_listings')
            .select(`
            *,
            users (
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
            )
        `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    static async getListingForStatusUpdate(id) {
        const { data, error } = await supabase
            .from('food_listings')
            .select('pickup_end, pax_remaining')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    }

    static async updateStatus(id, status) {
        if (status === 'suspended') {
            throw new Error(
                'Use suspendListing() to suspend a listing.'
            );
        }

        const { data, error } = await supabase
            .from('food_listings')
            .update({ status })
            .eq('id', id)
            .neq('status', 'suspended')
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return null;
        }

        return data;
    }

    static async suspendListing(id) {
        const { data, error } = await supabase.rpc(
            'suspend_listing_and_resolve_ticket',
            {
                p_listing_id: id
            }
        );

        if (error) throw error;

        return data;
    }

    static async getClaimsByListingId(listingId) {
        const { data, error } = await supabase
            .from('claims')
            .select(`
            id,
            user_uid,
            claimed_at,
            checked_in,
            checkin_at,
            status,
            users (
                uid,
                name,
                email,
                student_id,
                phone_number
            )
        `)
            .eq('listing_id', listingId)
            .order('claimed_at', { ascending: false });

        if (error) throw error;

        return data || [];
    }

    static async delete(id) {
        const { error } = await supabase
            .from('food_listings')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
}

module.exports = FoodListingModel;