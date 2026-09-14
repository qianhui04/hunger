// models/locationModel.js
const supabase = require('../config/supabase');

class LocationModel {
    /**
     * Queries locations directly from Supabase using filter metrics
     * @param {string} search - Text to filter event names or locations
     * @param {string} filter - 'high', 'low', or 'all' fulfillment flag
     */
    static async getOperationalMetrics({ search, filter }) {
        let query = supabase
            .from('location_operational_metrics_table')
            .select('id, event_name, location, pax_total, pax_remaining, status, lat, lng, pax_reserved, pax_collected, reservation_rate, fulfillment_rate')
            .not('lat', 'is', null)
            .not('lng', 'is', null);

        // Inject dynamic search conditions
        if (search) {
            query = query.or(`event_name.ilike.%${search}%,location.ilike.%${search}%`);
        }

        // Inject database level threshold filters
        if (filter === 'high') {
            query = query.gte('fulfillment_rate', 70);
        } else if (filter === 'low') {
            query = query.lt('fulfillment_rate', 70);
        }

        // Keep order consistent
        query = query.order('pax_total', { ascending: false });

        const { data: records, error } = await query;

        if (error) throw new Error(error.message);
        return records || [];
    }
}

module.exports = LocationModel;