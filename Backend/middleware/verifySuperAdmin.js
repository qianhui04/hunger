const supabase = require('../config/supabase');

const verifySuperAdmin = async (req, res, next) => {
    try {
        // 1. Get access token from request header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is required.'
            });
        }

        const token = authHeader.split(' ')[1];

        // 2. Verify token with Supabase Auth
        const { data: { user }, error: authError } =
            await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired authentication token.'
            });
        }

        // 3. Retrieve admin profile
        const { data: profile, error: profileError } = await supabase
            .from('admin_profiles')
            .select('id, role, status')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) {
            throw profileError;
        }

        if (!profile || profile.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Approved admin access is required.'
            });
        }

        // 4. Only super_admin can access global AI configuration
        if (profile.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can modify AI configuration.'
            });
        }

        // 5. Attach verified admin information to request
        req.admin = {
            id: profile.id,
            role: profile.role,
            status: profile.status
        };

        next();

    } catch (error) {
        console.error('Super Admin Authentication Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to verify administrator permissions.'
        });
    }
};

module.exports = verifySuperAdmin;