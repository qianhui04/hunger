const supabase = require('../config/supabase');

const verifyApprovedAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is required.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify Supabase access token
        const { data: { user }, error: authError } =
            await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired authentication token.'
            });
        }

        // Retrieve admin profile
        const { data: profile, error: profileError } = await supabase
            .from('admin_profiles')
            .select('id, role, status')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        if (
            !profile ||
            !['admin', 'super_admin'].includes(profile.role) ||
            profile.status !== 'approved'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Approved administrator access is required.'
            });
        }

        req.admin = {
            id: profile.id,
            role: profile.role,
            status: profile.status
        };

        next();

    } catch (error) {
        console.error('Admin Authentication Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to verify administrator permissions.'
        });
    }
};

module.exports = verifyApprovedAdmin;