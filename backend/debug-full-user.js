require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 1. Config Check
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Configuration ---');
console.log('URL:', supabaseUrl);
console.log('Anon Key Present:', !!supabaseAnonKey);
console.log('Service Key Present:', !!supabaseServiceKey);
console.log('Service Key (first 10):', supabaseServiceKey ? supabaseServiceKey.substring(0, 10) : 'N/A');

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('CRITICAL: Missing env variables');
    process.exit(1);
}

// 2. Client Init
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testFullFlow() {
    const email = `debug.tech.${Date.now()}@example.com`;
    const password = 'password123';
    const fullName = 'Debug Technician';
    const phone = '1234567890';

    console.log('\n--- Step 1: Create Auth User (Admin) ---');
    let userId;
    try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'technician'
            }
        });

        if (error) {
            console.error('STEP 1 FAILED (Auth):', error);
            return;
        }
        console.log('User created. ID:', data.user.id);
        userId = data.user.id;
    } catch (err) {
        console.error('STEP 1 EXCEPTION:', err);
        return;
    }

    console.log('\n--- Step 2: Insert Profile (Public) ---');
    try {
        const { data, error } = await supabase
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

        if (error) {
            console.error('STEP 2 FAILED (Profile):', error);
            console.log('Attempting rollback (delete auth user)...');
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return;
        }
        console.log('Profile created successfully:', data);

    } catch (err) {
        console.error('STEP 2 EXCEPTION:', err);
    }

    console.log('\n--- Cleanup ---');
    try {
        // Delete profile first (cascade usually handles this but let's be safe)
        // Actually cascade on auth.users deletion should handle profile
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log('Test user deleted.');
    } catch (err) {
        console.error('Cleanup failed:', err);
    }
}

testFullFlow();
