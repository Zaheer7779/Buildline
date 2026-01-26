const { supabase, supabaseAdmin } = require('../../config/supabase');

class UserService {
    /**
     * Create a new technician (Auth User + Profile)
     */
    async createTechnician(email, password, fullName, phone) {
        console.log('UserService: Creating technician...', { email, fullName });

        // 1. Create user in Supabase Auth (using Admin client)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName,
                role: 'technician'
            }
        });

        if (authError) {
            console.error('UserService: Auth Error', authError);
            throw new Error(`Auth Error: ${authError.message}`);
        }

        console.log('UserService: Auth user created', authData.user.id);
        const userId = authData.user.id;

        // 2. Create profile in public.user_profiles
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: userId,
                email,
                full_name: fullName,
                role: 'technician',
                phone,
                is_active: true
            })
            .select()
            .single();

        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw new Error(`Profile Error: ${profileError.message}`);
        }

        return profile;
    }

    /**
     * Get all technicians
     */
    async getTechnicians() {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('role', 'technician')
            .order('full_name');

        if (error) throw error;
        return data;
    }
}

module.exports = new UserService();
