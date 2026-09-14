// models/authModel.js
const supabase = require('../config/supabase');

class AuthModel {
    /**
     * Registers a new administrative user record inside Supabase Auth engine 
     * and triggers structural profile insertion mapping
     */
    static async registerAdminAccount({ id, email, name, studentId }) {
        const { data, error } = await supabase
            .from('admin_profiles')
            .insert({
                id: id,
                email: email.toLowerCase(),
                name: name,
                student_id: studentId,
                status: 'pending',
                role: 'admin'
            });

        if (error) throw error;
        return data;
    }

    /**
     * Looks up an administrator by email to verify registration status
     */
    static async findAdminByEmail(email) {
        const { data, error } = await supabase
            .from('admin_profiles')
            .select('email, status')
            .eq('email', email)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    /**
     * Resolves an administrative profile configuration record from the ledger
     */
    static async findProfileById(id) {
        const { data, error } = await supabase
            .from('admin_profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    /**
     * Triggers Supabase identity manager link generation 
     */
    static async generateRecoveryLink(email) {
        const { error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: 'http://localhost:3000/reset-password'
            }
        });

        if (error) throw error;
        return true;
    }

    /**
     * Exchanges a query token hash for a live session identity instance
     */
    static async verifyRecoveryToken(tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
        });

        return { data, error };
    }

    /**
     * Runs an administrative override update on a user's password credential string
     */
    static async updateUserPassword(uid, newPassword) {
        const { error } = await supabase.auth.admin.updateUserById(uid, {
            password: newPassword
        });

        if (error) throw error;
        return true;
    }
}

module.exports = AuthModel;