require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Config Check ---');
console.log('URL:', supabaseUrl);
if (supabaseServiceKey) {
    console.log('Service Key Found:', supabaseServiceKey.substring(0, 15) + '...');
    console.log('Key Length:', supabaseServiceKey.length);
} else {
    console.log('Service Key: MISSING');
}
console.log('--------------------');

if (!supabaseServiceKey) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testCreateUser() {
    const email = `test.tech.${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Attempting to create user: ${email}`);

    try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: 'technician',
                full_name: 'Test Technician'
            }
        });

        if (error) {
            console.error('Auth Error Full:', JSON.stringify(error, null, 2));
            console.error('Auth Error Message:', error.message);
        } else {
            console.log('User created successfully:', data.user.id);

            // Cleanup
            console.log('Cleaning up (deleting user)...');
            await supabaseAdmin.auth.admin.deleteUser(data.user.id);
            console.log('Cleanup complete.');
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

testCreateUser();
