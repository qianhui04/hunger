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

    /**
     * Looks up a single record's timestamp for safety checks
     */
    static async getCreationTime(id) {
        const { data, error } = await supabase
            .from('food_listings')
            .select('created_at')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    }

    /**
     * Updates the status text column of an existing row
     */
    static async updateStatus(id, status) {
        const { data, error } = await supabase
            .from('food_listings')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Removes a row permanently from the table
     */
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