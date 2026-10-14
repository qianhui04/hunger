const UserActivityModel = require('../models/userActivityModel');

exports.getUserActivity = async (req, res) => {
    try {
        const [users, listings, claims] =
            await Promise.all([
                UserActivityModel.getAllUsers(),
                UserActivityModel.getProviderListingUsers(),
                UserActivityModel.getClaimListingUsers(),
            ]);

        const foodSharedByUser = {};

        listings.forEach((listing) => {
            const uid = listing.host_uid;
            foodSharedByUser[uid] = (foodSharedByUser[uid] || 0) + 1;
        });

        const foodClaimedByUser = {};

        claims.forEach((claim) => {
            const uid = claim.user_uid;
            foodClaimedByUser[uid] = (foodClaimedByUser[uid] || 0) + 1;
        });

        const userRecords = users.map((user) => {
            return {
                id: user.uid,
                name: user.name,
                email: user.email,
                role: user.app_role,
                is_restricted: user.is_restricted,
                subRoles: user.sub_roles || [],
                food_shared: foodSharedByUser[user.uid] || 0,
                food_claimed: foodClaimedByUser[user.uid] || 0
            }
        });

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr',
            'May', 'Jun', 'Jul', 'Aug',
            'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const currentYear = new Date().getFullYear();
        const monthlyActivity = [];

        months.forEach((month, monthIndex) => {
            const foodListed = new Set();
            const foodClaimed = new Set();

            listings.forEach(listing => {
                const date = new Date(listing.created_at);
                if (date.getFullYear() === currentYear && date.getMonth() === monthIndex) {
                    foodListed.add(listing.id);
                }
            });

            claims.forEach(claim => {

                if (claim.checkin_at == null) {
                    return;
                }

                const date = new Date(claim.checkin_at);

                if (date.getFullYear() === currentYear && date.getMonth() === monthIndex) {
                    foodClaimed.add(claim.id);
                }
            });

            monthlyActivity.push({
                month,
                foodListed: foodListed.size,
                foodClaimed: foodClaimed.size
            });
        });

        return res.status(200).json({
            stats: {
                totalUsers: users.length,
                totalProviders: users.filter((user) => (user.sub_roles || []).includes('provider')).length,
                totalReceivers: users.filter((user) => (user.sub_roles || []).includes('receiver')).length,
                totalClaims: claims.length,
                totalRestrictedUsers: users.filter((user) => user.is_restricted === true).length
            },
            users: userRecords,
            monthlyActivity
        });
    } catch (error) {
        console.error(
            "Failed to retrieve user records:",
            error
        );
        return res.status(500).json({
            error: "Failed to retrieve user records."
        });
    }
};

exports.handleRestriction = async (req, res) => {
    try {
        const { uid, is_restricted } = req.body;

        if (uid != null && typeof (is_restricted) == 'boolean') {
            await UserActivityModel.updateUserRestriction(uid, is_restricted);
            return res.status(200).json({
                message: "User restriction updated successfully"
            });
        }
        else {
            return res.status(400).json({
                error: "Invalid request"
            });
        }

    } catch (error) {
        console.error("Failed to update user restriction:", error);
        return res.status(500).json({
            error: "Failed to update user restriction."
        });
    }
};