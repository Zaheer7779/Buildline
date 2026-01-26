require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Anon Key ends with:', supabaseAnonKey ? supabaseAnonKey.slice(-10) : 'MISSING');
console.log('Service Key ends with:', supabaseServiceKey ? supabaseServiceKey.slice(-10) : 'MISSING');

async function test() {
    // Test 1: Anon Key
    console.log('\n--- Testing ANON Key ---');
    try {
        const sbAnon = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await sbAnon.from('user_profiles').select('count').limit(1);
        if (error) console.error('Anon Error:', error.message);
        else console.log('Anon Success. Data:', data);
    } catch (e) { console.error('Anon Exception:', e.message); }

    // Test 2: Service Role Key
    console.log('\n--- Testing SERVICE ROLE Key ---');
    try {
        const sbAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: data2, error: error2 } = await sbAdmin.from('user_profiles').select('count').limit(1);
        if (error2) console.error('Service Role Error:', error2.message);
        else console.log('Service Role Success. Data:', data2);
    } catch (e) { console.error('Service Role Exception:', e.message); }
}

test();
