// controllers/authController.js
const AuthModel = require('../models/authModel');
const supabase = require('../config/supabase');

exports.getRootStatus = (req, res) => {
    return res.status(200).json({ message: "FYP Dashboard Food Rescue Backend is active." });
};

exports.register = async (req, res) => {
    try {
        const { name, email, studentId, password } = req.body;

        // 1. Structural Validation Fallback
        if (!name || !email || !studentId || !password) {
            return res.status(400).json({ error: "Please fill in all required fields." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 2. Structural Campus Domain Isolation Check
        if (!normalizedEmail.endsWith('@um.edu.my') && !normalizedEmail.endsWith('@siswa.um.edu.my')) {
            return res.status(403).json({
                error: "Please use your official UM email address (@um.edu.my OR @siswa.um.edu.my)"
            });
        }

        // 3. Password Strength Server Verification
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, and one number."
            });
        }

        // 4. Create identity within Supabase Authentication Management via service role admin
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            password: password,
            email_confirm: true // Automatically verify email for administrative control flow
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        // 5. Establish structural relational data ledger profile line
        await AuthModel.registerAdminAccount({
            id: authUser.user.id,
            email: normalizedEmail,
            name: name,
            studentId: studentId
        });

        return res.status(201).json({
            message: "Registration successful! Account pending administrative authorization.",
            uid: authUser.user.id
        });

    } catch (error) {
        console.error("Exception Flow - Registration Pipeline Interrupted:", error);
        return res.status(500).json({ error: "Database Connection / Profile Mutator Execution Failure." });
    }
};

exports.handleAuthActionRedirect = (req, res) => {
    // 1. Extract security tokens generated out of the action click query string
    const { mode, oobCode, apiKey } = req.query;

    // 2. If a password reset is requested, bounce straight to the Vite client engine
    if (mode === 'resetPassword' && oobCode) {
        return res.redirect(`http://localhost:5173/reset-password?oobCode=${oobCode}&apiKey=${apiKey}`);
    }

    return res.status(400).send("Invalid or expired authentication action parameters.");
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Structural Email Format Expression Validation
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: "Invalid email syntax format provided." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Structural Campus Domain Isolation Boundary Check
        if (!normalizedEmail.endsWith('@um.edu.my') && !normalizedEmail.endsWith('@siswa.um.edu.my')) {
            return res.status(403).json({
                error: "Access Denied. You must use an official UM email address (@um.edu.my or @siswa.um.edu.my)"
            });
        }

        // Check if an admin profile exists matching this address
        const adminProfile = await AuthModel.findAdminByEmail(normalizedEmail);

        // Security Protocol Option Flow: Return a generic response to prevent user enumeration
        if (!adminProfile) {
            return res.status(200).json({ message: "If the email is registered, a reset link has been sent." });
        }

        // Trigger secure lifecycle recovery token link generation
        await AuthModel.generateRecoveryLink(normalizedEmail);

        return res.status(200).json({ message: "If the email is registered, a reset link has been sent." });

    } catch (error) {
        console.error("Exception Flow - Forgot Password Pipeline Interrupted:", error);
        return res.status(500).json({ error: "Database Connection / Query Failure. Operation stopped." });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: "Missing verification criteria parameters or password too short (min 8 characters)." });
        }

        // Exchange incoming token hash for an authenticated user session
        const { data: sessionData, error: sessionError } = await AuthModel.verifyRecoveryToken(token);

        if (sessionError) {
            return res.status(410).json({
                error: "Reset Link Expired or invalid token. Please request a new password reset link."
            });
        }

        // Overwrite user row matching target user UUID
        const targetUserUid = sessionData.user.id;
        await AuthModel.updateUserPassword(targetUserUid, newPassword);

        return res.status(200).json({ message: "Password updated successfully." });

    } catch (error) {
        console.error("Exception Flow - Critical Reset Pipeline Interrupted:", error);
        return res.status(500).json({ error: "Database Connection / Query Failure during core mutation execution." });
    }
};